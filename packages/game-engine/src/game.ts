import { createDeck } from './deck.js';
import { shuffle } from './shuffle.js';
import { matchesTop, validateAction } from './validate-move.js';
import { classicRules } from './rules.js';
import type { UnoRules } from './rules.js';
import type {
  ActionResult,
  Card,
  GameAction,
  GameEvent,
  GameState,
} from './types.js';

export interface CreateGameOptions {
  playerIds: string[];
  rules?: UnoRules;
  seed?: number;

  teams?: number[];
}

export function createGame(options: CreateGameOptions): GameState {
  const rules = options.rules ?? classicRules;
  const { playerIds } = options;
  if (
    playerIds.length < rules.minPlayers ||
    playerIds.length > rules.maxPlayers
  ) {
    throw new Error(
      `Player count must be between ${rules.minPlayers} and ${rules.maxPlayers}, got ${playerIds.length}`,
    );
  }
  if (new Set(playerIds).size !== playerIds.length) {
    throw new Error('Player ids must be unique');
  }
  if (
    options.teams !== undefined &&
    options.teams.length !== playerIds.length
  ) {
    throw new Error('teams must have one entry per player');
  }

  const { cards: shuffled, seed } = shuffle(createDeck(), options.seed ?? 1);
  const drawPile = [...shuffled];
  const players = playerIds.map((id) => ({ id, hand: [] as Card[] }));
  for (let round = 0; round < rules.startingHandSize; round++) {
    for (const player of players) {
      player.hand.push(drawPile.shift()!);
    }
  }

  let first = drawPile.shift()!;
  while (first.color === null || !/^[0-9]$/.test(first.value)) {
    drawPile.push(first);
    first = drawPile.shift()!;
  }

  return {
    rules,
    players,
    teams: options.teams ?? null,
    winningTeam: null,
    drawPile,
    discardPile: [first],
    currentColor: first.color,
    currentPlayerIndex: 0,
    direction: 1,
    pendingDraw: null,
    drawnCardId: null,
    status: 'playing',
    winnerId: null,
    seed,
  };
}

function cloneState(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map((p) => ({ ...p, hand: [...p.hand] })),
    drawPile: [...state.drawPile],
    discardPile: [...state.discardPile],
    pendingDraw: state.pendingDraw
      ? {
          ...state.pendingDraw,
          challenge: state.pendingDraw.challenge && {
            ...state.pendingDraw.challenge,
          },
        }
      : null,
  };
}

function nextIndex(state: GameState, fromIndex: number, steps = 1): number {
  const n = state.players.length;
  return (fromIndex + state.direction * steps + n * steps) % n;
}

function setTurn(state: GameState, toIndex: number, events: GameEvent[]): void {
  state.currentPlayerIndex = toIndex;
  state.drawnCardId = null;
  events.push({ type: 'turnChanged', playerId: state.players[toIndex]!.id });
}

function ensureDrawPile(state: GameState): void {
  if (state.drawPile.length > 0 || state.discardPile.length <= 1) return;
  const top = state.discardPile.pop()!;
  const { cards, seed } = shuffle(state.discardPile, state.seed);
  state.drawPile = cards;
  state.discardPile = [top];
  state.seed = seed;
}

function drawCards(
  state: GameState,
  playerIndex: number,
  count: number,
): number {
  const hand = state.players[playerIndex]!.hand;
  let drawn = 0;
  while (drawn < count) {
    ensureDrawPile(state);
    const card = state.drawPile.shift();
    if (!card) break;
    hand.push(card);
    drawn++;
  }
  return drawn;
}

