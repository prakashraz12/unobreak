import { describe, expect, it } from 'vitest';
import {
  applyAction,
  canPlayCard,
  createGame,
  getPlayerView,
  type GameState,
} from '@repo/game-engine';
import { GameSessionStatus } from '../../common/constant.ts';
import type { GameSession } from './game-session.entity.ts';
import { GameSessionService } from './game-session.service.ts';

/**
 * A fake repository pair: `findOne` hands out the single stored entity,
 * `save` simulates slow persistence and flags any concurrent save calls.
 */
const makeService = (session: GameSession) => {
  let stored = session;
  let savesInFlight = 0;
  let overlappingSave = false;
  const sessions = {
    findOne: async () => stored,
    save: async (s: GameSession) => {
      savesInFlight += 1;
      if (savesInFlight > 1) overlappingSave = true;
      await new Promise((r) => setTimeout(r, 5));
      stored = s;
      savesInFlight -= 1;
      return s;
    },
    manager: { findOneBy: async () => null },
  };
  const players = { update: async () => ({}) };
  const service = new GameSessionService(sessions as never, players as never);
  return { service, hadOverlap: () => overlappingSave };
};

const humanPlayer = (id: number, seat: number, team: number | null) => ({
  id,
  seat,
  team,
  placement: null,
  leftAt: null,
  user: {
    id,
    userId: id,
    name: `P${id}`,
    avatarId: 1,
    customProfileImage: null,
  },
});

const makeSession = (teams?: number[]): GameSession =>
  ({
    id: 1,
    seed: 1,
    status: GameSessionStatus.ACTIVE,
    finishedAt: null,
    winner: null,
    state: createGame({
      playerIds: ['1', '2', '3', '4'],
      teams,
      seed: 42,
    }),
    players: [1, 2, 3, 4].map((id, seat) =>
      humanPlayer(id, seat, teams ? teams[seat]! : null),
    ),
  }) as unknown as GameSession;

const playableAction = (state: GameState) => {
  const player = state.players[state.currentPlayerIndex]!;
  const card = player.hand.find((c) => canPlayCard(state, c))!;
  return { type: 'play' as const, playerId: player.id, cardId: card.id };
};

