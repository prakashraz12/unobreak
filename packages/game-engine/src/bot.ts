import { canPlayCard } from './validate-move.js';
import type { Card, Color, GameAction, GameState } from './types.js';

const COLORS: Color[] = ['red', 'yellow', 'green', 'blue'];
const ACTION_VALUES = new Set(['skip', 'reverse', 'draw2']);

function mostHeldColor(hand: Card[]): Color {
  const counts = new Map<Color, number>();
  for (const card of hand) {
    if (card.color !== null)
      counts.set(card.color, (counts.get(card.color) ?? 0) + 1);
  }
  let best: Color = 'red';
  let bestCount = -1;
  for (const color of COLORS) {
    const count = counts.get(color) ?? 0;
    if (count > bestCount) {
      best = color;
      bestCount = count;
    }
  }
  return best;
}

function rank(card: Card, currentColor: Color): number {
  if (card.color !== null && ACTION_VALUES.has(card.value)) return 0;
  if (card.color === currentColor) return 1;
  if (card.value === 'wild') return 2;
  if (card.value === 'wild4') return 3;
  return 4;
}

export function chooseBotAction(
  state: GameState,
  playerId: string,
): GameAction {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || state.status !== 'playing') {
    return { type: 'draw', playerId };
  }

  if (state.pendingDraw !== null) {
    const stack = player.hand.find((c) => canPlayCard(state, c));
    if (stack) return playAction(playerId, stack, player.hand);
    return { type: 'draw', playerId };
  }

  if (state.drawnCardId !== null) {
    const drawn = player.hand.find((c) => c.id === state.drawnCardId);
    if (drawn && canPlayCard(state, drawn)) {
      return playAction(player.id, drawn, player.hand);
    }
    return { type: 'pass', playerId };
  }

  const playable = player.hand.filter((c) => canPlayCard(state, c));
  if (playable.length === 0) return { type: 'draw', playerId };

  playable.sort(
    (a, b) => rank(a, state.currentColor) - rank(b, state.currentColor),
  );
  return playAction(player.id, playable[0]!, player.hand);
}

function playAction(playerId: string, card: Card, hand: Card[]): GameAction {
  const action: GameAction = { type: 'play', playerId, cardId: card.id };
  if (card.value === 'wild' || card.value === 'wild4') {
    action.chosenColor = mostHeldColor(hand);
  }
  if (hand.length === 2) action.callUno = true;
  return action;
}
