'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useGame } from '../context/game-context';
import { useFriendRequests } from '../providers/friend-request-provider';
import Avatar from './avatars/avatar';
import { AVATARS } from './avatars/presets';

const FriendRequestBanner = () => {
  const { inGame } = useGame();
  const { incoming, accept, decline } = useFriendRequests();
  const reducedMotion = useReducedMotion();
  const request = incoming[0];
  const sender = request?.requester;
  const avatar = AVATARS.find((a) => a.id === sender?.avatarId) ?? AVATARS[0]!;

  return (
    <div
      role="region"
      aria-label="Friend requests"
      className="pointer-events-none fixed inset-x-0 top-4 z-110 flex justify-center px-4"
    >
      <AnimatePresence>
        {!inGame && request && sender && (
          <motion.div
            key={request.id}
            initial={{
              opacity: 0,
              y: reducedMotion ? 0 : -60,
              scale: reducedMotion ? 1 : 0.95,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: reducedMotion ? 0 : -30,
              scale: reducedMotion ? 1 : 0.95,
            }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 380, damping: 28 }
            }
            className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-3xl border-4 border-[#6b2f00] bg-linear-to-b from-[#fff48a] to-[#ffd61f] px-4 py-3 text-[#6b2f00] shadow-[inset_0_-4px_0_#e9a700,0_4px_0_#6b2f00,0_8px_20px_rgba(0,0,0,0.3)]"
          >
            <div className="size-12 shrink-0 overflow-hidden rounded-xl border-[3px] border-[#6b2f00] bg-[#7fc4de]">
              {sender.customProfileImage ? (
                <img
                  src={sender.customProfileImage}
                  alt={sender.name}
                  referrerPolicy="no-referrer"
                  className="size-full object-cover"
                />
              ) : (
                <Avatar
                  avatar={avatar}
                  className="size-full! translate-y-[8%] scale-[1.55]"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black uppercase tracking-wide">
                {sender.name}
              </p>
              <p className="text-xs font-bold opacity-80">
                Sent you a friend request
                {incoming.length > 1 && ` (+${incoming.length - 1} more)`}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => accept(request.id)}
                className="cursor-pointer rounded-xl border-2 border-[#14540f] bg-linear-to-b from-[#7be05a] to-[#2fa52a] px-3 py-1.5 text-sm font-black uppercase text-white shadow-[0_2px_0_#14540f] transition-transform hover:scale-105 active:translate-y-0.5"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => decline(request.id)}
                className="cursor-pointer rounded-xl border-2 border-[#6b2f00] bg-linear-to-b from-[#ff8a7a] to-[#e3202b] px-3 py-1.5 text-sm font-black uppercase text-white shadow-[0_2px_0_#6b2f00] transition-transform hover:scale-105 active:translate-y-0.5"
              >
                Decline
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FriendRequestBanner;