describe('GameSessionService pipeline', () => {
  it('serializes concurrent actions — no overlapping saves, no stale writes', async () => {
    const { service, hadOverlap } = makeService(makeSession());
    const state = (await service.findById(1))!.state;
    const a1 = playableAction(state);
    const a2 = playableAction(state);

    // Same-turn actions from two seats: at most one can win; both must run
    // sequentially and the second must see the first's persisted state.
    const [r1, r2] = await Promise.all([
      service.enqueue(1, async () => {
        const s = await service.findById(1);
        return service.applyAction(s!, a1);
      }),
      service.enqueue(1, async () => {
        const s = await service.findById(1);
        return service.applyAction(s!, a2);
      }),
    ]);

    expect(hadOverlap()).toBe(false);
    // Exactly one action was legal against the freshest state.
    expect([r1.ok, r2.ok].filter(Boolean)).toHaveLength(1);
    const final = await service.findById(1);
    // The loser action must NOT have resurrected the old state.
    expect(final!.state).not.toBe(state);
  });

  it('a failing action does not stall the session queue', async () => {
    const { service } = makeService(makeSession());
    await expect(
      service.enqueue(1, async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    const s = await service.findById(1);
    const r = await service.enqueue(1, () =>
      service.applyAction(s!, playableAction(s!.state)),
    );
    expect(r.ok).toBe(true);
  });

  it('rejects actions on a finished session', async () => {
    const session = makeSession();
    session.status = GameSessionStatus.FINISHED;
    const { service } = makeService(session);
    const r = await service.applyAction(session, {
      type: 'draw',
      playerId: '1',
    });
    expect(r).toEqual({ ok: false, error: 'Game session is not active' });
  });

  it('2v2: emptying a hand marks the whole team first place', async () => {
    const session = makeSession([0, 1, 0, 1]);
    const { service } = makeService(session);
    // Leave the current player (seat 0, team 0) one playable card.
    const me = session.state.players[0]!;
    me.hand = [me.hand.find((c) => canPlayCard(session.state, c))!];
    const result = await service.applyAction(session, {
      type: 'play',
      playerId: me.id,
      cardId: me.hand[0]!.id,
    });
    if (!result.ok) throw new Error('expected play to succeed');
    expect(result.state.status).toBe('finished');
    expect(result.state.winningTeam).toBe(0);
    expect(session.players.map((p) => p.placement)).toEqual([1, 2, 1, 2]);
    expect(session.status).toBe(GameSessionStatus.FINISHED);
  });

  it('bot seats apply actions through the same entity path', async () => {
    const session = makeSession();
    const { service } = makeService(session);
    const action = playableAction(session.state);
    // Engine-level equivalent: same input through service vs raw engine must
    // agree — the service adds persistence, not different rules.
    const direct = applyAction(session.state, action);
    const viaService = await service.applyAction(session, action);
    expect(viaService.ok).toBe(direct.ok);
    if (viaService.ok && direct.ok) {
      expect(viaService.state).toEqual(direct.state);
    }
  });

  it("private views never leak other players' cards", async () => {
    const session = makeSession([0, 1, 0, 1]);
    const { service } = makeService(session);
    const payload = service.payloadFor(session, 1);
    const view = getPlayerView(session.state, '1');
    // Partner (seat 2, same team) hand is visible; opponents are counts only.
    expect(payload.view.partner?.hand.length).toBe(
      session.state.players[2]!.hand.length,
    );
    for (const opp of view.opponents) {
      expect(opp).not.toHaveProperty('hand');
    }
    expect(payload.humans).toHaveLength(4);
  });
});

/**
 * createSession seat composition — the human/bot mix the lobby promises.
 * sessions.create/save echo their input; players.create builds a stub row.
 */
const makeCreator = () => {
  const sessions = {
    create: (cfg: unknown) => cfg,
    save: async (s: GameSession) => s,
    manager: { findOneBy: async () => null },
  };
  const players = { create: (cfg: unknown) => cfg };
  const service = new GameSessionService(sessions as never, players as never);
  return service;
};

const matchWith = (
  humanIds: number[],
  overrides: Record<string, unknown> = {},
) => ({
  id: 7,
  type: 'SOLO',
  partnerId: null,
  seats: null,
  players: humanIds.map((id) => ({ id }) as never),
  ...overrides,
});

describe('GameSessionService.createSession seating', () => {
  const seatIds = (s: GameSession) => s.state.players.map((p) => p.id);

  it('1 human + 3 bots fills the table', async () => {
    const s = await makeCreator().createSession(matchWith([1]) as never, [
      'bot-1',
      'bot-2',
      'bot-3',
    ]);
    expect(seatIds(s)).toEqual(['1', 'bot-1', 'bot-2', 'bot-3']);
    expect(s.state.teams).toBeNull(); // SOLO stays free-for-all
    expect(s.players).toHaveLength(1);
  });

  it.each([
    [
      [1, 2],
      ['bot-1', 'bot-2'],
      ['1', '2', 'bot-1', 'bot-2'],
    ],
    [[1, 2, 3], ['bot-1'], ['1', '2', '3', 'bot-1']],
    [[1, 2, 3, 4], [], ['1', '2', '3', '4']],
  ])('humans %j + bots %j seats as %j', async (humans, bots, expected) => {
    const s = await makeCreator().createSession(
      matchWith(humans as number[]) as never,
      bots as string[],
    );
    expect(seatIds(s)).toEqual(expected);
    expect(s.players).toHaveLength((humans as number[]).length);
  });

  it('bot ids can never collide with a real user id', async () => {
    const s = await makeCreator().createSession(matchWith([1]) as never, [
      'bot-1',
      'bot-2',
      'bot-3',
    ]);
    for (const id of seatIds(s).slice(1)) {
      expect(Number.isInteger(Number(id))).toBe(false);
    }
  });

  it('custom 4-seat layout seats humans by layout, teams as seat%2', async () => {
    const s = await makeCreator().createSession(
      matchWith([1, 2, 3], {
        type: 'PRIVATE_ROOM',
        seats: [1, 2, 3, null],
      }) as never,
      ['bot-1'],
    );
    expect(seatIds(s)).toEqual(['1', '2', '3', 'bot-1']);
    expect(s.state.teams).toEqual([0, 1, 0, 1]);
    expect(s.players.map((p) => p.team)).toEqual([0, 1, 0]);
  });

  it('custom 2-seat layout makes a 2-player FFA duel (no bots, no teams)', async () => {
    const s = await makeCreator().createSession(
      matchWith([1, 2], {
        type: 'PRIVATE_ROOM',
        seats: [1, 2],
      }) as never,
      [],
    );
    expect(seatIds(s)).toEqual(['1', '2']);
    expect(s.state.teams).toBeNull();
  });

  it('late joiners of a custom lobby fill the layout’s null seats', async () => {
    // Host pinned seats before player 4 joined — p4 lands on the free seat.
    const s = await makeCreator().createSession(
      matchWith([1, 2, 4], {
        type: 'PRIVATE_ROOM',
        seats: [1, 2, null, null],
      }) as never,
      ['bot-1'],
    );
    expect(seatIds(s)).toEqual(['1', '2', '4', 'bot-1']);
  });

  it('2v2 partner is seated across the table (seat 2), teams 0&2 vs 1&3', async () => {
    const s = await makeCreator().createSession(
      matchWith([1, 2, 3], {
        type: 'TEAM_2V2',
        partnerId: 3,
      }) as never,
      ['bot-1'],
    );
    expect(seatIds(s)).toEqual(['1', '2', '3', 'bot-1']);
    expect(s.state.teams).toEqual([0, 1, 0, 1]);
  });
});
