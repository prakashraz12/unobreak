'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  applyAction,
  canPlayCard,
  chooseBotAction,
  classicRules,
  createGame,
  getPlayerView,
  validateAction,
  type Color,
  type GameAction,
  type GameEvent,
  type GameState,
} from '@repo/game-engine';
import { usePopUpToaster } from '../components/pop-up-toaster';
import { AVATARS } from '../components/avatars/presets';

export const BOT_IDS = ['bot-1', 'bot-2', 'bot-3'] as const;
const BOT_DELAY_MS = 900;

export interface BotInfo {
  id: string;
  name: string;
  avatarId: number;

  image?: string | null;
}

const randomSeed = () => Math.floor(Math.random() * 2 ** 32);

const newGame = (humanId: string) =>
  createGame({
    playerIds: [humanId, ...BOT_IDS],
    rules: classicRules,
    seed: randomSeed(),
  });

const useLocalGame = (
  humanId: string,
  humanAvatarId: number,
  paused = false,
) => {
  const { triggerToast } = usePopUpToaster();
  const [state, setState] = useState<GameState>(() => newGame(humanId));
  const [unoCalled, setUnoCalled] = useState(false);

  const [unoCall, setUnoCall] = useState<{
    playerId: string;
    key: number;
  } | null>(null);
  const [colorPick, setColorPick] = useState<{
    playerId: string;
    color: Color;
    key: number;
  } | null>(null);
  const [cardEffect, setCardEffect] = useState<{
    value: 'skip' | 'draw2' | 'wild4';
    key: number;
  } | null>(null);

  const bots = useMemo<BotInfo[]>(
    () =>
      AVATARS.filter((a) => a.id !== humanAvatarId)
        .slice(0, BOT_IDS.length)
        .map((a, i) => ({ id: BOT_IDS[i]!, name: a.name, avatarId: a.id })),
    [humanAvatarId],
  );

  const nameOf = useCallback(
    (playerId: string) =>
      playerId === humanId
        ? 'You'
        : (bots.find((b) => b.id === playerId)?.name ?? playerId),
    [humanId, bots],
  );

  const announce = useCallback(
    (events: GameEvent[]) => {
      for (const event of events) {
        switch (event.type) {
          case 'cardPlayed': {
            const value = event.card.value;
            if (value === 'skip' || value === 'draw2' || value === 'wild4') {
              setCardEffect({ value, key: Date.now() });
            }
            if (event.chosenColor !== undefined) {
              const key = Date.now();
              setColorPick({
                playerId: event.playerId,
                color: event.chosenColor,
                key,
              });
              setTimeout(
                () => setColorPick((p) => (p?.key === key ? null : p)),
                1800,
              );
            }
            break;
          }
          case 'unoCalled':
            if (event.playerId !== humanId) {
              setUnoCall({ playerId: event.playerId, key: Date.now() });
            }
            break;
          case 'unoPenalty':
            triggerToast(
              event.playerId === humanId
                ? `You forgot to call UNO! +${event.count}`
                : `${nameOf(event.playerId)} forgot UNO! +${event.count}`,
              { type: 'info' },
            );
            break;
          case 'challengeResolved':
            break;
          case 'turnTimeout':
            break;
          case 'cardsDrawn':
            break;
        }
      }
    },
    [humanId, nameOf, triggerToast],
  );

  const apply = useCallback(
    (action: GameAction) => {
      const result = applyAction(state, action);
      if (!result.ok) {
        triggerToast(result.error, { type: 'error' });
        return false;
      }
      setState(result.state);
      announce(result.events);
      return true;
    },
    [state, announce, triggerToast],
  );

  const currentPlayerId = state.players[state.currentPlayerIndex]?.id;
  const activeBot = bots.find((b) => b.id === currentPlayerId);
  useEffect(() => {
    if (state.status !== 'playing' || !activeBot || paused) return;
    const timeout = setTimeout(() => {
      const result = applyAction(state, chooseBotAction(state, activeBot.id));
      if (!result.ok) {
        console.error('Bot action failed:', result.error);
        return;
      }
      setState(result.state);
      announce(result.events);
    }, BOT_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [state, activeBot, announce, paused]);

  useEffect(() => {
    setUnoCalled(false);
  }, [state.currentPlayerIndex, state.discardPile.length]);

  const view = useMemo(() => getPlayerView(state, humanId), [state, humanId]);
  const isYourTurn = view.isYourTurn;

  const playableCardIds = useMemo(
    () =>
      new Set(
        isYourTurn && !paused
          ? view.hand.filter((c) => canPlayCard(state, c)).map((c) => c.id)
          : [],
      ),
    [state, view, isYourTurn, paused],
  );

  const canAct = useCallback(
    (type: 'draw' | 'pass' | 'challenge') =>
      isYourTurn &&
      !paused &&
      validateAction(state, { type, playerId: humanId }) === null,
    [state, isYourTurn, humanId, paused],
  );

  const play = useCallback(
    (cardId: string, chosenColor?: Color) =>
      apply({
        type: 'play',
        playerId: humanId,
        cardId,
        chosenColor,
        callUno: unoCalled,
      }),
    [apply, humanId, unoCalled],
  );

  const restart = useCallback(() => {
    setState(newGame(humanId));
    setUnoCalled(false);
  }, [humanId]);

  const turnTimeout = useCallback(
    () =>
      apply({
        type: 'timeout',
        playerId: state.players[state.currentPlayerIndex]!.id,
      }),
    [apply, state],
  );

  return {
    view,
    bots,
    totalGameTime: state.rules.totalGameTime,
    turnTimeLimit: state.rules.turnTimeLimit,
    turnTimeout,
    playableCardIds,
    canDraw: canAct('draw'),
    canPass: canAct('pass'),
    canChallenge: canAct('challenge'),
    unoCalled,
    colorPick,
    unoCall,
    chat: null,
    sendChat: () => {},
    cardEffect,
    play,
    draw: () => apply({ type: 'draw', playerId: humanId }),
    pass: () => apply({ type: 'pass', playerId: humanId }),
    challenge: () => apply({ type: 'challenge', playerId: humanId }),
    callUno: () => setUnoCalled(true),
    restart,
  };
};

export default useLocalGame;
