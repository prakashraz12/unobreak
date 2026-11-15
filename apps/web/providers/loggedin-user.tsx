'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { skipToken } from '@tanstack/react-query';
import { SocketProvider, useSocketEvent } from '@repo/socket';
import useStorage from '../hooks/use-storage';
import { ACCESS_TOKEN } from '../keys';
import { useUserControllerMe } from '../services/queries-components';
import type { User } from '../services/types-schemas';
import FullScreenLoader from '../components/full-screen-loader';
import { usePopUpToaster } from '../components/pop-up-toaster';
import FriendRequestProvider from './friend-request-provider';
import MatchInviteProvider from './match-invite-provider';

interface LoggedInUserContextValue {
  user: User;
}

export const LoggedInUserContext =
  createContext<LoggedInUserContextValue | null>(null);

interface FriendEvent {
  friendshipId: number;
  from?: { userId: number; name: string; avatarId: number };
  by?: { userId: number; name: string; avatarId: number };
}

const RealtimeNotifications = () => {
  const { triggerToast } = usePopUpToaster();
  useSocketEvent('friend:accepted', (e: FriendEvent) => {
    triggerToast(`${e.by?.name ?? 'Someone'} accepted your friend request`, {
      type: 'success',
    });
  });
  return null;
};

export const LoggedInUserProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken] = useStorage<string | null>(ACCESS_TOKEN, null);
  const { data: user, isLoading } = useUserControllerMe(
    accessToken ? {} : skipToken,
  );

  if (isLoading || !user) return <FullScreenLoader />;

  return (
    <LoggedInUserContext.Provider value={{ user }}>
      <SocketProvider
        url={process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001'}
        token={accessToken}
      >
        <RealtimeNotifications />
        <FriendRequestProvider>
          <MatchInviteProvider>{children}</MatchInviteProvider>
        </FriendRequestProvider>
      </SocketProvider>
    </LoggedInUserContext.Provider>
  );
};

export const useLoggedInUser = () => {
  const context = useContext(LoggedInUserContext);
  if (!context)
    throw new Error('useLoggedInUser must be used within LoggedInUserProvider');
  return context;
};

export default LoggedInUserProvider;
