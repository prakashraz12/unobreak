import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  applyAction,
  canPlayCard,
  createGame,
  getPlayerView,
  validateAction,
  type ActionResult,
  type GameAction,
  type GameEvent,
  type GameState,
  type PlayerView,
} from '@repo/game-engine';
import { GameSessionStatus, MatchType } from '../../common/constant.ts';
import { Match } from '../match/match.entity.ts';
import { User } from '../user/user.entity.ts';
import { GameSession } from './game-session.entity.ts';
import { GameSessionPlayer } from './game-session-player.entity.ts';

/** Everything a client needs to render and act, from that player's seat. */
export interface GameStatePayload {
  sessionId: number;
  view: PlayerView;
  playableCardIds: string[];
  canDraw: boolean;
  canPass: boolean;
  canChallenge: boolean;
  totalGameTime: number | null;
  turnTimeLimit: number | null;
  /** Human seats (engine playerId → identity); bot seats aren't listed. */
  humans: {
    playerId: string;
    name: string;
    avatarId: number;
    image: string | null;
    team: number | null;
  }[];
  /** Events produced by the action that led to this state (empty on load). */
  events: GameEvent[];
  /** Human seats the server is currently playing for (idle takeover). */
  autoPlayed: string[];
}

const randomSeed = () => Math.floor(Math.random() * 2 ** 31);

@Injectable()
export class GameSessionService {
  private readonly logger = new Logger(GameSessionService.name);

  /**
   * Per-session promise chains. Every state mutation for a session is
   * enqueued here so concurrent socket actions, timeouts, and bot turns can
   * never interleave load-modify-save cycles — the second action always
   * loads the state the first one persisted. The runtime is single-process
   * (turn timers/bot loops live in memory), so a process-local lock is
   * sufficient; swap for a distributed lock if that ever changes.
   */
  private readonly sessionQueues = new Map<number, Promise<void>>();

  constructor(
    @InjectRepository(GameSession)
    private readonly sessions: Repository<GameSession>,
    @InjectRepository(GameSessionPlayer)
    private readonly players: Repository<GameSessionPlayer>,
  ) {}

  /** Run `fn` exclusively against `sessionId`'s mutation pipeline. */
  enqueue<T>(sessionId: number, fn: () => Promise<T>): Promise<T> {
    const prev = this.sessionQueues.get(sessionId) ?? Promise.resolve();
    const result = prev.then(fn);
    // The stored tail never rejects so a failed action can't stall the queue.
    const tail = result.then(
      () => {},
      () => {},
    );
    this.sessionQueues.set(sessionId, tail);
    void tail.finally(() => {
      if (this.sessionQueues.get(sessionId) === tail) {
        this.sessionQueues.delete(sessionId);
      }
    });
    return result;
  }

  /**
   * Spawn a session from a match: human players seated in join order, then bot
   * seats (engine-only ids like `bot-1`) filling the table. Only humans get a
   * GameSessionPlayer row — bots have no user.
   */
  async createSession(
    match: Match,
    botIds: string[] = [],
  ): Promise<GameSession> {
    const partner =
      match.type === MatchType.TEAM_2V2 && match.partnerId !== null
        ? match.players.find((p) => p.id === match.partnerId)
        : undefined;
    /** Custom lobby: the host pinned a seat layout on the match. */
    const customSeats =
      match.type === MatchType.PRIVATE_ROOM && Array.isArray(match.seats)
        ? match.seats
        : undefined;
    /**
     * Seat assignment, engine ids in seat order. Team matches put the
     * invited partner at index 2 — across the table from the creator —
     * so teams land as seats 0&2 vs 1&3; gaps get a bot seat.
     */
    const botQueue = [...botIds];
    const playerIds: string[] = [];
    /** users.id -> seat, for the human player rows. */
    const seatOfUser = new Map<number, number>();
    if (customSeats) {
      const byPk = new Map(match.players.map((p) => [p.id, p]));
      // Seat the host's layout; stale ids (players who left) drop to bot.
      customSeats.forEach((pk, seat) => {
        const user = pk === null ? undefined : byPk.get(pk);
        if (user) seatOfUser.set(user.id, seat);
        playerIds[seat] = user ? String(user.id) : '';
      });
      // Players who joined after the layout was set take the first free
      // seats; whatever stays empty becomes a bot.
      for (const user of match.players) {
        if (seatOfUser.has(user.id)) continue;
        const seat = playerIds.indexOf('');
        if (seat === -1) break;
        seatOfUser.set(user.id, seat);
        playerIds[seat] = String(user.id);
      }
      for (let i = 0; i < playerIds.length; i++) {
        if (playerIds[i] === '') playerIds[i] = botQueue.shift()!;
      }
      for (const bot of botQueue) playerIds.push(bot);
    } else if (partner) {
      const rest = match.players.filter((p) => p.id !== partner.id);
      const seatHuman = (seat: number, user: User | undefined) => {
        if (user) seatOfUser.set(user.id, seat);
        playerIds[seat] = user ? String(user.id) : botQueue.shift()!;
      };
      seatHuman(0, rest[0]);
      seatHuman(1, rest[1]);
      seatHuman(2, partner);
      seatHuman(3, rest[2]);
      for (const bot of botQueue) playerIds.push(bot);
    } else {
      for (const user of match.players) {
        seatOfUser.set(user.id, playerIds.length);
        playerIds.push(String(user.id));
      }
      playerIds.push(...botQueue);
    }
    // 2v2 and 4-seat custom layouts seat partners across the table:
    // seats 0&2 vs 1&3. Free-for-all and 1v1 layouts have no teams.
    const teamed =
      match.type === MatchType.TEAM_2V2 || customSeats?.length === 4;
    const teams = teamed ? playerIds.map((_, seat) => seat % 2) : undefined;
    const state = createGame({ playerIds, teams, seed: randomSeed() });
    const session = this.sessions.create({
      match,
      seed: state.seed,
      state,
      status: GameSessionStatus.ACTIVE,
      players: match.players.map((user) =>
        this.players.create({
          user,
          seat: seatOfUser.get(user.id)!,
          team: teams?.[seatOfUser.get(user.id)!] ?? null,
        }),
      ),
    });
    return this.sessions.save(session);
  }

