'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  applyAction,
  chooseBotAction,
  classicRules,
  createGame,
  getPlayerView,
  type Color,
  type GameAction,
  type GameState,
} from '@repo/game-engine';
import { AVATARS } from '../components/avatars/presets';
import type { BotInfo } from './use-local-game';

const SEAT_IDS = ['demo-0', 'demo-1', 'demo-2', 'demo-3'] as const;
const BOT_DELAY_MS = 900;
const END_DELAY_MS = 4000;

const randomSeed = () => Math.floor(Math.random() * 2 ** 32);

const newGame = () =>
  createGame({
    playerIds: [...SEAT_IDS],
    rules: classicRules,
    seed: randomSeed(),
  });

const useBotDemo = (humanAvatarId = 0) => {
  const humanId = SEAT_IDS[0];
  const [state, setState] = useState<GameState>(newGame);
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
        .slice(0, 3)
        .map((a, i) => ({
          id: SEAT_IDS[i + 1]!,
          name: a.name,
          avatarId: a.id,
        })),
    [humanAvatarId],
  );

  const announce = useCallback(
    (
      events: {
        type: string;
        playerId?: string;
        chosenColor?: Color;
        card?: { value: string };
      }[],
    ) => {
      for (const event of events) {
        const value =
          event.type === 'cardPlayed' ? event.card?.value : undefined;
        if (value === 'skip' || value === 'draw2' || value === 'wild4') {
          setCardEffect({ value, key: Date.now() });
        }
        if (event.type === 'unoCalled') {
          setUnoCall({ playerId: event.playerId!, key: Date.now() });
        }
        if (event.type === 'cardPlayed' && event.chosenColor !== undefined) {
          const key = Date.now();
          setColorPick({
            playerId: event.playerId!,
            color: event.chosenColor,
            key,
          });
          setTimeout(
            () => setColorPick((p) => (p?.key === key ? null : p)),
            1800,
          );
        }
      }
    },
    [],
  );

  const apply = useCallback(
    (action: GameAction) => {
      const result = applyAction(state, action);
      if (!result.ok) return false;
      setState(result.state);
      announce(result.events);
      return true;
    },
    [state, announce],
  );

  const currentPlayerId = state.players[state.currentPlayerIndex]?.id;
  useEffect(() => {
    if (state.status !== 'playing' || !currentPlayerId) return;
    const timeout = setTimeout(() => {
      const result = applyAction(
        state,
        chooseBotAction(state, currentPlayerId),
      );
      if (!result.ok) {
        console.error('Demo bot action failed:', result.error);
        return;
      }
      setState(result.state);
      announce(result.events);
    }, BOT_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [state, currentPlayerId, announce]);

  useEffect(() => {
    if (state.status !== 'finished') return;
    const t = setTimeout(() => setState(newGame()), END_DELAY_MS);
    return () => clearTimeout(t);
  }, [state.status]);

  useEffect(() => {
    setUnoCalled(false);
  }, [state.currentPlayerIndex, state.discardPile.length]);

  const view = useMemo(() => getPlayerView(state, humanId), [state, humanId]);

  return {
    view,
    bots,
    totalGameTime: state.rules.totalGameTime,
    turnTimeLimit: state.rules.turnTimeLimit,
    turnTimeout: () =>
      apply({
        type: 'timeout',
        playerId: state.players[state.currentPlayerIndex]!.id,
      }),
    playableCardIds: new Set<string>(),
    canDraw: false,
    canPass: false,
    canChallenge: false,
    unoCalled,
    colorPick,
    unoCall,
    chat: null,
    sendChat: () => {},
    cardEffect,
    play: () => false,
    draw: () => apply({ type: 'draw', playerId: humanId }),
    pass: () => apply({ type: 'pass', playerId: humanId }),
    challenge: () => apply({ type: 'challenge', playerId: humanId }),
    callUno: () => setUnoCalled(true),
    restart: () => setState(newGame()),
  };
};

export default useBotDemo;
