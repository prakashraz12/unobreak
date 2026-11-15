import { Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Server } from 'socket.io';
import {
  chooseBotAction,
  type ActionResult,
  type GameAction,
  type GameEvent,
} from '@repo/game-engine';
import { GameSessionStatus } from '../../common/constant.ts';
import { GameSession } from '../game-session/game-session.entity.ts';
import { GameSessionService } from '../game-session/game-session.service.ts';
import { userRoom } from './socket-helpers.ts';

const BOT_DELAY_MS = 900;
/** A human who doesn't act within this window is taken over by the bot. */
const IDLE_TAKEOVER_MS = 15_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Server-side game runtime shared by both gateways: pushes per-player views,
 * plays bot seats on a delay, and enforces the authoritative turn clock.
 * `server` is bound by GameGateway during afterInit — both gateways share the
 * same namespace, so emitting here reaches every client.
 */
@Injectable()
export class GameRuntimeService {
  private readonly logger = new Logger(GameRuntimeService.name);

  server!: Server;

  /** Sessions currently running their bot-turn loop — one loop each. */
  private readonly botLoops = new Set<number>();
  /** Per-session turn deadline enforced server-side. */
  private readonly turnTimers = new Map<number, NodeJS.Timeout>();
  /** Per-session idle clock that hands a stalled human seat to the bot. */
  private readonly idleTimers = new Map<number, NodeJS.Timeout>();
  /** Human seats currently being played by the bot, per session. */
  private readonly autoPlay = new Map<number, Set<string>>();

  constructor(private readonly sessionService: GameSessionService) {}

  /**
   * The single action pipeline — human plays, bot turns, and server-side
   * timeouts all flow through here. One SELECT, one UPDATE, serialized per
   * session by `enqueue` so a racing action always sees the freshest state.
   *
   * `opts.userPk` — when set, the caller must be seated (gateway check).
   * `opts.expectedCurrentId` — when set, the action is dropped unless that
   * seat is still current when the lock is held (timeout arming).
   */
  async processAction(
    sessionId: number,
    action: GameAction,
    opts: { userPk?: number; expectedCurrentId?: string } = {},
  ): Promise<ActionResult> {
    const started = performance.now();
    return this.sessionService.enqueue(sessionId, async () => {
      const loadStart = performance.now();
      const session = await this.sessionService.findById(sessionId);
      const loadMs = performance.now() - loadStart;
      if (!session) {
        if (opts.userPk === undefined) {
          return { ok: false, error: 'Game session not found' };
        }
        throw new WsException(`Game session ${sessionId} not found`);
      }
      if (opts.userPk !== undefined) {
        const validStart = performance.now();
        const isPlayer = this.sessionService.isPlayer(session, opts.userPk);
        this.logger.debug(
          `session ${sessionId} validate=${(performance.now() - validStart).toFixed(1)}ms`,
        );
        if (!isPlayer) {
          throw new WsException(`Game session ${sessionId} not found`);
        }
      }
      if (
        opts.expectedCurrentId !== undefined &&
        this.sessionService.currentPlayerId(session.state) !==
          opts.expectedCurrentId
      ) {
        return { ok: false, error: 'Turn already advanced' };
      }
      const result = await this.sessionService.applyAction(session, action);
      let broadcastMs = 0;
      if (result.ok) {
        const broadcastStart = performance.now();
        await this.broadcastViews(session, result.events);
        broadcastMs = performance.now() - broadcastStart;
      }
      this.logger.debug(
        `session ${sessionId} action ${action.type} load=${loadMs.toFixed(1)}ms broadcast=${broadcastMs.toFixed(1)}ms total=${(performance.now() - started).toFixed(1)}ms`,
      );
      return result;
    });
  }

  /**
   * Send each human player their own hidden-information state payload.
   * Uses the entity the action pipeline just saved — no re-fetch, so a
   * broadcast can never race a stale snapshot either.
   */
  async broadcastViews(session: GameSession, events: GameEvent[] = []) {
    const viewStart = performance.now();
    const payloads = session.players.map((player) => ({
      userId: player.user.id,
      payload: this.sessionService.payloadFor(
        session,
        player.user.id,
        events,
        this.autoPlayedIn(session.id),
      ),
    }));
    const viewMs = performance.now() - viewStart;
    const emitStart = performance.now();
    for (const { userId, payload } of payloads) {
      this.server.to(userRoom(userId)).emit('game:state', payload);
    }
    this.armTurnTimer(session);
    this.armIdleTimer(session);
    this.logger.debug(
      `session ${session.id} views=${viewMs.toFixed(1)}ms emit=${(performance.now() - emitStart).toFixed(1)}ms`,
    );
  }

