import type { Card, GameAction, GameState } from './types.js';

function topCard(state: GameState): Card {
  return state.discardPile[state.discardPile.length - 1]!;
}

export function matchesTop(state: GameState, card: Card): boolean {
  if (card.value === 'wild' || card.value === 'wild4') return true;
  return (
    card.color === state.currentColor || card.value === topCard(state).value
  );
}

export function canPlayCard(state: GameState, card: Card): boolean {
  if (state.status !== 'playing') return false;
  if (state.drawnCardId !== null) {
    return card.id === state.drawnCardId && matchesTop(state, card);
  }
  if (state.pendingDraw !== null) {
    if (!state.rules.allowStacking) return false;
    return (
      (state.pendingDraw.type === 'draw2' && card.value === 'draw2') ||
      (state.pendingDraw.type === 'wild4' && card.value === 'wild4')
    );
  }
  return matchesTop(state, card);
}

function playerIndex(state: GameState, playerId: string): number {
  return state.players.findIndex((p) => p.id === playerId);
}

export function hasPlayableCard(state: GameState, hand: Card[]): boolean {
  return hand.some((c) => matchesTop(state, c));
}

export function validateAction(
  state: GameState,
  action: GameAction,
): string | null {
  if (state.status !== 'playing') return 'Game is finished';
  const idx = playerIndex(state, action.playerId);
  if (idx === -1) return 'Unknown player';
  if (idx !== state.currentPlayerIndex) return 'Not your turn';
  const player = state.players[idx]!;

  switch (action.type) {
    case 'play': {
      const card = player.hand.find((c) => c.id === action.cardId);
      if (!card) return 'Card not in hand';
      const isWild = card.value === 'wild' || card.value === 'wild4';
      if (isWild && action.chosenColor === undefined) {
        return 'Wild cards require a chosenColor';
      }
      if (!isWild && action.chosenColor !== undefined) {
        return 'chosenColor is only allowed on wild cards';
      }
      if (!canPlayCard(state, card)) return 'Card is not playable';
      return null;
    }
    case 'draw': {
      if (state.pendingDraw !== null) return null;
      if (state.drawnCardId !== null) return 'Already drew a card';
      if (
        !state.rules.drawAfterPlayableCard &&
        hasPlayableCard(state, player.hand)
      ) {
        return 'You have a playable card';
      }
      return null;
    }
    case 'pass': {
      if (state.drawnCardId === null) return 'Nothing to pass';
      return null;
    }
    case 'challenge': {
      if (
        state.pendingDraw?.type !== 'wild4' ||
        state.pendingDraw.challenge === null
      ) {
        return 'Nothing to challenge';
      }
      return null;
    }
    case 'timeout': {
      return null;
    }
  }
}
