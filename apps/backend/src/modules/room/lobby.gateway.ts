import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service.ts';
import type { JwtPayload } from '../auth/auth.types.ts';
import { Match } from '../match/match.entity.ts';
import { MatchService } from '../match/match.service.ts';
import { MatchStatus, MatchType } from '../../common/constant.ts';
import { GameSessionService } from '../game-session/game-session.service.ts';
import type { GameSession } from '../game-session/game-session.entity.ts';
import { UserService } from '../user/user.service.ts';
import { GameRuntimeService } from './game-runtime.service.ts';
import { RealtimeService } from './realtime.service.ts';
import {
  authenticateSocket,
  gameRoom,
  LOBBY_ROOM,
  matchRoom,
  userRoom,
  type AuthedSocket,
} from './socket-helpers.ts';

const SEATS = 4;
/** Server-authoritative countdown before a 2v2 ticket auto-starts. */
const TEAM_START_DELAY_MS = 15_000;
/** Public queue lifetime — solo tickets expire server-side after 2 min. */
const MATCHMAKING_TTL_MS = Number(process.env.MATCHMAKING_TTL_MS ?? 120_000);
/**
 * Reconnect grace: a dropped socket's tickets and online status survive
 * this long, so a refresh doesn't kick the player out of their lobby.
 */
const RECONNECT_GRACE_MS = Number(process.env.RECONNECT_GRACE_MS ?? 20_000);
/** PostgreSQL unique-violation code. */
const PG_UNIQUE_VIOLATION = '23505';

