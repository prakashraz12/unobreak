'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useSheet } from '../providers/sheet-provider';
import { useOptionalFriendRequests } from '../providers/friend-request-provider';
import type { FriendEntryDto } from '../services/types-schemas';
import { postMessage, type IncomingChatMessage } from '../hooks/use-chat';
import { usePopUpToaster } from './pop-up-toaster';
import UserAvatar from './avatars/user-avatar';

const TOAST_MS = 8000;

type MessageToast = IncomingChatMessage & { key: number };

const ChatMessageToast = ({
  message,
  friend,
  onReply,
  onOpen,
  onDismiss,
}: {
  message: MessageToast;
  friend: FriendEntryDto | undefined;
  onReply: () => void;
  onOpen: () => void;
  onDismiss: () => void;
}) => {
  const reducedMotion = useReducedMotion();
  const { triggerToast } = usePopUpToaster();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const id = setTimeout(onDismiss, TOAST_MS);
    return () => clearTimeout(id);
  }, [message.key, onDismiss]);

  const reply = async () => {
    const text = draft.trim();
    if (!text || sending || !friend) return;
    setSending(true);
    try {
      await postMessage(friend.user.userId, text);
      onReply();
      setDraft('');
    } catch {
      triggerToast('Could not send the message', { type: 'error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      key={message.key}
      initial={{
        opacity: 0,
        y: reducedMotion ? 0 : 20,
        scale: reducedMotion ? 1 : 0.95,
      }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { type: 'spring', stiffness: 380, damping: 28 }
      }
      className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border-2 border-[#6b2f00] bg-white/95 p-3 shadow-lg"
    >
      <UserAvatar
        avatarId={friend?.user.avatarId ?? 1}
        image={message.from.image}
        className="size-10 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-black uppercase italic text-[#6b2f00]">
          {message.from.name}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs font-bold text-[#3a2c00]">
          {message.text}
        </p>
        <form
          className="mt-2 flex gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            void reply();
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={500}
            placeholder={`Reply to ${message.from.name}…`}
            className="min-w-0 flex-1 rounded-lg border-2 border-[#6b2f00] bg-black/10 px-2.5 py-1 text-xs font-bold text-[#6b2f00] outline-none placeholder:text-[#6b2f00]/50 focus:border-[#ffd61f]"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            className="shrink-0 cursor-pointer rounded-lg border-2 border-[#14540f] bg-linear-to-b from-[#7be05a] to-[#2fa52a] px-2.5 py-1 text-[10px] font-black uppercase italic tracking-wide text-white shadow-[0_2px_0_#14540f] disabled:cursor-not-allowed disabled:opacity-40 disabled:grayscale"
          >
            Send
          </button>
        </form>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="cursor-pointer text-[#6b2f00]/60 transition-colors hover:text-[#6b2f00]"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onOpen}
          className="cursor-pointer rounded-lg border-2 border-[#6b2f00] bg-linear-to-b from-[#ffd61f] to-[#f5a300] px-2.5 py-1 text-[10px] font-black uppercase italic tracking-wide text-white shadow-[0_2px_0_#6b2f00] [-webkit-text-stroke:2px_#6b2f00] [paint-order:stroke_fill] transition-transform hover:scale-[1.04] active:translate-y-0.5"
        >
          Open
        </button>
      </div>
    </motion.div>
  );
};

const ChatMessageToaster = () => {
  const { openSheet } = useSheet();
  const requests = useOptionalFriendRequests();
  if (!requests) return null;
  const { latestMessage, friends, openChat, markRead, dismissMessage } =
    requests;
  const friend = latestMessage
    ? friends.find((f) => f.user.userId === latestMessage.from.userId)
    : undefined;
  const user = friend?.user ?? null;

  const open = () => {
    if (user) {
      openChat(user);
      openSheet('users');
    }
    dismissMessage();
  };

  const reply = () => {
    if (user) markRead(user.userId);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-110 flex justify-center px-4">
      <AnimatePresence>
        {latestMessage && (
          <ChatMessageToast
            message={latestMessage}
            friend={friend}
            onReply={reply}
            onOpen={open}
            onDismiss={dismissMessage}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatMessageToaster;
