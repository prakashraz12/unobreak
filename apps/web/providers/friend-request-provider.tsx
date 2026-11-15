'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useSocketEvent } from '@repo/socket';
import {
  useFriendControllerAccept,
  useFriendControllerListFriends,
  useFriendControllerListRequests,
  useFriendControllerRemove,
} from '../services/queries-components';
import type { FriendEntryDto, Friendship } from '../services/types-schemas';
import FriendRequestBanner from '../components/friend-request-banner';

interface FriendRequestContextValue {
  incoming: Friendship[];
  outgoing: Friendship[];
  friends: FriendEntryDto[];

  pendingCount: number;
  isLoading: boolean;
  accept: (friendshipId: number) => void;
  decline: (friendshipId: number) => void;
  refresh: () => void;
}

const FriendRequestContext = createContext<FriendRequestContextValue | null>(
  null,
);

export const FriendRequestProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const requests = useFriendControllerListRequests({});
  const friendsList = useFriendControllerListFriends({});

  const refresh = () => {
    void requests.refetch();
    void friendsList.refetch();
  };

  useSocketEvent('friend:request', refresh);
  useSocketEvent('friend:accepted', refresh);

  const acceptMutation = useFriendControllerAccept({
    onSuccess: refresh,
  });
  const removeMutation = useFriendControllerRemove({
    onSuccess: refresh,
  });

  const value: FriendRequestContextValue = {
    incoming: requests.data?.incoming ?? [],
    outgoing: requests.data?.outgoing ?? [],
    friends: friendsList.data ?? [],
    pendingCount: requests.data?.incoming.length ?? 0,
    isLoading: requests.isLoading,
    accept: (friendshipId) =>
      acceptMutation.mutate({ pathParams: { id: friendshipId } }),
    decline: (friendshipId) =>
      removeMutation.mutate({ pathParams: { id: friendshipId } }),
    refresh,
  };

  return (
    <FriendRequestContext.Provider value={value}>
      <FriendRequestBanner />
      {children}
    </FriendRequestContext.Provider>
  );
};

export const useFriendRequests = () => {
  const ctx = useContext(FriendRequestContext);
  if (!ctx)
    throw new Error(
      'useFriendRequests must be used within FriendRequestProvider',
    );
  return ctx;
};

export const useOptionalFriendRequests = () => useContext(FriendRequestContext);

export default FriendRequestProvider;
