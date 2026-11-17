'use client';

import { Fragment, useEffect, useState } from 'react';
import { SheetBody, SheetClose, SheetTitle } from '@repo/ui/sheet';
import UserAvatar from '../avatars/user-avatar';
import { useFriendControllerSendRequest } from '../../services/queries-components';
import { usePopUpToaster } from '../pop-up-toaster';
import type {
  Friendship,
  UserResoponseDTO,
} from '../../services/types-schemas';
import { useFriendRequests } from '../../providers/friend-request-provider';
import ChatPanel from '../chat/chat-panel';
import { useSocketEvent } from '@repo/socket';
import { timeAgo } from '@repo/ui/time-ago';
import { cn } from '../../lib/utils';

const ROW_LABEL =
  'font-display text-sm font-black uppercase italic tracking-wide text-white [text-shadow:0_2px_0_rgba(0,0,0,0.4)]';

const UserRow = ({
  user,
  online,
  showAddFriend = true,
  unread = 0,
  onChat,
}: {
  user: UserResoponseDTO;
  online: boolean;
  showAddFriend?: boolean;
  unread?: number;
  onChat?: () => void;
}) => {
  const lastActive = timeAgo(user.activity?.lastActive);
  const { triggerToast } = usePopUpToaster();
  const { mutate: addFriend, isPending } = useFriendControllerSendRequest({
    onSuccess: () =>
      triggerToast(`Friend request sent to ${user.name}`, {
        type: 'success',
      }),
    onError: () =>
      triggerToast('Could not send friend request', { type: 'error' }),
  });

  return (
    <div className="rounded-xl border-[3px] border-[#6b2f00] bg-linear-to-b from-[#f0a000] to-[#c46a00] p-0.75 shadow-[0_4px_10px_rgba(0,0,0,0.35)]">
      <div className="relative flex items-center gap-3 overflow-hidden rounded-[9px] bg-[radial-gradient(80%_80%_at_50%_30%,#fff48a_0%,#ffd61f_45%,#f5a300_100%)] px-3 py-2">
        <span
          className="pointer-events-none absolute inset-x-2 top-0.5 h-1/3 rounded-t-lg bg-linear-to-b from-white/80 to-transparent"
          aria-hidden="true"
        />
        <UserAvatar
          avatarId={user.avatarId}
          image={user.customProfileImage}
          className="relative size-11 shrink-0"
        />
        <div className="relative min-w-0 flex-1">
          <p
            className={cn(
              ROW_LABEL,
              'truncate [-webkit-text-stroke:3px_#6b2f00] [paint-order:stroke_fill]',
            )}
          >
            {user.name}
          </p>
          <p className="truncate text-xs font-black text-[#6b2f00]/80">
            {user.userId}
            {!online && lastActive && (
              <span className="text-[10px] font-bold normal-case">
                {' '}
                · Last active {lastActive}
              </span>
            )}
          </p>
        </div>
        <div className="relative flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={cn(
              'flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide',
              online ? 'text-[#1d7a18]' : 'text-[#6b2f00]/70',
            )}
          >
            <span
              className={cn(
                'size-2.5 rounded-full border border-[#6b2f00]/60',
                online ? 'bg-[#38a336]' : 'bg-[#8a8a8a]',
              )}
            />
            {online ? 'Online' : 'Offline'}
          </span>
          {onChat && (
            <button
              type="button"
              onClick={onChat}
              className="relative cursor-pointer rounded-lg border-2 border-[#143a54] bg-linear-to-b from-[#5aa8e0] to-[#1f6fb5] px-2.5 py-1 text-[10px] font-black uppercase italic tracking-wide text-white shadow-[0_2px_0_#143a54] [-webkit-text-stroke:2px_#143a54] [paint-order:stroke_fill] transition-transform hover:scale-[1.04] active:translate-y-0.5"
            >
              Chat
              {unread > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex size-4.5 items-center justify-center rounded-full border-2 border-white bg-[#e3202b] text-[9px] font-black text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
          )}
          {showAddFriend &&
            (user.friendStatus === 'FRIEND' ? (
              <span className="rounded-lg border-2 border-[#14540f] bg-[#38a336] px-2.5 py-1 text-[10px] font-black uppercase italic tracking-wide text-white [-webkit-text-stroke:2px_#14540f] [paint-order:stroke_fill]">
                Friends
              </span>
            ) : user.friendStatus === 'OUTGOING' ? (
              <span className="rounded-lg border-2 border-[#6b2f00]/60 bg-[#8a8a8a] px-2.5 py-1 text-[10px] font-black uppercase italic tracking-wide text-white [-webkit-text-stroke:2px_#6b2f00] [paint-order:stroke_fill]">
                Pending
              </span>
            ) : user.friendStatus === 'INCOMING' ? (
              <span className="rounded-lg border-2 border-[#6b2f00] bg-[#ffd61f] px-2.5 py-1 text-[10px] font-black uppercase italic tracking-wide text-[#6b2f00]">
                Requested
              </span>
            ) : (
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  addFriend({ pathParams: { userId: user.userId } })
                }
                className="cursor-pointer rounded-lg border-2 border-[#14540f] bg-linear-to-b from-[#7be05a] to-[#2fa52a] px-2.5 py-1 text-[10px] font-black uppercase italic tracking-wide text-white shadow-[0_2px_0_#14540f] [-webkit-text-stroke:2px_#14540f] [paint-order:stroke_fill] transition-transform hover:scale-[1.04] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:grayscale"
              >
                {isPending ? 'Sending…' : 'Add Friend'}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};

const RequestRow = ({
  request,
  onAccept,
  onDecline,
}: {
  request: Friendship;
  onAccept: () => void;
  onDecline: () => void;
}) => {
  const sender = request.requester;
  return (
    <div className="rounded-xl border-[3px] border-[#6b2f00] bg-linear-to-b from-[#f0a000] to-[#c46a00] p-0.75 shadow-[0_4px_10px_rgba(0,0,0,0.35)]">
      <div className="relative flex items-center gap-3 overflow-hidden rounded-[9px] bg-[radial-gradient(80%_80%_at_50%_30%,#fff48a_0%,#ffd61f_45%,#f5a300_100%)] px-3 py-2">
        <span
          className="pointer-events-none absolute inset-x-2 top-0.5 h-1/3 rounded-t-lg bg-linear-to-b from-white/80 to-transparent"
          aria-hidden="true"
        />
        <UserAvatar
          avatarId={sender.avatarId}
          image={sender.customProfileImage}
          className="relative size-11 shrink-0"
        />
        <div className="relative min-w-0 flex-1">
          <p
            className={cn(
              ROW_LABEL,
              'truncate [-webkit-text-stroke:3px_#6b2f00] [paint-order:stroke_fill]',
            )}
          >
            {sender.name}
          </p>
          <p className="truncate text-xs font-black text-[#6b2f00]/80">
            {sender.userId}
          </p>
        </div>
        <div className="relative flex shrink-0 gap-1.5">
          <button
            type="button"
            onClick={onAccept}
            className="cursor-pointer rounded-lg border-2 border-[#14540f] bg-linear-to-b from-[#7be05a] to-[#2fa52a] px-2.5 py-1 text-[10px] font-black uppercase italic tracking-wide text-white shadow-[0_2px_0_#14540f] [-webkit-text-stroke:2px_#14540f] [paint-order:stroke_fill] transition-transform hover:scale-[1.04] active:translate-y-0.5"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={onDecline}
            className="cursor-pointer rounded-lg border-2 border-[#6b2f00] bg-linear-to-b from-[#ff6b57] to-[#d1341f] px-2.5 py-1 text-[10px] font-black uppercase italic tracking-wide text-white shadow-[0_2px_0_#6b2f00] [-webkit-text-stroke:2px_#6b2f00] [paint-order:stroke_fill] transition-transform hover:scale-[1.04] active:translate-y-0.5"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};

const SentRow = ({
  request,
  onCancel,
}: {
  request: Friendship;
  onCancel: () => void;
}) => {
  const target = request.addressee;
  return (
    <div className="rounded-xl border-[3px] border-[#6b2f00] bg-linear-to-b from-[#f0a000] to-[#c46a00] p-0.75 shadow-[0_4px_10px_rgba(0,0,0,0.35)]">
      <div className="relative flex items-center gap-3 overflow-hidden rounded-[9px] bg-[radial-gradient(80%_80%_at_50%_30%,#fff48a_0%,#ffd61f_45%,#f5a300_100%)] px-3 py-2">
        <span
          className="pointer-events-none absolute inset-x-2 top-0.5 h-1/3 rounded-t-lg bg-linear-to-b from-white/80 to-transparent"
          aria-hidden="true"
        />
        <UserAvatar
          avatarId={target.avatarId}
          image={target.customProfileImage}
          className="relative size-11 shrink-0"
        />
        <div className="relative min-w-0 flex-1">
          <p
            className={cn(
              ROW_LABEL,
              'truncate [-webkit-text-stroke:3px_#6b2f00] [paint-order:stroke_fill]',
            )}
          >
            {target.name}
          </p>
          <p className="truncate text-xs font-black text-[#6b2f00]/80">
            {target.userId}
          </p>
        </div>
        <div className="relative flex shrink-0 gap-1.5">
          <span className="rounded-lg bg-[#6b2f00]/15 px-2.5 py-1 text-[10px] font-black uppercase italic tracking-wide text-[#6b2f00]">
            Pending
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-lg border-2 border-[#6b2f00] bg-linear-to-b from-[#ff6b57] to-[#d1341f] px-2.5 py-1 text-[10px] font-black uppercase italic tracking-wide text-white shadow-[0_2px_0_#6b2f00] [-webkit-text-stroke:2px_#6b2f00] [paint-order:stroke_fill] transition-transform hover:scale-[1.04] active:translate-y-0.5"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const Users = () => {
  const {
    incoming,
    outgoing,
    friends,
    pendingCount,
    unread,
    unreadTotal,
    chatWith,
    openChat,
    accept,
    decline,
  } = useFriendRequests();
  const [presence, setPresence] = useState<Record<number, boolean>>({});

  useSocketEvent<[{ userId: number; isOnline: boolean }]>(
    'presence:update',
    ({ userId, isOnline }) => {
      setPresence((prev) => ({ ...prev, [userId]: isOnline }));
    },
  );

  useEffect(() => () => openChat(null), [openChat]);

  const badge = pendingCount + unreadTotal;

  return (
    <Fragment>
      <SheetTitle className="sr-only">Friends</SheetTitle>
      <SheetClose asChild>
        <button
          type="button"
          aria-label="Close"
          title="Close"
          className="absolute left-full top-1/2 h-20 w-12 -translate-y-1/2 cursor-pointer rounded-r-xl border-[3px] border-l-0 border-[#6b2f00] bg-linear-to-b from-[#f0a000] to-[#c46a00] p-0.75 shadow-[0_4px_10px_rgba(0,0,0,0.4)] outline-none transition-all duration-200 hover:w-14 focus-visible:ring-4 focus-visible:ring-white/70 active:scale-95"
        >
          <span className="relative flex size-full items-center justify-center overflow-hidden rounded-r-lg bg-[radial-gradient(65%_65%_at_50%_35%,#fff48a_0%,#ffd61f_45%,#f5a300_100%)]">
            <span
              className="pointer-events-none absolute inset-x-1 top-0.5 h-2/5 rounded-t-lg bg-linear-to-b from-white/85 to-transparent"
              aria-hidden="true"
            />
            <svg
              viewBox="0 0 24 24"
              className="relative size-5 drop-shadow-[0_2px_0_#6b2f00]"
              fill="none"
              stroke="#fff"
              strokeWidth={4}
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </span>
        </button>
      </SheetClose>

      <div className="flex items-center gap-2 border-b-2 border-black/25 px-6 pb-4 pt-4">
        <p className="relative font-display text-sm font-black uppercase italic tracking-wide text-white [-webkit-text-stroke:3px_#6b2f00] [paint-order:stroke_fill]">
          Friends
          {badge > 0 && (
            <span className="absolute -right-4 -top-2.5 flex size-5 items-center justify-center rounded-full border-2 border-[#6b2f00] bg-[#e33] text-[10px] font-black text-white shadow-[0_2px_0_#6b2f00] [-webkit-text-stroke:0]">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </p>
      </div>

      <SheetBody className="relative flex flex-col gap-3">
        {chatWith && (
          <ChatPanel friend={chatWith} onClose={() => openChat(null)} />
        )}
        {incoming.length === 0 &&
        outgoing.length === 0 &&
        friends.length === 0 ? (
          <p className="py-8 text-center text-sm font-bold uppercase tracking-wide text-white/60">
            No friends yet
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {incoming.length > 0 && (
              <Fragment>
                <p className="text-xs font-black uppercase tracking-wide text-white/70">
                  Requests
                </p>
                <div className="flex flex-col gap-2">
                  {incoming.map((r) => (
                    <RequestRow
                      key={r.id}
                      request={r}
                      onAccept={() => accept(r.id)}
                      onDecline={() => decline(r.id)}
                    />
                  ))}
                </div>
              </Fragment>
            )}
            {outgoing.length > 0 && (
              <Fragment>
                <p className="text-xs font-black uppercase tracking-wide text-white/70">
                  Sent
                </p>
                <div className="flex flex-col gap-2">
                  {outgoing.map((r) => (
                    <SentRow
                      key={r.id}
                      request={r}
                      onCancel={() => decline(r.id)}
                    />
                  ))}
                </div>
              </Fragment>
            )}
            {friends.length > 0 && (
              <div className="flex flex-col gap-2">
                {friends.map((f) => (
                  <UserRow
                    key={f.friendshipId}
                    user={f.user}
                    showAddFriend={false}
                    online={
                      presence[f.user.userId] ??
                      f.user.activity?.isOnline ??
                      false
                    }
                    unread={unread[f.user.userId] ?? 0}
                    onChat={() => openChat(f.user)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </SheetBody>
    </Fragment>
  );
};

export default Users;
