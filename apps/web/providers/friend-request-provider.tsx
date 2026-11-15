'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useSocketEvent } from '@repo/socket';
import {
  useFriendControllerAccept,
  useFriendControllerListFriends,
  useFriendControllerListRequests,
  useFriendControllerRemove,
} from '../services/queries-components';
import type {
  FriendEntryDto,
  Friendship,
  UserResoponseDTO,
} from '../services/types-schemas';
import type { IncomingChatMessage } from '../hooks/use-chat';
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

  unread: Record<number, number>;
  unreadTotal: number;
  chatWith: UserResoponseDTO | null;
  openChat: (friend: UserResoponseDTO | null) => void;
  markRead: (friendUserId: number) => void;
  latestMessage: (IncomingChatMessage & { key: number }) | null;
  dismissMessage: () => void;
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

  const [unread, setUnread] = useState<Record<number, number>>({});
  const [chatWith, setChatWith] = useState<UserResoponseDTO | null>(null);
  const [latestMessage, setLatestMessage] =
    useState<FriendRequestContextValue['latestMessage']>(null);
  const chatWithRef = useRef(chatWith);
  chatWithRef.current = chatWith;

  useEffect(() => {
    if (!friendsList.data) return;
    const open = chatWithRef.current?.userId;
    setUnread(
      Object.fromEntries(
        friendsList.data.map((f) => [
          f.user.userId,
          f.user.userId === open ? 0 : f.unreadCount,
        ]),
      ),
    );
  }, [friendsList.data]);

  const markRead = useCallback((friendUserId: number) => {
    setUnread((prev) =>
      prev[friendUserId] ? { ...prev, [friendUserId]: 0 } : prev,
    );
    setLatestMessage((m) => (m?.from.userId === friendUserId ? null : m));
  }, []);

  const openChat = useCallback(
    (friend: UserResoponseDTO | null) => {
      setChatWith(friend);
      if (friend) markRead(friend.userId);
    },
    [markRead],
  );

  useSocketEvent('chat:message', (msg: IncomingChatMessage) => {
    if (chatWithRef.current?.userId === msg.from.userId) return;
    setUnread((prev) => ({
      ...prev,
      [msg.from.userId]: (prev[msg.from.userId] ?? 0) + 1,
    }));
    setLatestMessage({ ...msg, key: Date.now() });
  });

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
    unread,
    unreadTotal: Object.values(unread).reduce((a, b) => a + b, 0),
    chatWith,
    openChat,
    markRead,
    latestMessage,
    dismissMessage: () => setLatestMessage(null),
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
