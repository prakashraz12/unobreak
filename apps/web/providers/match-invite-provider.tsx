'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSocket, useSocketEvent } from '@repo/socket';
import MatchInviteBanner from '../components/match-invite-banner';
import { usePopUpToaster } from '../components/pop-up-toaster';

export interface MatchInvite {
  matchId: number;
  type: 'TEAM_2V2' | 'PRIVATE_ROOM';
  from: { userId: number; name: string; avatarId: number };

  expiresAt: number;
}

export const INVITE_TTL_MS = 5_000;

const inviteKey = (invite: MatchInvite) =>
  `${invite.matchId}:${invite.from.userId}`;

interface MatchInviteContextValue {
  invites: MatchInvite[];
  joinRequest: Pick<MatchInvite, 'matchId' | 'type'> | null;
  acceptInvite: (invite: MatchInvite) => void;
  declineInvite: (invite: MatchInvite) => void;
  clearJoinRequest: () => void;
}

const MatchInviteContext = createContext<MatchInviteContextValue | null>(null);

export const MatchInviteProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { socket } = useSocket();
  const { triggerToast } = usePopUpToaster();
  const [invites, setInvites] = useState<MatchInvite[]>([]);
  const [joinRequest, setJoinRequest] =
    useState<MatchInviteContextValue['joinRequest']>(null);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const removeInvite = (key: string) => {
    const timer = timers.current.get(key);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(key);
    }
    setInvites((prev) => prev.filter((i) => inviteKey(i) !== key));
  };

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => clearTimeout(timer));
  }, []);

  const decline = (invite: MatchInvite) => {
    removeInvite(inviteKey(invite));
    socket?.emit('match:decline', {
      matchId: invite.matchId,
      fromUserId: invite.from.userId,
    });
  };

  useSocketEvent('match:invite', (payload: Omit<MatchInvite, 'expiresAt'>) => {
    if (payload.type !== 'TEAM_2V2' && payload.type !== 'PRIVATE_ROOM') {
      return;
    }
    const invite = { ...payload, expiresAt: Date.now() + INVITE_TTL_MS };
    const key = inviteKey(invite);
    setInvites((prev) => [...prev.filter((i) => inviteKey(i) !== key), invite]);
    const existing = timers.current.get(key);
    if (existing) clearTimeout(existing);
    timers.current.set(
      key,
      setTimeout(() => decline(invite), INVITE_TTL_MS),
    );
  });

  useSocketEvent(
    'match:declined',
    (payload: { matchId: number; by: { userId: number; name: string } }) =>
      triggerToast(`${payload.by.name} declined your invite`, {
        type: 'info',
      }),
  );

  const value: MatchInviteContextValue = {
    invites,
    joinRequest,
    acceptInvite: (invite) => {
      removeInvite(inviteKey(invite));
      setJoinRequest({ matchId: invite.matchId, type: invite.type });
      if (pathname !== '/menu') router.push('/menu');
    },
    declineInvite: decline,
    clearJoinRequest: () => setJoinRequest(null),
  };

  return (
    <MatchInviteContext.Provider value={value}>
      <MatchInviteBanner />
      {children}
    </MatchInviteContext.Provider>
  );
};

export const useMatchInvite = () => {
  const ctx = useContext(MatchInviteContext);
  if (!ctx)
    throw new Error('useMatchInvite must be used within MatchInviteProvider');
  return ctx;
};

export default MatchInviteProvider;
