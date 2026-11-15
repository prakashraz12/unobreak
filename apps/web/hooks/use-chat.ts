'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSocketEvent } from '@repo/socket';
import { queriesFetch } from '../services/queries-fetcher';
import type { UserResoponseDTO } from '../services/types-schemas';

export type ChatMessage = {
  id: number;
  text: string;
  createdAt: string;
  mine?: boolean;
  from: {
    userId: number;
    name: string;
    avatarId: string;
    image?: string | null;
  };
};

export type IncomingChatMessage = Omit<ChatMessage, 'mine'>;

const fetchHistory = (friendUserId: number) =>
  queriesFetch<ChatMessage[], unknown, undefined, {}, {}, {}>({
    url: `/friends/${friendUserId}/messages`,
    method: 'get',
  });

export const postMessage = (friendUserId: number, text: string) =>
  queriesFetch<unknown, unknown, { text: string }, {}, {}, {}>({
    url: `/friends/${friendUserId}/messages`,
    method: 'post',
    body: { text },
  });

export const markMessagesRead = (friendUserId: number) =>
  queriesFetch<unknown, unknown, undefined, {}, {}, {}>({
    url: `/friends/${friendUserId}/messages/read`,
    method: 'post',
  });

export const useChat = (friend: UserResoponseDTO | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!friend) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchHistory(friend.userId)
      .then((rows) => {
        if (!cancelled) setMessages(rows);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [friend]);

  useSocketEvent<[IncomingChatMessage]>('chat:message', (msg) => {
    if (friend && msg.from.userId === friend.userId) {
      setMessages((prev) => [...prev, msg]);
      void markMessagesRead(friend.userId).catch(() => {});
    }
  });

  const send = useCallback(
    async (text: string) => {
      if (!friend || !text.trim()) return;
      const optimistic: ChatMessage = {
        id: -Date.now(),
        text: text.trim(),
        createdAt: new Date().toISOString(),
        mine: true,
        from: {
          userId: -1,
          name: 'You',
          avatarId: 'cat',
        },
      };
      setMessages((prev) => [...prev, optimistic]);
      try {
        await postMessage(friend.userId, text.trim());
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      }
    },
    [friend],
  );

  return { messages, loading, send };
};