  /**
   * While it's a bot seat's turn, pick its action after a delay, persist, and
   * push fresh views — the same pacing the client-side bots use. The delay
   * sits outside the session queue; only the mutate step is serialized.
   */
  async runBots(sessionId: number) {
    if (this.botLoops.has(sessionId)) return;
    this.botLoops.add(sessionId);
    try {
      for (;;) {
        await sleep(BOT_DELAY_MS);
        const step = await this.sessionService
          .enqueue(sessionId, async () => {
            const session = await this.sessionService.findById(sessionId);
            if (!session || session.status !== GameSessionStatus.ACTIVE) {
              return { done: true };
            }
            const currentId = this.sessionService.currentPlayerId(
              session.state,
            );
            if (!this.isAutoSeat(sessionId, currentId)) return { done: true };
            const result = await this.sessionService.applyAction(
              session,
              chooseBotAction(session.state, currentId),
            );
            if (!result.ok) return { done: true };
            await this.broadcastViews(session, result.events);
            return { done: result.state.status === 'finished' };
          })
          .catch((err) => {
            // Runs detached via void — never let a transient failure crash the
            // process; the next player action re-enters the loop anyway.
            this.logger.error(`Bot loop failed for session ${sessionId}:`, err);
            return { done: true };
          });
        if (step.done) break;
      }
    } finally {
      this.botLoops.delete(sessionId);
    }
  }

  /**
   * Tear down a session's timers: pending turn clock and the bot-loop flag.
   * Called when a session finishes, restarts, or is abandoned.
   */
  clearSession(sessionId: number) {
    for (const timers of [this.turnTimers, this.idleTimers]) {
      const timer = timers.get(sessionId);
      if (timer) clearTimeout(timer);
      timers.delete(sessionId);
    }
    this.botLoops.delete(sessionId);
    this.autoPlay.delete(sessionId);
  }

  autoPlayedIn(sessionId: number): string[] {
    return [...(this.autoPlay.get(sessionId) ?? [])];
  }

  /**
   * The player pressed Cancel on "Played by Computer": hand the seat back
   * and push fresh views, which re-arms the idle clock for their turn.
   */
  async resumeControl(sessionId: number, playerId: string) {
    await this.sessionService.enqueue(sessionId, async () => {
      if (!this.autoPlay.get(sessionId)?.delete(playerId)) return;
      const session = await this.sessionService.findById(sessionId);
      if (session) await this.broadcastViews(session);
    });
  }

  private isAutoSeat(sessionId: number, playerId: string) {
    return (
      playerId.startsWith('bot-') ||
      (this.autoPlay.get(sessionId)?.has(playerId) ?? false)
    );
  }

  /**
   * If a human seat sits idle past IDLE_TAKEOVER_MS (or the turn limit, when
   * shorter), the bot takes the seat over until the player cancels.
   */
  private armIdleTimer(session: GameSession) {
    const existing = this.idleTimers.get(session.id);
    if (existing) clearTimeout(existing);
    this.idleTimers.delete(session.id);
    if (session.status !== GameSessionStatus.ACTIVE) return;
    const expectedId = this.sessionService.currentPlayerId(session.state);
    if (this.isAutoSeat(session.id, expectedId)) return;
    const limit = session.state.rules.turnTimeLimit;
    const delay =
      limit === null
        ? IDLE_TAKEOVER_MS
        : Math.min(IDLE_TAKEOVER_MS, limit * 1000);
    const timer = setTimeout(() => {
      void this.sessionService
        .enqueue(session.id, async () => {
          const fresh = await this.sessionService.findById(session.id);
          if (
            !fresh ||
            fresh.status !== GameSessionStatus.ACTIVE ||
            this.sessionService.currentPlayerId(fresh.state) !== expectedId
          ) {
            return false;
          }
          const seats = this.autoPlay.get(session.id) ?? new Set<string>();
          seats.add(expectedId);
          this.autoPlay.set(session.id, seats);
          await this.broadcastViews(fresh);
          return true;
        })
        .then((took) => {
          if (took) void this.runBots(session.id);
        })
        .catch((err) =>
          this.logger.error(
            `Idle takeover failed for session ${session.id}:`,
            err,
          ),
        );
    }, delay);
    this.idleTimers.set(session.id, timer);
  }

  /**
   * Authoritative turn clock: if the seat that was current when this armed is
   * still current when it fires, the server forfeits their turn itself — a
   * closed or stalled client can no longer freeze the table. The re-check
   * happens inside the session queue, so it can't race a just-applied move.
   */
  private armTurnTimer(session: GameSession) {
    const existing = this.turnTimers.get(session.id);
    if (existing) clearTimeout(existing);
    this.turnTimers.delete(session.id);
    if (session.status !== GameSessionStatus.ACTIVE) return;
    const limit = session.state.rules.turnTimeLimit;
    if (limit === null) return;
    const expectedId = this.sessionService.currentPlayerId(session.state);
    const timer = setTimeout(
      () => {
        void this.processAction(
          session.id,
          {
            type: 'timeout',
            playerId: expectedId,
          },
          { expectedCurrentId: expectedId },
        )
          .then((result) => {
            if (result.ok) void this.runBots(session.id);
          })
          .catch((err) =>
            this.logger.error(
              `Turn timeout failed for session ${session.id}:`,
              err,
            ),
          );
      },
      limit * 1000 + 500,
    );
    this.turnTimers.set(session.id, timer);
  }
}
