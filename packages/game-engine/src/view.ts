import type { Card, Color, GameState, PendingDraw } from './types.js';

export interface PlayerView {
  status: GameState['status'];
  winnerId: string | null;
  winningTeam: number | null;
  currentColor: Color;
  currentPlayerId: string;
  direction: 1 | -1;
  pendingDraw: PendingDraw | null;
  drawnCardId: string | null;

  myTeam: number | null;

  hand: Card[];

  partner: { id: string; hand: Card[] } | null;

  opponents: { id: string; cardCount: number; team: number | null }[];
  drawPileCount: number;
  discardPile: Card[];
  isYourTurn: boolean;
}

export function getPlayerView(state: GameState, playerId: string): PlayerView {
  const meIndex = state.players.findIndex((p) => p.id === playerId);
  const me = state.players[meIndex];
  if (!me) throw new Error(`Unknown player: ${playerId}`);
  const myTeam = state.teams?.[meIndex] ?? null;
  const partnerIndex =
    myTeam === null
      ? -1
      : state.players.findIndex(
          (p, i) => i !== meIndex && state.teams![i] === myTeam,
        );
  const partnerState =
    partnerIndex === -1 ? null : state.players[partnerIndex]!;
  const current = state.players[state.currentPlayerIndex]!;
  return {
    status: state.status,
    winnerId: state.winnerId,
    winningTeam: state.winningTeam,
    currentColor: state.currentColor,
    currentPlayerId: current.id,
    direction: state.direction,
    pendingDraw: state.pendingDraw,
    drawnCardId: state.drawnCardId,
    myTeam,
    hand: me.hand,
    partner: partnerState
      ? { id: partnerState.id, hand: [...partnerState.hand] }
      : null,
    opponents: state.players
      .map((p, i) => ({ p, i }))
      .filter(({ i }) => i !== meIndex && i !== partnerIndex)
      .map(({ p, i }) => ({
        id: p.id,
        cardCount: p.hand.length,
        team: state.teams?.[i] ?? null,
      })),
    drawPileCount: state.drawPile.length,
    discardPile: [...state.discardPile],
    isYourTurn: current.id === playerId && state.status === 'playing',
  };
}
