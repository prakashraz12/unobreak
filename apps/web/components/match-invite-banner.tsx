'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useGame } from '../context/game-context';
import {
  INVITE_TTL_MS,
  useMatchInvite,
} from '../providers/match-invite-provider';

const Countdown = ({ expiresAt }: { expiresAt: number }) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [expiresAt]);
  const left = Math.max(0, expiresAt - now);
  return (
    <span
      className="relative flex size-9 shrink-0 items-center justify-center"
      aria-label={`${Math.ceil(left / 1000)} seconds to respond`}
    >
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
        <circle
          cx={18}
          cy={18}
          r={15}
          fill="none"
          stroke="#6b2f00"
          strokeOpacity={0.15}
          strokeWidth={4}
        />
        <circle
          cx={18}
          cy={18}
          r={15}
          fill="none"
          stroke="#e3202b"
          strokeWidth={4}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - left / INVITE_TTL_MS}
        />
      </svg>
      <span className="font-display text-sm font-black text-[#6b2f00]">
        {Math.ceil(left / 1000)}
      </span>
    </span>
  );
};

const MatchInviteBanner = () => {
  const { inGame } = useGame();
  const { invites, acceptInvite, declineInvite } = useMatchInvite();
  const reducedMotion = useReducedMotion();
  const invite = invites[0];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-110 flex justify-center px-4">
      <AnimatePresence>
        {!inGame && invite && (
          <motion.div
            key={`${invite.matchId}:${invite.from.userId}:${invite.expiresAt}`}
            initial={{
              opacity: 0,
              y: reducedMotion ? 0 : 40,
              scale: reducedMotion ? 1 : 0.95,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: reducedMotion ? 0 : 20,
              scale: reducedMotion ? 1 : 0.95,
            }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 380, damping: 28 }
            }
            className="pointer-events-auto flex items-center gap-4 rounded-2xl border-2 border-[#6b2f00] bg-white/95 px-5 py-3 shadow-lg"
          >
            <Countdown expiresAt={invite.expiresAt} />
            <span className="font-display text-base font-black uppercase italic text-[#6b2f00]">
              {invite.from.name} invites you to a{' '}
              {invite.type === 'TEAM_2V2' ? '2v2 match' : 'custom match'}
              {invites.length > 1 && ` (+${invites.length - 1} more)`}
            </span>
            <button
              type="button"
              onClick={() => acceptInvite(invite)}
              className="cursor-pointer rounded-xl border-2 border-[#6b2f00] bg-linear-to-b from-[#7be05a] to-[#2fa52a] px-4 py-1.5 font-display text-sm font-black uppercase italic text-white shadow-[0_2px_0_#6b2f00] transition-transform hover:scale-105"
            >
              Join
            </button>
            <button
              type="button"
              onClick={() => declineInvite(invite)}
              className="cursor-pointer rounded-xl border-2 border-[#6b2f00] bg-linear-to-b from-[#ff9b8a] to-[#e8590c] px-4 py-1.5 font-display text-sm font-black uppercase italic text-white shadow-[0_2px_0_#6b2f00] transition-transform hover:scale-105"
            >
              Decline
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MatchInviteBanner;
