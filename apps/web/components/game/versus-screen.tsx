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

const PANELS = [
  ['#f23d72', '#e0245e'],
  ['#2e9be8', '#1a7fd4'],
  ['#4cc93f', '#2fa52a'],
  ['#ffc21f', '#f59e0b'],
] as const;

const SLANT = 6;

const VsBadge = ({ delay }: { delay: number }) => {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      className="relative flex items-start justify-center"
      initial={reducedMotion ? undefined : { scale: 0, rotate: -18 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 13, delay }}
    >
      <div className="absolute left-1/2 top-1/2 -z-10 size-[18vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 blur-2xl" />
      <span className="bg-linear-to-b from-[#ffd61f] via-[#ff8a1a] to-[#e6392e] bg-clip-text font-display text-[clamp(44px,8vw,96px)] leading-none font-black italic text-transparent [-webkit-text-stroke:4px_#fff] drop-shadow-[0_5px_0_rgba(0,0,0,0.22)]">
        V
      </span>
      <span className="-ml-2 mt-[0.45em] bg-linear-to-b from-[#b5ecff] via-[#3fbdf5] to-[#0d8bd4] bg-clip-text font-display text-[clamp(44px,8vw,96px)] leading-none font-black italic text-transparent [-webkit-text-stroke:4px_#fff] drop-shadow-[0_5px_0_rgba(0,0,0,0.22)]">
        S
      </span>
    </motion.div>
  );
};

const VersusScreen = ({ you, bots, onDone }: VersusScreenProps) => {
  const fighters = [you, ...bots];
  const count = fighters.length;
  const width = 100 / count;
  const seam = (k: number) =>
    k === 0 || k === count
      ? { top: k * width, bottom: k * width }
      : { top: k * width + SLANT, bottom: k * width - SLANT };

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
          {PANELS.map(([from, to], i) => (
            <linearGradient
              key={i}
              id={`vs-panel-${i}`}
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop offset="0%" stopColor={from} />
              <stop offset="100%" stopColor={to} />
            </linearGradient>
          ))}
          <filter id="vs-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.7" />
          </filter>
        </defs>
        {fighters.map((f, i) => {
          const l = seam(i);
          const r = seam(i + 1);
          return (
            <polygon
              key={f.id}
              points={`${l.top},0 ${r.top},0 ${r.bottom},100 ${l.bottom},100`}
              fill={`url(#vs-panel-${i % PANELS.length})`}
            />
          );
        })}
        {fighters.slice(1).map((f, i) => {
          const { top, bottom } = seam(i + 1);
          return (
            <g key={f.id}>
              <line
                x1={top}
                y1={0}
                x2={bottom}
                y2={100}
                stroke="#fff"
                strokeWidth={1.6}
                filter="url(#vs-glow)"
                strokeLinecap="round"
              />
              <line
                x1={top}
                y1={0}
                x2={bottom}
                y2={100}
                stroke="#fff"
                strokeWidth={0.35}
              />
            </g>
          );
        })}
      </svg>

      {fighters.map((f, i) => (
        <div
          key={f.id}
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${(i + 0.5) * width}%` }}
        >
          <FighterTile
            avatar={f}
            tone={i === 0 ? 'you' : 'bot'}
            delay={0.15 + i * 0.12}
          />
        </div>
      ))}

      {fighters.slice(1).map((f, i) => (
        <div
          key={f.id}
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${(i + 1) * width}%` }}
        >
          <VsBadge delay={0.35 + i * 0.12} />
        </div>
      ))}
    </div>
  );
};

export default VersusScreen;
