'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { skipToken } from '@tanstack/react-query';
import { useSocket, useSocketEvent } from '@repo/socket';
import { useLoggedInUser } from '../../../../providers/loggedin-user';
import { usePopUpToaster } from '../../../pop-up-toaster';
import { AVATARS } from '../../../avatars/presets';
import {
  useMatchControllerCreateMatch,
  useMatchControllerFindMatches,
  type MatchControllerCreateMatchVariables,
} from '../../../../services/queries-components';
import type { Match } from '../../../../services/types-schemas';
import { options, type MutationSuccessData } from '../../../../lib/utils';

const ACK_TIMEOUT_MS = 10_000;

const createVars = (type: Match['type'], requestId: string) =>
  ({ body: { type, requestId } }) as MatchControllerCreateMatchVariables;

const SOCKET_FALLBACK_MS = 3_000;

const useSoloMatch = (
  type: Match['type'] = 'SOLO',

  joinMatchId?: number,

  autoCreate = true,
) => {
  const { socket } = useSocket();
  const { user } = useLoggedInUser();
  const { triggerToast } = usePopUpToaster();
  const [matchId, setMatchId] = useState<number | null>(null);

  const [liveMatch, setLiveMatch] = useState<Match | null>(null);
  const initRef = useRef(false);
  const startedRef = useRef(false);

  const requestIdRef = useRef(
    typeof crypto !== 'undefined' ? crypto.randomUUID() : `${Date.now()}`,
  );

  const { mutate: createMatch } = useMatchControllerCreateMatch(
    options<Match & MutationSuccessData>(triggerToast, (match) => {
      setMatchId(match.id);
      setLiveMatch(match);
    }),
  );

  const create = useCallback(async (): Promise<number | null> => {
    if (matchId !== null) return matchId;
    if (!socket) {
      createMatch(createVars(type, requestIdRef.current));
      return null;
    }
    try {
      const created = (await socket
        .timeout(ACK_TIMEOUT_MS)
        .emitWithAck('match:create', {
          type,
          requestId: requestIdRef.current,
        })) as Match;
      setMatchId(created.id);
      setLiveMatch(created);
      return created.id;
    } catch {
      createMatch(createVars(type, requestIdRef.current));
      return null;
    }
  }, [socket, matchId, type, createMatch]);

  useEffect(() => {
    if (initRef.current) return;
    if (!autoCreate && joinMatchId === undefined) return;
    if (!socket) {
      if (joinMatchId !== undefined) return;
      const fallback = setTimeout(() => {
        if (!initRef.current) {
          initRef.current = true;
          createMatch(createVars(type, requestIdRef.current));
        }
      }, SOCKET_FALLBACK_MS);
      return () => clearTimeout(fallback);
    }
    initRef.current = true;
    void (async () => {
      try {
        if (joinMatchId !== undefined) {
          const joined = (await socket
            .timeout(ACK_TIMEOUT_MS)
            .emitWithAck('match:join', {
              matchId: joinMatchId,
            })) as Match;
          setMatchId(joinMatchId);
          setLiveMatch(joined);
          return;
        }
        const list = (await socket
          .timeout(ACK_TIMEOUT_MS)
          .emitWithAck('match:list')) as Match[];
        const open = list.find(
          (m) =>
            m.type === type &&
            m.players.length < 4 &&
            !m.players.some((p) => p.id === user.id),
        );
        if (!open) {
          const created = (await socket
            .timeout(ACK_TIMEOUT_MS)
            .emitWithAck('match:create', {
              type,
              requestId: requestIdRef.current,
            })) as Match;
          setMatchId(created.id);
          setLiveMatch(created);
          return;
        }
        const joined = (await socket
          .timeout(ACK_TIMEOUT_MS)
          .emitWithAck('match:join', { matchId: open.id })) as Match;
        setMatchId(open.id);
        setLiveMatch(joined);
      } catch {
        createMatch(createVars(type, requestIdRef.current));
      }
    })();
  }, [socket, user.id, createMatch, type, joinMatchId, autoCreate]);

  const matchIdRef = useRef(matchId);
  matchIdRef.current = matchId;
  useSocketEvent('match:updated', (m: Match) => {
    if (m.id === matchIdRef.current) setLiveMatch(m);
  });

  useEffect(() => {
    if (!socket) return;
    const rejoin = () => {
      const id = matchIdRef.current;
      if (id === null) return;
      socket
        .timeout(ACK_TIMEOUT_MS)
        .emitWithAck('match:join', { matchId: id })
        .then((m: Match) => setLiveMatch(m))
        .catch(() => {});
    };
    socket.on('connect', rejoin);
    return () => {
      socket.off('connect', rejoin);
    };
  }, [socket]);

  const { data: openMatches } = useMatchControllerFindMatches(
    matchId !== null && liveMatch === null ? {} : skipToken,
    { refetchInterval: 15_000 },
  );

  const match = liveMatch ?? openMatches?.find((m) => m.id === matchId) ?? null;
  const seated = match?.players ?? [];

  const seatOf = (() => {
    if (type !== 'TEAM_2V2' || match?.partnerId == null) return null;
    const map = new Map<number, number>();
    map.set(seated[0]!.id, 0);
    map.set(match.partnerId, 2);
    let next = 1;
    for (const p of seated) {
      if (!map.has(p.id)) {
        map.set(p.id, next);
        next += 2;
      }
    }
    return map;
  })();
  const mySeat =
    seatOf?.get(user.id) ??
    Math.max(
      0,
      seated.findIndex((p) => p.id === user.id),
    );
  const opponents = seated
    .map((p, joinIndex) => ({ p, seat: seatOf?.get(p.id) ?? joinIndex }))
    .filter(({ p }) => p.id !== user.id)
    .map(({ p, seat }) => ({
      ...(AVATARS.find((a) => a.id === p.avatarId) ?? AVATARS[0]!),
      userId: p.userId,
      name: p.name,
      image: p.customProfileImage,
      sameTeam:
        type === 'TEAM_2V2' && seat % 2 === mySeat % 2 ? true : undefined,
    }))
    .slice(0, 3);

  const start = useCallback(async (): Promise<number | null> => {
    if (!socket || matchId === null || startedRef.current) return null;
    startedRef.current = true;
    try {
      const { sessionId } = (await socket
        .timeout(ACK_TIMEOUT_MS)
        .emitWithAck('match:start', { matchId })) as { sessionId: number };
      return sessionId;
    } catch {
      startedRef.current = false;
      triggerToast('Could not start the game', { type: 'error' });
      return null;
    }
  }, [socket, matchId, triggerToast]);

  const leave = useCallback(() => {
    if (socket && matchId !== null) {
      socket.emit('match:leave', { matchId });
    }
  }, [socket, matchId]);

  return { matchId, match, opponents, start, leave, create };
};

export default useSoloMatch;
