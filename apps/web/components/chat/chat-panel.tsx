'use client';

import { useEffect, useRef, useState } from 'react';
import UserAvatar from '../avatars/user-avatar';
import { useChat } from '../../hooks/use-chat';
import type { UserResoponseDTO } from '../../services/types-schemas';
import { cn } from '../../lib/utils';

const ChatPanel = ({
  friend,
  onClose,
}: {
  friend: UserResoponseDTO;
  onClose: () => void;
}) => {
  const { messages, loading, send } = useChat(friend);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const submit = () => {
    if (!draft.trim()) return;
    void send(draft);
    setDraft('');
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col rounded-xl border-[3px] border-[#6b2f00] bg-linear-to-b from-[#f0a000] to-[#c46a00] shadow-[0_4px_10px_rgba(0,0,0,0.35)]">
      <div className="relative flex items-center gap-3 rounded-t-[9px] bg-[radial-gradient(80%_80%_at_50%_30%,#fff48a_0%,#ffd61f_45%,#f5a300_100%)] px-3 py-2">
        <span
          className="pointer-events-none absolute inset-x-2 top-0.5 h-1/3 rounded-t-lg bg-linear-to-b from-white/80 to-transparent"
          aria-hidden="true"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Back"
          className="relative flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 border-[#6b2f00] bg-black/25 text-white transition-transform hover:scale-105 active:translate-y-0.5"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <UserAvatar
          avatarId={friend.avatarId}
          image={friend.customProfileImage}
          className="relative size-9 shrink-0"
        />
        <p className="relative min-w-0 flex-1 truncate font-display text-sm font-black uppercase italic tracking-wide text-white [-webkit-text-stroke:3px_#6b2f00] [paint-order:stroke_fill]">
          {friend.name}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-black/25 px-3 py-3">
        {loading ? (
          <p className="py-8 text-center text-xs font-bold uppercase tracking-wide text-white/60">
            Loading…
          </p>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-xs font-bold uppercase tracking-wide text-white/60">
            No messages yet — say hi!
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                'max-w-[80%] rounded-xl px-3 py-2 text-sm font-bold shadow-[0_2px_0_rgba(0,0,0,0.3)]',
                m.mine
                  ? 'self-end rounded-br-sm bg-linear-to-b from-[#7be05a] to-[#2fa52a] text-white'
                  : 'self-start rounded-bl-sm bg-[radial-gradient(80%_80%_at_50%_30%,#fff48a_0%,#ffd61f_45%,#f5a300_100%)] text-[#6b2f00]',
              )}
            >
              <p className="whitespace-pre-wrap break-words">{m.text}</p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 rounded-b-[9px] border-t-2 border-[#6b2f00]/60 bg-black/30 p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          maxLength={500}
          placeholder={`Message ${friend.name}…`}
          className="min-w-0 flex-1 rounded-xl border-2 border-[#6b2f00] bg-black/30 px-3 py-2 text-sm font-bold text-white outline-none placeholder:text-white/40 focus:border-[#ffd61f]"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!draft.trim()}
          className="shrink-0 cursor-pointer rounded-xl border-2 border-[#14540f] bg-linear-to-b from-[#7be05a] to-[#2fa52a] px-4 py-2 text-xs font-black uppercase italic tracking-wide text-white shadow-[0_2px_0_#14540f] [-webkit-text-stroke:2px_#14540f] [paint-order:stroke_fill] transition-transform hover:scale-[1.04] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:grayscale"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
