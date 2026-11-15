import type { UnoRules } from './rules.js';

export type Color = 'red' | 'yellow' | 'green' | 'blue';

export type CardValue =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'skip'
  | 'reverse'
  | 'draw2'
  | 'wild'
  | 'wild4';

export interface Card {
  id: string;
  color: Color | null;
  value: CardValue;
}

export interface PlayerState {
  id: string;
  hand: Card[];
}

export interface PendingDraw {
  count: number;
  type: 'draw2' | 'wild4';
  challenge: { playerId: string; colorBefore: Color } | null;
}

export interface GameState {
  rules: UnoRules;
  players: PlayerState[];

  teams: number[] | null;

  winningTeam: number | null;
  drawPile: Card[];

  discardPile: Card[];
  currentColor: Color;
  currentPlayerIndex: number;
  direction: 1 | -1;
  pendingDraw: PendingDraw | null;

  drawnCardId: string | null;
  status: 'playing' | 'finished';
  winnerId: string | null;
  seed: number;
}

export type GameAction =
  | {
      type: 'play';
      playerId: string;
      cardId: string;
      chosenColor?: Color;
      callUno?: boolean;
    }
  | { type: 'draw'; playerId: string }
  | { type: 'pass'; playerId: string }
  | { type: 'challenge'; playerId: string }
  | { type: 'timeout'; playerId: string };

export type GameEvent =
  | { type: 'cardPlayed'; playerId: string; card: Card; chosenColor?: Color }
  | { type: 'cardsDrawn'; playerId: string; count: number }
  | { type: 'turnTimeout'; playerId: string }
  | { type: 'unoPenalty'; playerId: string; count: number }
  | {
      type: 'challengeResolved';
      challengerId: string;
      targetId: string;
      success: boolean;
    }
  | { type: 'directionChanged'; direction: 1 | -1 }
  | { type: 'turnSkipped'; playerId: string }
  | { type: 'turnChanged'; playerId: string }
  | { type: 'gameOver'; winnerId: string; winningTeam: number | null };

export type ActionResult =
  | { ok: true; state: GameState; events: GameEvent[] }
  | { ok: false; error: string };
