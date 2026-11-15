import { describe, expect, it, vi } from 'vitest';
import { createGame } from '@repo/game-engine';
import { GameRuntimeService } from './game-runtime.service.ts';
import { GameSessionStatus } from '../../common/constant.ts';
import type { GameSession } from '../game-session/game-session.entity.ts';

/**
 * Session-service stub: enqueue runs inline (callers are already
 * serialized in tests), findById hands back the live session object.
 */
const makeRuntime = (session: GameSession) => {
  const applied: string[] = [];
  const sessionService = {
    enqueue: <T>(_id: number, fn: () => Promise<T>) => fn(),
    findById: async () => session,
    currentPlayerId: (state: GameSession['state']) =>
      state.players[state.currentPlayerIndex]!.id,
    applyAction: vi.fn(async (s: GameSession, action: { type: string }) => {
      applied.push(action.type);
      return { ok: true as const, state: s.state, events: [] };
    }),
    payloadFor: () => ({}),
  };
  const runtime = new GameRuntimeService(sessionService as never);
  const emits: string[] = [];
  runtime.server = {
    to: () => ({ emit: (e: string) => emits.push(e) }),
  } as never;
  return { runtime, sessionService, applied, emits };
};

/**
 * Real engine state so chooseBotAction can pick a legal move. `firstId`
 * controls whose turn it is (seat 0 starts).
 */
const makeSession = (
  firstId = 'bot-1',
  status = GameSessionStatus.ACTIVE,
): GameSession =>
  ({
    id: 1,
    status,
    state: createGame({
      playerIds: [firstId, firstId === '9' ? 'bot-1' : '9'],
      seed: 7,
    }),
    players: [{ user: { id: 9 }, seat: 1, team: null, leftAt: null }],
  }) as unknown as GameSession;

describe('GameRuntimeService.processAction', () => {
  it('drops stale turn-timeout callbacks once the turn advanced', async () => {
    const session = makeSession('9'); // seat 9 is current now
    const { runtime, sessionService } = makeRuntime(session);
    const result = await runtime.processAction(
      1,
      { type: 'timeout', playerId: 'bot-1' },
      { expectedCurrentId: 'bot-1' },
    );
    expect(result).toEqual({ ok: false, error: 'Turn already advanced' });
    expect(sessionService.applyAction).not.toHaveBeenCalled();
  });

  it('applies the timeout while the expected seat is still current', async () => {
    const session = makeSession('bot-1');
    const { runtime, sessionService } = makeRuntime(session);
    const result = await runtime.processAction(
      1,
      { type: 'timeout', playerId: 'bot-1' },
      { expectedCurrentId: 'bot-1' },
    );
    expect(result.ok).toBe(true);
    expect(sessionService.applyAction).toHaveBeenCalledTimes(1);
  });
});

describe('GameRuntimeService.runBots', () => {
  it('a second runBots call does not start a parallel loop', async () => {
    // Bot acts once, then the game finishes — one loop, one action.
    const session = makeSession('bot-1');
    const { runtime, sessionService } = makeRuntime(session);
    sessionService.applyAction.mockImplementationOnce(async (s) => {
      s.state.status = 'finished';
      s.status = GameSessionStatus.FINISHED;
      return { ok: true as const, state: s.state, events: [] };
    });
    const first = runtime.runBots(1);
    const second = runtime.runBots(1);
    await Promise.all([first, second]);
    // Exactly one bot action ran — no duplicate loops, no double turns.
    expect(sessionService.applyAction).toHaveBeenCalledTimes(1);
  });

  it('bots never act for a human seat', async () => {
    const session = makeSession('9'); // human's turn
    const { runtime, sessionService } = makeRuntime(session);
    await runtime.runBots(1);
    expect(sessionService.applyAction).not.toHaveBeenCalled();
  });

  it('clearSession is safe to call on finished sessions', async () => {
    const session = makeSession('bot-1', GameSessionStatus.FINISHED);
    const { runtime } = makeRuntime(session);
    expect(() => runtime.clearSession(1)).not.toThrow();
    await runtime.runBots(1); // loop exits immediately on status check
  });
});