function applyPlay(
  state: GameState,
  action: Extract<GameAction, { type: 'play' }>,
  events: GameEvent[],
): void {
  const idx = state.currentPlayerIndex;
  const player = state.players[idx]!;
  const cardIndex = player.hand.findIndex((c) => c.id === action.cardId);
  const card = player.hand[cardIndex]!;
  player.hand.splice(cardIndex, 1);
  state.discardPile.push(card);

  const isWild = card.value === 'wild' || card.value === 'wild4';
  const colorBefore = state.currentColor;
  state.currentColor = isWild ? action.chosenColor! : card.color!;
  events.push({
    type: 'cardPlayed',
    playerId: player.id,
    card,
    chosenColor: action.chosenColor,
  });

  if (player.hand.length === 0) {
    state.status = 'finished';
    state.winnerId = player.id;
    state.winningTeam = state.teams?.[idx] ?? null;
    events.push({
      type: 'gameOver',
      winnerId: player.id,
      winningTeam: state.winningTeam,
    });
    return;
  }

  if (player.hand.length === 1) {
    if (action.callUno === true) {
      events.push({ type: 'unoCalled', playerId: player.id });
    } else {
      const count = drawCards(state, idx, state.rules.unoPenaltyCards);
      events.push({ type: 'unoPenalty', playerId: player.id, count });
    }
  }

  switch (card.value) {
    case 'skip': {
      const skipped = nextIndex(state, idx);
      events.push({
        type: 'turnSkipped',
        playerId: state.players[skipped]!.id,
      });
      setTurn(state, nextIndex(state, idx, 2), events);
      return;
    }
    case 'reverse': {
      state.direction = state.direction === 1 ? -1 : 1;
      events.push({ type: 'directionChanged', direction: state.direction });

      setTurn(
        state,
        nextIndex(state, idx, state.players.length === 2 ? 2 : 1),
        events,
      );
      return;
    }
    case 'draw2':
      state.pendingDraw = {
        count: (state.pendingDraw?.count ?? 0) + 2,
        type: 'draw2',
        challenge: null,
      };
      setTurn(state, nextIndex(state, idx), events);
      return;
    case 'wild4':
      state.pendingDraw = {
        count: (state.pendingDraw?.count ?? 0) + 4,
        type: 'wild4',
        challenge: state.rules.wildDrawFourChallenge
          ? { playerId: player.id, colorBefore }
          : null,
      };
      setTurn(state, nextIndex(state, idx), events);
      return;
    default:
      setTurn(state, nextIndex(state, idx), events);
  }
}

function applyDraw(
  state: GameState,
  action: Extract<GameAction, { type: 'draw' }>,
  events: GameEvent[],
): void {
  const idx = state.currentPlayerIndex;
  if (state.pendingDraw !== null) {
    const count = drawCards(state, idx, state.pendingDraw.count);
    state.pendingDraw = null;
    events.push({ type: 'cardsDrawn', playerId: action.playerId, count });
    setTurn(state, nextIndex(state, idx), events);
    return;
  }

  const drawn: Card[] = [];
  do {
    const before = state.players[idx]!.hand.length;
    drawCards(state, idx, 1);
    const after = state.players[idx]!.hand;
    if (after.length === before) break;
    drawn.push(after[after.length - 1]!);
  } while (
    state.rules.allowDrawUntilPlayable &&
    !matchesTop(state, drawn[drawn.length - 1]!)
  );

  events.push({
    type: 'cardsDrawn',
    playerId: action.playerId,
    count: drawn.length,
  });

  const last = drawn[drawn.length - 1];
  if (last !== undefined && matchesTop(state, last)) {
    state.drawnCardId = last.id;
    return;
  }
  setTurn(state, nextIndex(state, idx), events);
}

function applyChallenge(
  state: GameState,
  action: Extract<GameAction, { type: 'challenge' }>,
  events: GameEvent[],
): void {
  const idx = state.currentPlayerIndex;
  const pending = state.pendingDraw!;
  const { playerId: targetId, colorBefore } = pending.challenge!;
  const target = state.players.find((p) => p.id === targetId)!;
  const success = target.hand.some((c) => c.color === colorBefore);
  events.push({
    type: 'challengeResolved',
    challengerId: action.playerId,
    targetId,
    success,
  });

  if (success) {
    const count = drawCards(
      state,
      state.players.indexOf(target),
      pending.count,
    );
    events.push({ type: 'cardsDrawn', playerId: targetId, count });
  } else {
    const count = drawCards(state, idx, pending.count + 2);
    events.push({ type: 'cardsDrawn', playerId: action.playerId, count });
    setTurn(state, nextIndex(state, idx), events);
  }
  state.pendingDraw = null;
}

function applyTimeout(
  state: GameState,
  action: Extract<GameAction, { type: 'timeout' }>,
  events: GameEvent[],
): void {
  const idx = state.currentPlayerIndex;
  events.push({ type: 'turnTimeout', playerId: action.playerId });
  if (state.pendingDraw !== null) {
    const count = drawCards(state, idx, state.pendingDraw.count);
    state.pendingDraw = null;
    events.push({ type: 'cardsDrawn', playerId: action.playerId, count });
  }
  setTurn(state, nextIndex(state, idx), events);
}

export function applyAction(
  state: GameState,
  action: GameAction,
): ActionResult {
  const error = validateAction(state, action);
  if (error !== null) return { ok: false, error };

  const next = cloneState(state);
  const events: GameEvent[] = [];

  switch (action.type) {
    case 'play':
      applyPlay(next, action, events);
      break;
    case 'draw':
      applyDraw(next, action, events);
      break;
    case 'pass':
      setTurn(next, nextIndex(next, next.currentPlayerIndex), events);
      break;
    case 'challenge':
      applyChallenge(next, action, events);
      break;
    case 'timeout':
      applyTimeout(next, action, events);
      break;
  }

  return { ok: true, state: next, events };
}