/**
 * Lobby traffic: connection/auth, presence, and match tickets
 * (create/list/join/leave/start). Live game events live in GameGateway.
 */
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()) ?? true,
    credentials: true,
  },
})
export class LobbyGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  /** matchId -> pending auto-start/expiry timer and deadline. */
  private readonly matchTimers = new Map<number, NodeJS.Timeout>();
  private readonly deadlines = new Map<number, number>();
  /** userPk -> pending disconnect-grace timer (last socket dropped). */
  private readonly graceTimers = new Map<number, NodeJS.Timeout>();

  constructor(
    private readonly authService: AuthService,
    private readonly matchService: MatchService,
    private readonly sessionService: GameSessionService,
    private readonly userService: UserService,
    private readonly gameRuntime: GameRuntimeService,
    private readonly realtime: RealtimeService,
  ) {}

  afterInit(server: Server) {
    this.realtime.server = server;
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const { payload, wasOnline } = await authenticateSocket(
        client,
        this.authService,
      );
      await client.join(LOBBY_ROOM);
      // Reconnect inside the grace window cancels the pending logout —
      // tickets and presence were never torn down.
      const grace = this.graceTimers.get(payload.sub);
      if (grace) {
        clearTimeout(grace);
        this.graceTimers.delete(payload.sub);
      }
      if (!wasOnline) {
        await this.userService.setOnline(payload.sub, true);
        this.server.to(LOBBY_ROOM).emit('presence:update', {
          userId: payload.userId,
          isOnline: true,
        });
      }
      client.emit('lobby:joined');
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const user = (client.data as { user?: JwtPayload }).user;
    if (!user) return;
    // Other live sockets for this account keep the user online and seated.
    if (this.server.sockets.adapter.rooms.has(userRoom(user.sub))) return;
    // Grace period: mark offline / abandon tickets only if they stay gone.
    const timer = setTimeout(() => {
      void this.expireDisconnected(user).catch((err) =>
        console.error(`Disconnect cleanup failed for ${user.sub}:`, err),
      );
    }, RECONNECT_GRACE_MS);
    this.graceTimers.set(user.sub, timer);
  }

  /** Runs after the reconnect grace elapses with no new socket. */
  private async expireDisconnected(user: JwtPayload) {
    this.graceTimers.delete(user.sub);
    if (this.server.sockets.adapter.rooms.has(userRoom(user.sub))) return;
    await this.userService.setOnline(user.sub, false);
    this.server.to(LOBBY_ROOM).emit('presence:update', {
      userId: user.userId,
      isOnline: false,
    });
    // A vanished client abandons any matches it was still seated in.
    for (const match of await this.matchService.findOpenByPlayer(user.sub)) {
      const cancelled = await this.matchService.setStatus(
        match.id,
        MatchStatus.CANCELLED,
      );
      this.server
        .to([matchRoom(match.id), LOBBY_ROOM])
        .emit('match:updated', cancelled);
    }
  }

  /**
   * Create a matchmaking ticket. Idempotent via `requestId` — a retried
   * request (lost ack, HTTP fallback) returns the same match. Solo tickets
   * get a server-side expiry deadline; when it fires the ticket launches
   * itself with bots filling the seats.
   */
  @SubscribeMessage('match:create')
  async create(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody('type') type?: MatchType,
    @MessageBody('requestId') requestId?: string,
  ): Promise<Match> {
    const match = await this.matchService.createMatch(
      client.data.user.userId,
      type && Object.values(MatchType).includes(type) ? type : MatchType.SOLO,
      requestId,
      MATCHMAKING_TTL_MS,
    );
    await client.join(matchRoom(match.id));
    this.server.to(LOBBY_ROOM).emit('match:open', match);
    // Expired tickets created by a retry must not re-arm.
    if (
      match.status === MatchStatus.FINDING &&
      match.expiresAt !== null &&
      !this.matchService.isExpired(match)
    ) {
      this.armDeadline(match.id, match.expiresAt.getTime());
    }
    return match;
  }

  /**
   * Host pressed Start in a team lobby: begin the shared search countdown —
   * enemies get the deadline window to join, then the match launches with
   * bots filling empty seats.
   */
  @SubscribeMessage('match:search')
  async search(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody('matchId') matchId: number,
  ): Promise<{ ok: true }> {
    const match = await this.matchService.findById(matchId);
    if (!match || match.status !== MatchStatus.FINDING) {
      throw new WsException(`Match ${matchId} not found`);
    }
    if (!match.players.some((p) => p.id === client.data.user.sub)) {
      throw new WsException('You are not in this match');
    }
    // If another team pair is already searching, merge them as the enemy
    // team and launch a real 4-player game instead of waiting for bots.
    if (match.type === MatchType.TEAM_2V2) {
      const rival = (
        await this.matchService.findSearchingTeamMatches(matchId)
      ).find(
        (m) =>
          this.deadlines.has(m.id) &&
          !m.players.some((p) => match.players.some((q) => q.id === p.id)),
      );
      if (rival) {
        this.clearDeadline(rival.id);
        await this.matchService.setStatus(rival.id, MatchStatus.CANCELLED);
        const merged = await this.matchService.addPlayers(match, rival.players);
        await this.launchMatch(merged);
        return { ok: true };
      }
    }
    this.armDeadline(match.id, Date.now() + TEAM_START_DELAY_MS);
    return { ok: true };
  }

  @SubscribeMessage('match:list')
  list(): Promise<Match[]> {
    return this.matchService.findMatch();
  }

  @SubscribeMessage('match:join')
  async join(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody('matchId') matchId: number,
  ): Promise<Match> {
    const match = await this.matchService.joinMatch(
      matchId,
      client.data.user.userId,
    );
    await client.join(matchRoom(match.id));
    this.server
      .to([matchRoom(match.id), LOBBY_ROOM])
      .emit('match:updated', match);
    // Late joiners get the server deadline so every client counts down
    // against the same clock.
    const deadlineAt =
      this.deadlines.get(match.id) ?? match.expiresAt?.getTime();
    if (deadlineAt !== undefined) {
      client.emit('match:deadline', { matchId: match.id, deadlineAt });
    }
    // A full public table starts immediately — no waiting on the clock.
    if (
      (match.type === MatchType.TEAM_2V2 || match.type === MatchType.SOLO) &&
      match.players.length >= SEATS
    ) {
      await this.launchMatch(match);
    }
    return match;
  }

  /**
   * Invite an online friend into your match. The invitee gets a `match:invite`
   * push on their user room; accepting means a normal `match:join`. For team
   * matches the first invitee becomes the creator's partner (seat 2).
   */
  @SubscribeMessage('match:invite')
  async invite(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody('matchId') matchId: number,
    @MessageBody('userId') userId: number,
  ): Promise<{ ok: true }> {
    const { match, target } = await this.matchService.invite(
      matchId,
      client.data.user.sub,
      userId,
    );
    if (!this.realtime.isOnline(target.id)) {
      throw new WsException('That player is not online');
    }
    const from = match.players.find((p) => p.id === client.data.user.sub)!;
    this.realtime.toUser(target.id, 'match:invite', {
      matchId: match.id,
      type: match.type,
      from: {
        userId: from.userId,
        name: from.name,
        avatarId: from.avatarId,
      },
    });
    return { ok: true };
  }

  /**
   * Invitee declined (or let the invite expire): tell the inviter, but only
   * if they're actually seated in that match — no spoofed notifications.
   */
  @SubscribeMessage('match:decline')
  async decline(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody('matchId') matchId: number,
    @MessageBody('fromUserId') fromUserId: number,
  ): Promise<{ ok: true }> {
    const [match, inviter, me] = await Promise.all([
      this.matchService.findById(matchId),
      this.userService.findByUserId(fromUserId),
      this.userService.findById(client.data.user.sub),
    ]);
    if (
      match &&
      inviter &&
      me &&
      match.players.some((p) => p.id === inviter.id)
    ) {
      this.realtime.toUserIfOnline(inviter.id, 'match:declined', {
        matchId,
        by: { userId: me.userId, name: me.name },
      });
    }
    return { ok: true };
  }

  /**
   * Host arranges a custom lobby: `seats` is a 4-slot layout of users.id
   * (null = bot) — even seats are Team A, odd seats Team B — or null for
   * free-for-all. Broadcast so every seated client renders the same teams.
   */
  @SubscribeMessage('match:configure')
  async configure(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody('matchId') matchId: number,
    @MessageBody('seats') seats: (number | null)[] | null,
  ): Promise<Match> {
    const match = await this.matchService.configure(
      matchId,
      client.data.user.sub,
      seats ?? null,
    );
    this.server
      .to([matchRoom(match.id), LOBBY_ROOM])
      .emit('match:updated', match);
    return match;
  }

  @SubscribeMessage('match:leave')
  async leave(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody('matchId') matchId: number,
  ): Promise<void> {
    await client.leave(matchRoom(matchId));
    const match = await this.matchService.findById(matchId);
    if (
      match?.status !== MatchStatus.FINDING ||
      !match.players.some((p) => p.id === client.data.user.sub)
    ) {
      return;
    }
    // The creator backing out dissolves the ticket; a member just frees
    // their seat.
    const isCreator = match.players[0]?.id === client.data.user.sub;
    const remaining = match.players.filter(
      (p) => p.id !== client.data.user.sub,
    );
    if (isCreator || remaining.length === 0) {
      const cancelled = await this.matchService.setStatus(
        matchId,
        MatchStatus.CANCELLED,
      );
      this.clearDeadline(matchId);
      this.server
        .to([matchRoom(matchId), LOBBY_ROOM])
        .emit('match:updated', cancelled);
      return;
    }
    const updated = await this.matchService.removePlayer(
      matchId,
      client.data.user.sub,
    );
    if (updated) {
      this.server
        .to([matchRoom(matchId), LOBBY_ROOM])
        .emit('match:updated', updated);
    }
  }

  /**
   * Turn a matchmaking ticket into a live game: any seated player may start.
   * Idempotent — racing or repeated starts return the same sessionId.
   */
  @SubscribeMessage('match:start')
  async start(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody('matchId') matchId: number,
  ): Promise<{ sessionId: number }> {
    const match = await this.matchService.findById(matchId);
    if (!match) {
      throw new WsException(`Match ${matchId} not found`);
    }
    if (!match.players.some((p) => p.id === client.data.user.sub)) {
      throw new WsException('You are not in this match');
    }
    // Team and custom matches are started by the creator; a partner who
    // never joined simply leaves their seat to a bot.
    if (
      (match.type === MatchType.TEAM_2V2 ||
        match.type === MatchType.PRIVATE_ROOM) &&
      match.players[0]?.id !== client.data.user.sub
    ) {
      throw new WsException('Only the match creator can start');
    }
    const session = await this.launchMatch(match);
    await client.join(gameRoom(session.id));
    return { sessionId: session.id };
  }

  /**
   * Arm a server-side deadline on a ticket: solo expiry launches the match,
   * team search deadlines do the same after their window. Everyone in the
   * match room is told the deadline so all countdowns share one clock.
   */
  private armDeadline(matchId: number, deadlineAt: number) {
    this.clearDeadline(matchId);
    this.deadlines.set(matchId, deadlineAt);
    const delay = Math.max(0, deadlineAt - Date.now());
    this.matchTimers.set(
      matchId,
      setTimeout(() => {
        void (async () => {
          const match = await this.matchService.findById(matchId);
          this.clearDeadline(matchId);
          // Cancelled matches and ones already launched stay untouched.
          if (!match || match.status !== MatchStatus.FINDING) return;
          if (await this.sessionService.findActiveByMatch(matchId)) return;
          await this.launchMatch(match);
        })().catch((err) =>
          console.error(`Deadline launch failed for match ${matchId}:`, err),
        );
      }, delay),
    );
    this.server.to(matchRoom(matchId)).emit('match:deadline', {
      matchId,
      deadlineAt,
    });
    // Also push to each seated player's user room — a socket that missed
    // matchRoom (reconnect/fallback join) still gets the shared clock.
    void this.matchService.findById(matchId).then((match) => {
      for (const p of match?.players ?? []) {
        this.realtime.toUserIfOnline(p.id, 'match:deadline', {
          matchId,
          deadlineAt,
        });
      }
    });
  }

  private clearDeadline(matchId: number) {
    const timer = this.matchTimers.get(matchId);
    if (timer) clearTimeout(timer);
    this.matchTimers.delete(matchId);
    this.deadlines.delete(matchId);
  }

  /**
   * Spawn the session for a match and push everyone into it. Atomic:
   * markJoined flips FINDING -> JOINED under a row lock — a racing call
   * gets null and returns the session the winner created instead of
   * spawning a duplicate. The partial unique index on
   * game_sessions(matchId) is the last line of defence.
   */
  private async launchMatch(match: Match): Promise<GameSession> {
    this.clearDeadline(match.id);
    const transitioned = await this.matchService.markJoined(match.id);
    const existing = transitioned
      ? null
      : await this.sessionService.findActiveByMatch(match.id);
    if (!transitioned) {
      // Already launched (or cancelled) — hand back the live session.
      if (existing) return existing;
      const current = await this.matchService.findById(match.id);
      if (current?.status === MatchStatus.JOINED) {
        // JOINED but no session yet: the winner is mid-create. Wait a beat
        // and look again before giving up.
        await new Promise((r) => setTimeout(r, 150));
        const retry = await this.sessionService.findActiveByMatch(match.id);
        if (retry) return retry;
      }
      throw new WsException(`Match ${match.id} is not joinable`);
    }
    // Custom lobbies may pin a smaller table (2 seats for 1v1).
    const seatCount = match.seats?.length ?? SEATS;
    const bots = Array.from(
      { length: Math.max(0, seatCount - match.players.length) },
      (_, i) => `bot-${i + 1}`,
    );
    let session: GameSession;
    try {
      session = await this.sessionService.createSession(transitioned, bots);
    } catch (err) {
      // Unique-index conflict means a racing launcher won — use its game.
      if (
        (err as { driverError?: { code?: string } }).driverError?.code ===
        PG_UNIQUE_VIOLATION
      ) {
        const won = await this.sessionService.findActiveByMatch(match.id);
        if (won) return won;
      }
      throw err;
    }
    const updated = transitioned;
    this.server
      .to([matchRoom(match.id), LOBBY_ROOM])
      .emit('match:updated', updated);
    // Push game:started only to players actually seated in the session —
    // a trimmed custom lobby (e.g. switched to 1v1) may hold non-seated
    // players who should stay behind.
    const seated = new Set(
      session.players?.map((p) => p.user.id) ?? match.players.map((p) => p.id),
    );
    for (const p of match.players) {
      this.realtime.toUserIfOnline(p.id, 'match:updated', updated);
      if (!seated.has(p.id)) continue;
      this.realtime.toUserIfOnline(p.id, 'game:started', {
        sessionId: session.id,
      });
    }
    await this.gameRuntime.broadcastViews(session);
    void this.gameRuntime.runBots(session.id);
    return session;
  }
}
