'use client';

import { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Avatar, { type AvatarConfig } from '../avatars/avatar';
import AvatarFrame from '../avatars/avatar-frame';
import { NamePill, TILE_SIZE } from './game-ui/matchmaking-screen';

const VS_DURATION = 2400;

const FighterTile = ({
  avatar,
  tone,
  delay = 0,
}: {
  avatar: AvatarConfig;
  tone: 'you' | 'bot';
  delay?: number;
}) => (
  <motion.div
    className="flex flex-col items-center"
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: 'spring', stiffness: 320, damping: 16, delay }}
  >
    <AvatarFrame
      className={TILE_SIZE}
      windowStyle={{ background: avatar.background }}
    >
      <Avatar
        avatar={avatar}
        className="size-full! translate-y-[8%] scale-[1.55]"
      />
    </AvatarFrame>
    <NamePill name={avatar.name ?? '???'} tone={tone} />
  </motion.div>
);

interface VersusScreenProps {
  you: AvatarConfig;
  bots: AvatarConfig[];
  onDone: () => void;
}

const VersusScreen = ({ you, bots, onDone }: VersusScreenProps) => {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const t = setTimeout(onDone, VS_DURATION);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="relative h-dvh w-full select-none overflow-hidden">
      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="vs-pink" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f23d72" />
            <stop offset="100%" stopColor="#e0245e" />
          </linearGradient>
          <linearGradient id="vs-blue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2e9be8" />
            <stop offset="100%" stopColor="#1a7fd4" />
          </linearGradient>
          <filter id="vs-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.7" />
          </filter>
        </defs>
        <polygon points="0,0 58,0 42,100 0,100" fill="url(#vs-pink)" />
        <polygon points="58,0 100,0 100,100 42,100" fill="url(#vs-blue)" />
        <line
          x1={58}
          y1={0}
          x2={42}
          y2={100}
          stroke="#fff"
          strokeWidth={1.6}
          filter="url(#vs-glow)"
          strokeLinecap="round"
        />
        <line
          x1={58}
          y1={0}
          x2={42}
          y2={100}
          stroke="#fff"
          strokeWidth={0.35}
        />
      </svg>

      <div className="absolute left-[16%] top-1/2 -translate-y-1/2">
        <FighterTile avatar={you} tone="you" delay={0.15} />
      </div>

      <div className="absolute right-[14%] top-1/2 flex -translate-y-1/2 flex-col items-center gap-[4vh]">
        {bots.map((bot, i) => (
          <FighterTile
            key={bot.id}
            avatar={bot}
            tone="bot"
            delay={0.3 + i * 0.12}
          />
        ))}
      </div>

      <motion.div
        className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-start justify-center"
        initial={reducedMotion ? undefined : { scale: 0, rotate: -18 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 13 }}
      >
        <div className="absolute left-1/2 top-1/2 -z-10 h-[38vmin] w-[38vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 blur-3xl" />
        <span className="bg-linear-to-b from-[#ffd61f] via-[#ff8a1a] to-[#e6392e] bg-clip-text font-display text-[clamp(90px,20vw,190px)] leading-none font-black italic text-transparent [-webkit-text-stroke:7px_#fff] drop-shadow-[0_8px_0_rgba(0,0,0,0.22)]">
          V
        </span>
        <span className="-ml-4 mt-[0.55em] bg-linear-to-b from-[#b5ecff] via-[#3fbdf5] to-[#0d8bd4] bg-clip-text font-display text-[clamp(90px,20vw,190px)] leading-none font-black italic text-transparent [-webkit-text-stroke:7px_#fff] drop-shadow-[0_8px_0_rgba(0,0,0,0.22)]">
          S
        </span>
      </motion.div>
    </div>
  );
};

export default VersusScreen;
