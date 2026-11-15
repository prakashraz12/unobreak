'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSocket, useSocketEvent } from '@repo/socket';
import type {
  Color,
  GameAction,
  GameEvent,
  PlayerView,
} from '@repo/game-engine';
import { usePopUpToaster } from '../components/pop-up-toaster';
import { useLoggedInUser } from '../providers/loggedin-user';
import { AVATARS } from '../components/avatars/presets';
import type { BotInfo } from './use-local-game';

const ACK_TIMEOUT_MS = 10_000;

export interface ServerGamePayload {
  sessionId: number;
  view: PlayerView;
  playableCardIds: string[];
  canDraw: boolean;
  canPass: boolean;
  canChallenge: boolean;
  totalGameTime: number | null;
  turnTimeLimit: number | null;

  humans: {
    playerId: string;
    name: string;
    avatarId: number;
    image: string | null;
    team: number | null;
  }[];
  events: GameEvent[];
}

const useServerGame = (sessionId: number, paused = false) => {
  const { socket } = useSocket();
  const { user } = useLoggedInUser();
  const { triggerToast } = usePopUpToaster();
  const humanId = String(user.id);
  const [payload, setPayload] = useState<ServerGamePayload | null>(null);
  const [unoCalled, setUnoCalled] = useState(false);
  const [colorPick, setColorPick] = useState<{
    playerId: string;
    color: Color;
    key: number;
  } | null>(null);
  const sessionRef = useRef(sessionId);
  sessionRef.current = sessionId;

  const bots = useMemo<BotInfo[]>(() => {
    if (!payload) return [];
    const humanSeats = new Map(payload.humans.map((h) => [h.playerId, h]));
    const usedAvatars = new Set(
      payload.humans.map((h) => h.avatarId).concat(user.avatarId),
    );
    const pool = AVATARS.filter((a) => !usedAvatars.has(a.id));
    let botIdx = 0;

    const seats = [
      ...payload.view.opponents,
      ...(payload.view.partner ? [{ id: payload.view.partner.id }] : []),
    ];
    return seats.map((o) => {
      const human = humanSeats.get(o.id);
      if (human) {
        return {
          id: o.id,
          name: human.name,
          avatarId: human.avatarId,
          image: human.image,
        };
      }
      const avatar = pool[botIdx++ % Math.max(1, pool.length)] ?? AVATARS[0]!;
      return { id: o.id, name: avatar.name, avatarId: avatar.id };
    });
  }, [payload, user.avatarId]);

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
          case 'cardPlayed':
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
          case 'unoPenalty':
            triggerToast(
              event.playerId === humanId
                ? `You forgot to call UNO! +${event.count}`
                : `${nameOf(event.playerId)} forgot UNO! +${event.count}`,
              { type: 'info' },
            );
            break;
          case 'turnTimeout':
            break;
        }
      }
    },
    [humanId, nameOf, triggerToast],
  );

  useEffect(() => {
    if (!socket) return;
    setPayload(null);
    socket
      .timeout(ACK_TIMEOUT_MS)
      .emitWithAck('game:state', { sessionId })
      .then((p: ServerGamePayload) => setPayload(p))
      .catch(() => triggerToast('Could not load the game', { type: 'error' }));
  }, [socket, sessionId, triggerToast]);

  useSocketEvent('game:state', (p: ServerGamePayload) => {
    if (p.sessionId !== sessionRef.current) return;
    if (p.events.length) announce(p.events);
    setPayload(p);
  });

  const send = useCallback(
    async (action: GameAction) => {
      if (!socket) return false;
      try {
        const result = (await socket
          .timeout(ACK_TIMEOUT_MS)
          .emitWithAck('game:action', {
            sessionId: sessionRef.current,
            action,
          })) as { ok: true } | { ok: false; error: string };
        if (!result.ok) {
          triggerToast(result.error, { type: 'error' });
          return false;
        }
        return true;
      } catch {
        triggerToast('Could not reach the game server', { type: 'error' });
        return false;
      }
    },
    [socket, triggerToast],
  );

  const discardLen = payload?.view.discardPile.length ?? 0;
  const currentId = payload?.view.currentPlayerId;
  useEffect(() => {
    setUnoCalled(false);
  }, [currentId, discardLen]);

  const restart = useCallback(() => {
    if (!socket) return;
    socket
      .timeout(ACK_TIMEOUT_MS)
      .emitWithAck('game:restart', { sessionId: sessionRef.current })
      .then((p: ServerGamePayload) => setPayload(p))
      .catch(() =>
        triggerToast('Could not restart the game', { type: 'error' }),
      );
  }, [socket, triggerToast]);

  const turnTimeout = useCallback(() => {
    if (!currentId || currentId !== humanId) return;
    void send({ type: 'timeout', playerId: currentId });
  }, [send, currentId, humanId]);

  const play = useCallback(
    (cardId: string, chosenColor?: Color) =>
      void send({
        type: 'play',
        playerId: humanId,
        cardId,
        chosenColor,
        callUno: unoCalled,
      }),
    [send, humanId, unoCalled],
  );

  return useMemo(() => {
    if (!payload) return null;
    const gated = (v: boolean) => v && !paused;
    return {
      view: payload.view,
      bots,
      totalGameTime: payload.totalGameTime,
      turnTimeLimit: payload.turnTimeLimit,
      turnTimeout,
      playableCardIds: new Set(paused ? [] : payload.playableCardIds),
      canDraw: gated(payload.canDraw),
      canPass: gated(payload.canPass),
      canChallenge: gated(payload.canChallenge),
      unoCalled,
      colorPick,
      play,
      draw: () => void send({ type: 'draw', playerId: humanId }),
      pass: () => void send({ type: 'pass', playerId: humanId }),
      challenge: () => void send({ type: 'challenge', playerId: humanId }),
      callUno: () => setUnoCalled(true),
      restart,
    };
  }, [
    payload,
    paused,
    bots,
    turnTimeout,
    unoCalled,
    colorPick,
    play,
    send,
    humanId,
    restart,
  ]);
};

export default useServerGame;
