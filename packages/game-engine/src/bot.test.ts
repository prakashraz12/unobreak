import { describe, expect, it } from 'vitest';
import { applyAction, createGame } from './game.js';
import { chooseBotAction } from './bot.js';
import { getPlayerView } from './view.js';
import type { GameState } from './types.js';

function cardTotal(state: GameState): number {
  return (
    state.players.reduce((n, p) => n + p.hand.length, 0) +
    state.drawPile.length +
    state.discardPile.length
  );
}

describe('getPlayerView', () => {
  it('hides other hands, the draw pile contents, and the seed', () => {
    const state = createGame({ playerIds: ['a', 'b', 'c'], seed: 11 });
    const view = getPlayerView(state, 'a');
    expect(view.hand).toHaveLength(7);
    expect(view.opponents).toHaveLength(2);
    for (const o of view.opponents) {
      expect(o.cardCount).toBe(7);
      expect(o).not.toHaveProperty('hand');
    }
    expect(view.drawPileCount).toBe(state.drawPile.length);
    expect(view).not.toHaveProperty('seed');
    expect(view.isYourTurn).toBe(true);
    expect(getPlayerView(state, 'b').isYourTurn).toBe(false);
  });
});

describe('bot simulation', () => {
  it('bots play full games with only valid actions and conserved cards', () => {
    let finished = 0;
    const games = 200;
    for (let seed = 1; seed <= games; seed++) {
      const playerCount = 2 + (seed % 3);
      const ids = Array.from({ length: playerCount }, (_, i) => `p${i}`);
      let state = createGame({ playerIds: ids, seed });
      for (let step = 0; step < 2000 && state.status === 'playing'; step++) {
        const playerId = state.players[state.currentPlayerIndex]!.id;
        const action = chooseBotAction(state, playerId);
        const result = applyAction(state, action);
        expect(
          result.ok,
          `seed ${seed} step ${step}: ${JSON.stringify(action)}`,
        ).toBe(true);
        if (!result.ok) break;
        state = result.state;
        expect(cardTotal(state)).toBe(108);
      }
      if (state.status === 'finished') finished++;
    }
    expect(finished / games).toBeGreaterThanOrEqual(0.95);
  });
});
