import { describe, expect, it } from 'vitest';
import { applyAction, createGame } from './game.js';
import { classicRules } from './rules.js';
import type { UnoRules } from './rules.js';
import type { Card, Color, CardValue, GameState } from './types.js';

function card(id: string, color: Color | null, value: CardValue): Card {
  return { id, color, value };
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    rules: { ...classicRules },
    players: [
      { id: 'a', hand: [card('a-1', 'red', '1')] },
      { id: 'b', hand: [card('b-1', 'blue', '2')] },
    ],
    drawPile: [
      card('d-1', 'green', '3'),
      card('d-2', 'yellow', '4'),
      card('d-3', 'red', '6'),
      card('d-4', 'blue', '7'),
      card('d-5', 'green', '8'),
    ],
    discardPile: [card('top', 'red', '5')],
    currentColor: 'red',
    currentPlayerIndex: 0,
    direction: 1,
    pendingDraw: null,
    drawnCardId: null,
    status: 'playing',
    winnerId: null,
    teams: null,
    winningTeam: null,
    seed: 1,
    ...overrides,
  };
}

function currentId(state: GameState): string {
  return state.players[state.currentPlayerIndex]!.id;
}

describe('createGame', () => {
  it('deals 7 cards each and starts on a number card', () => {
    const state = createGame({ playerIds: ['a', 'b', 'c'], seed: 5 });
    for (const p of state.players) expect(p.hand).toHaveLength(7);
    const top = state.discardPile[0]!;
    expect(/^[0-9]$/.test(top.value)).toBe(true);
    expect(state.currentColor).toBe(top.color);
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.direction).toBe(1);
    const total =
      state.players.reduce((n, p) => n + p.hand.length, 0) +
      state.drawPile.length +
      state.discardPile.length;
    expect(total).toBe(108);
  });

  it('throws for invalid player counts and duplicate ids', () => {
    expect(() => createGame({ playerIds: ['a'] })).toThrow();
    expect(() =>
      createGame({ playerIds: ['a', 'b', 'c', 'd', 'e'] }),
    ).toThrow();
    expect(() => createGame({ playerIds: ['a', 'a'] })).toThrow();
  });

  it('is deterministic for the same seed', () => {
    const a = createGame({ playerIds: ['x', 'y'], seed: 9 });
    const b = createGame({ playerIds: ['x', 'y'], seed: 9 });
    expect(a).toEqual(b);
  });
});

describe('validation', () => {
  it('rejects actions from the wrong player', () => {
    const r = applyAction(makeState(), { type: 'draw', playerId: 'b' });
    expect(r).toEqual({ ok: false, error: 'Not your turn' });
  });

  it('rejects playing a card not in hand', () => {
    const r = applyAction(makeState(), {
      type: 'play',
      playerId: 'a',
      cardId: 'nope',
    });
    expect(r.ok).toBe(false);
  });

  it('rejects an unplayable card', () => {
    const state = makeState({
      players: [
        { id: 'a', hand: [card('a-1', 'blue', '3')] },
        { id: 'b', hand: [] },
      ],
    });
    const r = applyAction(state, {
      type: 'play',
      playerId: 'a',
      cardId: 'a-1',
    });
    expect(r).toEqual({ ok: false, error: 'Card is not playable' });
  });

  it('requires chosenColor on wilds and forbids it otherwise', () => {
    const wildState = makeState({
      players: [
        { id: 'a', hand: [card('w', null, 'wild')] },
        { id: 'b', hand: [] },
      ],
    });
    expect(
      applyAction(wildState, { type: 'play', playerId: 'a', cardId: 'w' }).ok,
    ).toBe(false);
    const state = makeState();
    expect(
      applyAction(state, {
        type: 'play',
        playerId: 'a',
        cardId: 'a-1',
        chosenColor: 'blue',
      }).ok,
    ).toBe(false);
  });

  it('only allows the just-drawn card to be played after drawing', () => {
    const state = makeState({
      rules: { ...classicRules, drawAfterPlayableCard: true },
      players: [
        { id: 'a', hand: [card('a-1', 'blue', '3'), card('a-2', 'red', '9')] },
        { id: 'b', hand: [card('b-1', 'blue', '2')] },
      ],
      drawPile: [card('d-1', 'red', '4')],
    });
    const drawn = applyAction(state, { type: 'draw', playerId: 'a' });
    expect(drawn.ok).toBe(true);
    if (!drawn.ok) return;
    expect(drawn.state.drawnCardId).toBe('d-1');
    const bad = applyAction(drawn.state, {
      type: 'play',
      playerId: 'a',
      cardId: 'a-2',
    });
    expect(bad.ok).toBe(false);
    const good = applyAction(drawn.state, {
      type: 'play',
      playerId: 'a',
      cardId: 'd-1',
    });
    expect(good.ok).toBe(true);
  });
});

