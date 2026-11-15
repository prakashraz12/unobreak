'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSocket, useSocketEvent } from '@repo/socket';
import type { Match } from '../services/types-schemas';
import { usePopUpToaster } from '../components/pop-up-toaster';

const ACK_TIMEOUT_MS = 10_000;

const useMatch = () => {
  const { socket, isConnected } = useSocket();
  const { triggerToast } = usePopUpToaster();
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);

  const refreshMatches = useCallback(() => {
    if (!socket) return;
    socket
      .timeout(ACK_TIMEOUT_MS)
      .emitWithAck('match:list')
      .then((list: Match[]) => setMatches(list))
      .catch(() =>
        triggerToast('Could not load open matches', { type: 'error' }),
      );
  }, [socket, triggerToast]);

  useSocketEvent('lobby:joined', refreshMatches);

  useEffect(() => {
    if (!isConnected) setMatches([]);
  }, [isConnected]);

  useSocketEvent('match:open', (match: Match) => {
    setMatches((prev) =>
      prev.some((m) => m.id === match.id) ? prev : [...prev, match],
    );
  });

  useSocketEvent('match:updated', (match: Match) => {
    setMatches((prev) =>
      match.status === 'FINDING'
        ? prev.map((m) => (m.id === match.id ? match : m))
        : prev.filter((m) => m.id !== match.id),
    );
    setCurrentMatch((prev) => (prev?.id === match.id ? match : prev));
  });

  const createMatch = useCallback(
    async (type: Match['type'] = 'SOLO'): Promise<Match | null> => {
      if (!socket) return null;
      try {
        const match = (await socket
          .timeout(ACK_TIMEOUT_MS)
          .emitWithAck('match:create', { type })) as Match;
        setCurrentMatch(match);
        return match;
      } catch {
        triggerToast('Could not create a match', { type: 'error' });
        return null;
      }
    },
    [socket, triggerToast],
  );

  const joinMatch = useCallback(
    async (matchId: number): Promise<Match | null> => {
      if (!socket) return null;
      try {
        const match = (await socket
          .timeout(ACK_TIMEOUT_MS)
          .emitWithAck('match:join', { matchId })) as Match;
        setCurrentMatch(match);
        return match;
      } catch {
        triggerToast('Could not join the match', { type: 'error' });
        return null;
      }
    },
    [socket, triggerToast],
  );

  const leaveMatch = useCallback(
    async (matchId: number) => {
      if (!socket) return;
      try {
        await socket
          .timeout(ACK_TIMEOUT_MS)
          .emitWithAck('match:leave', { matchId });
        setCurrentMatch((prev) => (prev?.id === matchId ? null : prev));
      } catch {
        triggerToast('Could not leave the match', { type: 'error' });
      }
    },
    [socket, triggerToast],
  );

  return {
    isConnected,
    matches,
    currentMatch,
    createMatch,
    joinMatch,
    leaveMatch,
  };
};

export default useMatch;