  /** Live session for a match, if one was already started. */
  findActiveByMatch(matchId: number): Promise<GameSession | null> {
    return this.sessions.findOne({
      where: { match: { id: matchId }, status: GameSessionStatus.ACTIVE },
      relations: { match: true, players: { user: true } },
    });
  }

  findById(id: number): Promise<GameSession | null> {
    return this.sessions.findOne({
      where: { id },
      relations: { match: true, players: { user: true } },
    });
  }

  isPlayer(session: GameSession, userPk: number): boolean {
    return session.players.some((p) => p.user.id === userPk);
  }

  /** Hidden-information view plus the set of legal moves for one player. */
  payloadFor(
    session: GameSession,
    userPk: number,
    events: GameEvent[] = [],
    autoPlayed: string[] = [],
  ): GameStatePayload {
    const state = session.state;
    const playerId = String(userPk);
    const view = getPlayerView(state, playerId);
    const can = (type: 'draw' | 'pass' | 'challenge') =>
      view.isYourTurn && validateAction(state, { type, playerId }) === null;
    return {
      sessionId: session.id,
      view,
      playableCardIds: view.isYourTurn
        ? view.hand.filter((c) => canPlayCard(state, c)).map((c) => c.id)
        : [],
      canDraw: can('draw'),
      canPass: can('pass'),
      canChallenge: can('challenge'),
      totalGameTime: state.rules.totalGameTime,
      turnTimeLimit: state.rules.turnTimeLimit,
      humans: session.players.map((p) => ({
        playerId: String(p.user.id),
        name: p.user.name,
        avatarId: p.user.avatarId,
        image: p.user.customProfileImage,
        team: p.team,
      })),
      events,
      autoPlayed,
    };
  }

  /**
   * Validate and apply a player action against an already-loaded session
   * entity, persist the new state on it, and close the session when the
   * engine reports a winner. Callers must hold the session queue
   * (`enqueue`) so no other action can interleave.
   */
  async applyAction(
    session: GameSession,
    action: GameAction,
  ): Promise<ActionResult> {
    if (session.status !== GameSessionStatus.ACTIVE) {
      return { ok: false, error: 'Game session is not active' };
    }

    const engineStart = performance.now();
    const result = applyAction(session.state, action);
    const engineMs = performance.now() - engineStart;
    if (!result.ok) {
      this.logger.debug(
        `session ${session.id} action ${action.type} rejected (${result.error}) engine=${engineMs.toFixed(1)}ms`,
      );
      return result;
    }

    session.state = result.state;
    if (result.state.status === 'finished') {
      session.status = GameSessionStatus.FINISHED;
      session.finishedAt = new Date();
      if (result.state.winnerId !== null) {
        // Bot seats have non-numeric ids — only humans resolve to a User row.
        const winnerPk = Number(result.state.winnerId);
        if (Number.isInteger(winnerPk)) {
          session.winner = await this.sessions.manager.findOneBy(User, {
            id: winnerPk,
          });
        }
      }
      if (result.state.winningTeam !== null) {
        // Team games: every human on the winning team places first.
        for (const player of session.players) {
          player.placement = player.team === result.state.winningTeam ? 1 : 2;
        }
      }
    }
    const saveStart = performance.now();
    await this.sessions.save(session);
    this.logger.debug(
      `session ${session.id} action ${action.type} engine=${engineMs.toFixed(1)}ms save=${(performance.now() - saveStart).toFixed(1)}ms`,
    );
    return result;
  }

  /** Same player order, fresh deal, new seed. */
  async restart(session: GameSession): Promise<GameSession> {
    session.state = createGame({
      playerIds: session.state.players.map((p) => p.id),
      teams: session.state.teams ?? undefined,
      rules: session.state.rules,
      seed: randomSeed(),
    });
    session.status = GameSessionStatus.ACTIVE;
    session.finishedAt = null;
    session.winner = null;
    return this.sessions.save(session);
  }

  /** Mark a player as having left the session (forfeit/disconnect). */
  async markLeft(sessionId: number, userPk: number): Promise<void> {
    await this.players.update(
      { session: { id: sessionId }, user: { id: userPk } },
      { leftAt: new Date() },
    );
  }

  /**
   * Termination policy: every human has left — abandon the session so bot
   * loops, turn timers, and rejoin attempts all stop.
   */
  async abandon(session: GameSession): Promise<void> {
    session.status = GameSessionStatus.ABANDONED;
    session.finishedAt = new Date();
    await this.sessions.save(session);
  }

  /** Convenience for the gateway: current turn belongs to a bot seat. */
  currentPlayerId(state: GameState): string {
    return state.players[state.currentPlayerIndex]!.id;
  }
}