describe('card effects', () => {
  const rules3 = (o?: Partial<GameState>) =>
    makeState({
      players: [
        {
          id: 'a',
          hand: [card('a-skip', 'red', 'skip'), card('a-1', 'red', '1')],
        },
        { id: 'b', hand: [card('b-1', 'blue', '2')] },
        { id: 'c', hand: [card('c-1', 'green', '3')] },
      ],
      ...o,
    });

  it('skip skips the next player', () => {
    const r = applyAction(rules3(), {
      type: 'play',
      playerId: 'a',
      cardId: 'a-skip',
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(currentId(r.state)).toBe('c');
    expect(
      r.events.some((e) => e.type === 'turnSkipped' && e.playerId === 'b'),
    ).toBe(true);
  });

  it('reverse flips direction with 3 players', () => {
    const state = rules3({
      players: [
        {
          id: 'a',
          hand: [card('a-rev', 'red', 'reverse'), card('a-1', 'red', '1')],
        },
        { id: 'b', hand: [card('b-1', 'blue', '2')] },
        { id: 'c', hand: [card('c-1', 'green', '3')] },
      ],
    });
    const r = applyAction(state, {
      type: 'play',
      playerId: 'a',
      cardId: 'a-rev',
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.direction).toBe(-1);
    expect(currentId(r.state)).toBe('c');
  });

  it('reverse acts as skip with 2 players', () => {
    const state = makeState({
      players: [
        {
          id: 'a',
          hand: [card('a-rev', 'red', 'reverse'), card('a-1', 'red', '1')],
        },
        { id: 'b', hand: [card('b-1', 'blue', '2')] },
      ],
    });
    const r = applyAction(state, {
      type: 'play',
      playerId: 'a',
      cardId: 'a-rev',
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(currentId(r.state)).toBe('a');
  });

  it('draw2 makes the next player draw 2 and lose their turn', () => {
    const state = makeState({
      players: [
        {
          id: 'a',
          hand: [card('a-d2', 'red', 'draw2'), card('a-1', 'red', '1')],
        },
        { id: 'b', hand: [card('b-1', 'blue', '2')] },
      ],
    });
    const played = applyAction(state, {
      type: 'play',
      playerId: 'a',
      cardId: 'a-d2',
    });
    expect(played.ok).toBe(true);
    if (!played.ok) return;
    expect(played.state.pendingDraw).toMatchObject({ count: 2, type: 'draw2' });
    expect(currentId(played.state)).toBe('b');
    const drawn = applyAction(played.state, { type: 'draw', playerId: 'b' });
    expect(drawn.ok).toBe(true);
    if (!drawn.ok) return;
    const b = drawn.state.players[1]!;
    expect(b.hand).toHaveLength(3);
    expect(drawn.state.pendingDraw).toBeNull();
    expect(currentId(drawn.state)).toBe('a');
  });

  it('honors allowStacking on and off', () => {
    const base = {
      pendingDraw: { count: 2, type: 'draw2' as const, challenge: null },
      currentPlayerIndex: 1,
      players: [
        { id: 'a', hand: [card('a-1', 'red', '1')] },
        {
          id: 'b',
          hand: [card('b-d2', 'blue', 'draw2'), card('b-2', 'green', '4')],
        },
      ],
    };
    const off = applyAction(
      makeState({ ...base, rules: { ...classicRules, allowStacking: false } }),
      { type: 'play', playerId: 'b', cardId: 'b-d2' },
    );
    expect(off.ok).toBe(false);
    const on = applyAction(
      makeState({ ...base, rules: { ...classicRules, allowStacking: true } }),
      { type: 'play', playerId: 'b', cardId: 'b-d2' },
    );
    expect(on.ok).toBe(true);
    if (!on.ok) return;
    expect(on.state.pendingDraw?.count).toBe(4);
  });

  it('wild sets the current color', () => {
    const state = makeState({
      players: [
        { id: 'a', hand: [card('w', null, 'wild'), card('a-1', 'red', '1')] },
        { id: 'b', hand: [card('b-1', 'blue', '2')] },
      ],
    });
    const r = applyAction(state, {
      type: 'play',
      playerId: 'a',
      cardId: 'w',
      chosenColor: 'green',
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.currentColor).toBe('green');
  });
});

describe('wild4 challenge', () => {
  const challengedState = (targetHand: Card[]) =>
    makeState({
      players: [
        { id: 'a', hand: [card('a-1', 'red', '1')] },
        { id: 'b', hand: targetHand },
      ],
      currentPlayerIndex: 0,
      drawPile: Array.from({ length: 10 }, (_, i) =>
        card(`d-${i}`, 'green', String(i % 10) as CardValue),
      ),
      pendingDraw: {
        count: 4,
        type: 'wild4',
        challenge: { playerId: 'b', colorBefore: 'red' },
      },
    });

  it('succeeds when the target held the color before the wild4', () => {
    const r = applyAction(challengedState([card('b-1', 'red', '9')]), {
      type: 'challenge',
      playerId: 'a',
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.events.find((e) => e.type === 'challengeResolved')).toMatchObject({
      success: true,
      targetId: 'b',
    });
    expect(r.state.players[1]!.hand).toHaveLength(5);
    expect(r.state.pendingDraw).toBeNull();
    expect(currentId(r.state)).toBe('a');
  });

  it('fails when the target had no matching color', () => {
    const r = applyAction(challengedState([card('b-1', 'blue', '9')]), {
      type: 'challenge',
      playerId: 'a',
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.events.find((e) => e.type === 'challengeResolved')).toMatchObject({
      success: false,
    });
    expect(r.state.players[0]!.hand).toHaveLength(7);
    expect(currentId(r.state)).toBe('b');
  });

  it('is rejected when there is nothing to challenge', () => {
    const r = applyAction(makeState(), { type: 'challenge', playerId: 'a' });
    expect(r.ok).toBe(false);
  });
});

describe('uno and winning', () => {
  const unoState = (callUno?: boolean) => ({
    state: makeState({
      players: [
        { id: 'a', hand: [card('a-1', 'red', '1'), card('a-2', 'red', '2')] },
        { id: 'b', hand: [card('b-1', 'blue', '2')] },
      ],
    }),
    callUno,
  });

  it('applies the penalty when callUno is missing', () => {
    const { state } = unoState();
    const r = applyAction(state, {
      type: 'play',
      playerId: 'a',
      cardId: 'a-1',
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.players[0]!.hand).toHaveLength(3);
    expect(r.events.some((e) => e.type === 'unoPenalty')).toBe(true);
  });

  it('skips the penalty when callUno is true', () => {
    const { state } = unoState(true);
    const r = applyAction(state, {
      type: 'play',
      playerId: 'a',
      cardId: 'a-1',
      callUno: true,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.players[0]!.hand).toHaveLength(1);
  });

  it('finishes the game on an empty hand and rejects further actions', () => {
    const state = makeState();
    const r = applyAction(state, {
      type: 'play',
      playerId: 'a',
      cardId: 'a-1',
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.status).toBe('finished');
    expect(r.state.winnerId).toBe('a');
    expect(r.events.some((e) => e.type === 'gameOver')).toBe(true);
    expect(applyAction(r.state, { type: 'draw', playerId: 'b' }).ok).toBe(
      false,
    );
  });
});

describe('team games (2v2)', () => {
  it('records the winning team when a seat empties its hand', () => {
    const state = makeState({
      players: [
        { id: 'a', hand: [card('a-1', 'red', '1')] },
        { id: 'b', hand: [card('b-1', 'blue', '2')] },
        { id: 'c', hand: [card('c-1', 'green', '3')] },
        { id: 'd', hand: [card('d-1', 'yellow', '4')] },
      ],
      teams: [0, 1, 0, 1],
    });
    const r = applyAction(state, {
      type: 'play',
      playerId: 'a',
      cardId: 'a-1',
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.status).toBe('finished');
    expect(r.state.winnerId).toBe('a');
    expect(r.state.winningTeam).toBe(0);
    expect(r.events).toContainEqual({
      type: 'gameOver',
      winnerId: 'a',
      winningTeam: 0,
    });
  });

  it('rejects a teams array that does not match the player count', () => {
    expect(() =>
      createGame({ playerIds: ['a', 'b'], teams: [0, 1, 0] }),
    ).toThrow();
  });
});

describe('draw action', () => {
  it('rejects a voluntary draw while holding a playable card', () => {
    const r = applyAction(makeState(), { type: 'draw', playerId: 'a' });
    expect(r).toEqual({ ok: false, error: 'You have a playable card' });
  });

  it('allows drawing a playable card, which may then be played or passed', () => {
    const state = makeState({
      rules: { ...classicRules, drawAfterPlayableCard: true },
      drawPile: [card('d-1', 'red', '7')],
    });
    const drawn = applyAction(state, { type: 'draw', playerId: 'a' });
    expect(drawn.ok).toBe(true);
    if (!drawn.ok) return;
    expect(drawn.state.drawnCardId).toBe('d-1');
    expect(currentId(drawn.state)).toBe('a');
    const passed = applyAction(drawn.state, { type: 'pass', playerId: 'a' });
    expect(passed.ok).toBe(true);
    if (!passed.ok) return;
    expect(passed.state.drawnCardId).toBeNull();
    expect(currentId(passed.state)).toBe('b');
  });

  it('rejects a second draw and rejects pass without a drawn card', () => {
    const state = makeState({
      rules: { ...classicRules, drawAfterPlayableCard: true },
      drawPile: [card('d-1', 'red', '7'), card('d-2', 'blue', '1')],
    });
    const drawn = applyAction(state, { type: 'draw', playerId: 'a' });
    expect(drawn.ok).toBe(true);
    if (!drawn.ok) return;
    expect(applyAction(drawn.state, { type: 'draw', playerId: 'a' }).ok).toBe(
      false,
    );
    expect(applyAction(makeState(), { type: 'pass', playerId: 'a' }).ok).toBe(
      false,
    );
  });

  it('passes the turn when the drawn card is not playable', () => {
    const state = makeState({
      players: [
        { id: 'a', hand: [card('a-1', 'blue', '3')] },
        { id: 'b', hand: [card('b-1', 'blue', '2')] },
      ],
      drawPile: [card('d-1', 'green', '4')],
    });
    const r = applyAction(state, { type: 'draw', playerId: 'a' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.drawnCardId).toBeNull();
    expect(currentId(r.state)).toBe('b');
  });

  it('reshuffles the discard pile when the draw pile is empty', () => {
    const state = makeState({
      players: [
        { id: 'a', hand: [card('a-1', 'blue', '3')] },
        { id: 'b', hand: [card('b-1', 'blue', '2')] },
      ],
      drawPile: [],
      discardPile: [
        card('x', 'red', '5'),
        card('y', 'green', '6'),
        card('z', 'blue', '7'),
      ],
      seed: 3,
    });
    const r = applyAction(state, { type: 'draw', playerId: 'a' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.players[0]!.hand).toHaveLength(2);
    const total =
      r.state.players.reduce((n, p) => n + p.hand.length, 0) +
      r.state.drawPile.length +
      r.state.discardPile.length;
    expect(total).toBe(5);
    expect(r.state.discardPile[r.state.discardPile.length - 1]!.id).toBe('z');
  });

  it('keeps drawing until playable when allowDrawUntilPlayable is on', () => {
    const state = makeState({
      rules: { ...classicRules, allowDrawUntilPlayable: true },
      players: [
        { id: 'a', hand: [card('a-1', 'blue', '3')] },
        { id: 'b', hand: [card('b-1', 'blue', '2')] },
      ],
      drawPile: [card('d-1', 'green', '4'), card('d-2', 'yellow', '5')],
    });
    const r = applyAction(state, { type: 'draw', playerId: 'a' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.players[0]!.hand).toHaveLength(3);
    expect(r.state.drawnCardId).toBe('d-2');
  });
});

describe('timeout', () => {
  it('passes the turn to the next player', () => {
    const state = makeState();
    const r = applyAction(state, { type: 'timeout', playerId: 'a' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(currentId(r.state)).toBe('b');
    expect(r.events).toContainEqual({ type: 'turnTimeout', playerId: 'a' });
    expect(r.state.players[0]!.hand).toHaveLength(1);
  });

  it('is rejected for a player whose turn it is not', () => {
    const r = applyAction(makeState(), { type: 'timeout', playerId: 'b' });
    expect(r.ok).toBe(false);
  });

  it('takes the pending draw before passing', () => {
    const state = makeState({
      pendingDraw: { count: 4, type: 'wild4', challenge: null },
    });
    const r = applyAction(state, { type: 'timeout', playerId: 'a' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.players[0]!.hand).toHaveLength(5);
    expect(r.state.pendingDraw).toBeNull();
    expect(currentId(r.state)).toBe('b');
  });

  it('clears the drawn-card lock when passing after a draw', () => {
    const state = makeState({ drawnCardId: 'a-1' });
    const r = applyAction(state, { type: 'timeout', playerId: 'a' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.drawnCardId).toBeNull();
    expect(currentId(r.state)).toBe('b');
  });
});
