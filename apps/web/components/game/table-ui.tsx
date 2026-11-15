'use client';

import { type ButtonHTMLAttributes, type CSSProperties } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import type { Card as EngineCard } from '@repo/game-engine';
import Avatar, { type AvatarConfig } from '../avatars/avatar';
import AvatarFrame from '../avatars/avatar-frame';
import CardBase from '../cards/card-base';
import { toCardBaseProps } from '../../lib/engine-card';
import unoButton from '../../assets/menu/uno-button.png';

const OUTLINE = '#6b2f00';
const MAX_FAN_CARDS = 7;
const DISPLAY_FONT = 'font-display';

const Medal = ({ tone }: { tone: 'silver' | 'green' }) => (
  <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden="true">
    <circle
      cx={12}
      cy={12}
      r={11}
      fill={tone === 'green' ? '#3fbf3a' : '#b9c4d2'}
      stroke="#fff"
      strokeWidth={2}
    />
    <circle
      cx={12}
      cy={12}
      r={6.5}
      fill={tone === 'green' ? '#1f8a2a' : '#6f7d8e'}
    />
    <path
      d="M8.5,15 L8.5,9 L12,12.5 L15.5,9 L15.5,15"
      fill="none"
      stroke="#fff"
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
  </svg>
);

interface PlayerTileProps {
  name: string;
  avatar: AvatarConfig;

  image?: string | null;
  active: boolean;
  isYou?: boolean;

  timer?: { fraction: number; seconds: number } | null;
  className?: string;
}

export const PlayerTile = ({
  name,
  avatar,
  image = null,
  active,
  isYou = false,
  timer = null,
  className,
}: PlayerTileProps) => (
  <div className={`flex flex-col items-center ${className ?? ''}`}>
    <div className="relative">
      {timer && (
        <>
          <svg
            viewBox="0 0 104 104"
            className="pointer-events-none absolute -inset-2 overflow-visible"
            aria-hidden="true"
          >
            <rect
              x={3}
              y={3}
              width={98}
              height={98}
              rx={26}
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={5}
            />
            <rect
              x={3}
              y={3}
              width={98}
              height={98}
              rx={26}
              fill="none"
              stroke={timer.seconds <= 5 ? '#ff3b30' : '#ff9a1f'}
              strokeWidth={timer.seconds <= 5 ? 8 : 5}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray="1"
              strokeDashoffset={1 - timer.fraction}
            />
          </svg>
          <span
            className={`absolute -bottom-2 -left-2 z-10 flex size-7 items-center justify-center rounded-xl border-2 border-white text-sm font-black text-white shadow ${
              timer.seconds <= 5 ? 'animate-pulse bg-[#ff3b30]' : 'bg-[#ff9a1f]'
            }`}
            aria-label={`${timer.seconds} seconds left`}
          >
            {timer.seconds}
          </span>
        </>
      )}
      <AvatarFrame
        className={`size-[clamp(48px,7vw,84px)] rounded-[20%] transition-shadow ${
          active ? 'ring-4 ring-[#ffd61f] shadow-[0_0_18px_#ffd61f]' : ''
        }`}
        windowStyle={{ background: avatar.background }}
      >
        {image ? (
          <img
            src={image}
            alt={name}
            referrerPolicy="no-referrer"
            className="size-full object-cover"
          />
        ) : (
          <Avatar
            avatar={avatar}
            className="size-full! translate-y-[8%] scale-[1.55] drop-shadow-none!"
          />
        )}
      </AvatarFrame>
    </div>
    <div
      className={`-mt-1 flex max-w-[clamp(96px,12vw,150px)] items-center gap-1 rounded-xl border-2 py-0.5 pl-0.5 pr-3 shadow-[0_3px_5px_rgba(0,0,0,0.3)] ${
        active
          ? 'border-[#8f1a0a] bg-linear-to-b from-[#ff8a3a] to-[#e3302b]'
          : 'border-[#0e4a9e] bg-linear-to-b from-[#4fb0ff] to-[#1769d6]'
      }`}
    >
      <Medal tone={isYou ? 'green' : 'silver'} />
      <span className="truncate text-xs font-bold text-white [text-shadow:0_1px_0_rgba(0,0,0,0.45)] sm:text-sm">
        {name}
      </span>
    </div>
  </div>
);

export const GameTimer = ({
  seconds,
  className,
}: {
  seconds: number;
  className?: string;
}) => {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const low = seconds <= 30;
  return (
    <div
      className={`flex items-center gap-2 ${className ?? ''}`}
      aria-label={`${mm}:${ss} remaining`}
    >
      <svg
        viewBox="0 0 40 44"
        className={`size-9 drop-shadow-[0_2px_2px_rgba(0,0,0,0.35)] ${low ? 'animate-pulse' : ''}`}
        aria-hidden="true"
      >
        <rect
          x={16}
          y={1}
          width={8}
          height={6}
          rx={2}
          fill="#ff9a1f"
          stroke={OUTLINE}
          strokeWidth={2}
        />
        <path
          d="M31,8 l5,5"
          stroke={OUTLINE}
          strokeWidth={5}
          strokeLinecap="round"
        />
        <path
          d="M31,8 l5,5"
          stroke="#ff9a1f"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <circle
          cx={20}
          cy={25}
          r={17}
          fill="#ff9a1f"
          stroke={OUTLINE}
          strokeWidth={2.5}
        />
        <circle cx={20} cy={25} r={12.5} fill={low ? '#ffd9d0' : '#fff6c8'} />
        <path
          d="M20,25 L20,16 M20,25 L26,28"
          stroke="#e3202b"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      </svg>
      <span
        className={`${DISPLAY_FONT} text-xl font-black tabular-nums tracking-wide [-webkit-text-stroke:1px_#7a3a00] [text-shadow:0_2px_0_#7a3a00] ${
          low ? 'text-[#ff5a4a]' : 'text-[#ffe14a]'
        }`}
      >
        {mm}:{ss}
      </span>
    </div>
  );
};

export const TopFan = ({
  count,
  hiddenFrom = Infinity,
}: {
  count: number;

  hiddenFrom?: number;
}) => {
  const shown = Math.min(count, MAX_FAN_CARDS);
  return (
    <div className="flex [--cw:clamp(44px,6.4vw,88px)]">
      {Array.from({ length: shown }, (_, i) => {
        const rotZ = (i - (shown - 1) / 2) * 3;
        return (
          <div
            key={i}
            {...dealSlotAttrs(i, rotZ, 0, 1)}
            style={{
              marginLeft: i === 0 ? 0 : 'calc(var(--cw) * -0.62)',
              transform: `rotate(${rotZ}deg)`,
              visibility: i >= hiddenFrom ? 'hidden' : undefined,
            }}
          >
            <CardBase
              color={null}
              value={0}
              faceDown
              className="block w-(--cw)!"
            />
          </div>
        );
      })}
    </div>
  );
};

export const PartnerFan = ({
  cards,
  hiddenFrom = Infinity,
}: {
  cards: EngineCard[];

  hiddenFrom?: number;
}) => {
  const shown = cards.slice(0, MAX_FAN_CARDS);
  return (
    <div className="flex [--cw:clamp(44px,6.4vw,88px)]">
      {shown.map((card, i) => {
        const rotZ = (i - (shown.length - 1) / 2) * 3;
        return (
          <div
            key={card.id}
            {...dealSlotAttrs(i, rotZ, 0, 1)}
            style={{
              marginLeft: i === 0 ? 0 : 'calc(var(--cw) * -0.62)',
              transform: `rotate(${rotZ}deg)`,
              visibility: i >= hiddenFrom ? 'hidden' : undefined,
            }}
          >
            <CardBase {...toCardBaseProps(card)} className="block w-(--cw)!" />
          </div>
        );
      })}
    </div>
  );
};

const dealSlotAttrs = (
  slot: number,
  rotZ: number,
  rotY: number,
  scale: number,
) => ({
  'data-deal-slot': slot,
  'data-rot-z': rotZ,
  'data-rot-y': rotY,
  'data-scale': scale,
});

export const SideFan = ({
  count,
  side,
  hiddenFrom = Infinity,
}: {
  count: number;
  side: 'left' | 'right';

  hiddenFrom?: number;
}) => {
  const shown = Math.min(count, MAX_FAN_CARDS);
  const dir = side === 'left' ? -1 : 1;
  return (
    <div className="relative [--cw:clamp(44px,6.4vw,88px)]">
      {Array.from({ length: shown }, (_, i) => {
        const t = i / (MAX_FAN_CARDS - 1);
        const scale = 0.72 + 0.28 * t;
        return (
          <div
            key={i}
            {...dealSlotAttrs(i, dir * 14, dir * 38, scale)}
            className="absolute"
            style={{
              [side === 'left' ? 'right' : 'left']:
                `calc(var(--cw) * ${0.07 * i + 0.027 * i * i})`,
              top: `calc(var(--cw) * ${0.3 * i})`,
              transformOrigin: 'top center',
              transform: `perspective(520px) rotateZ(${dir * 14}deg) rotateY(${dir * 38}deg) scale(${scale})`,
              visibility: i >= hiddenFrom ? 'hidden' : undefined,
            }}
          >
            <CardBase
              color={null}
              value={0}
              faceDown
              className={`block w-(--cw)! ${
                side === 'left'
                  ? 'drop-shadow-[3px_3px_4px_rgba(0,0,0,0.35)]!'
                  : 'drop-shadow-[-3px_3px_4px_rgba(0,0,0,0.35)]!'
              }`}
            />
          </div>
        );
      })}
    </div>
  );
};

export const DrawDeck = ({
  count,
  canDraw,
  onDraw,
}: {
  count: number;
  canDraw: boolean;
  onDraw: () => void;
}) => (
  <div className="relative flex flex-col items-center [--cw:clamp(44px,6vw,80px)]">
    {canDraw && (
      <svg
        viewBox="0 0 40 48"
        className="absolute top-[calc(-0.75*var(--cw))] z-10 w-[calc(var(--cw)*0.55)] animate-bounce drop-shadow-[0_3px_2px_rgba(0,0,0,0.35)]"
        aria-hidden="true"
      >
        <path
          d="M10,2 L30,2 L30,24 L38,24 L20,46 L2,24 L10,24 Z"
          fill="#ffd61f"
          stroke="#c47a00"
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <path d="M13,5 L19,5 L19,24 L13,24 Z" fill="#fff6a8" opacity={0.8} />
      </svg>
    )}
    {canDraw && (
      <div
        aria-hidden="true"
        className="absolute inset-x-[-30%] bottom-[-15%] top-[-10%] animate-pulse rounded-[50%]"
        style={{
          background:
            'radial-gradient(50% 50% at 50% 55%, rgba(255,214,31,0.85) 0%, rgba(255,180,20,0.45) 45%, transparent 70%)',
          filter: 'blur(6px)',
        }}
      />
    )}
    <button
      type="button"
      onClick={onDraw}
      disabled={!canDraw}
      aria-label={`Draw card, ${count} left`}
      className="relative h-[calc(var(--cw)*1.5)] w-(--cw) cursor-pointer transition-transform enabled:hover:scale-105 disabled:cursor-default"
      style={{ transform: 'perspective(400px) rotateX(38deg) rotateZ(-18deg)' }}
    >
      {[3, 2, 1, 0].map((layer) => (
        <div
          key={layer}
          className="absolute inset-0"
          style={{ transform: `translate(${layer * 1.5}px, ${layer * 3}px)` }}
        >
          <CardBase color={null} value={0} faceDown className="w-(--cw)!" />
        </div>
      ))}
    </button>
  </div>
);

export const TurnPointer = ({
  angle,
  dx = 0,
  dy = 0,
}: {
  angle: number;

  dx?: number;
  dy?: number;
}) => {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      className="pointer-events-none absolute size-0"
      style={{
        left: `calc(50% + var(--cw) * ${dx})`,
        top: `calc(50% + var(--cw) * ${dy})`,
      }}
      animate={{ rotate: angle }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { type: 'spring', stiffness: 120, damping: 16 }
      }
    >
      <svg
        viewBox="0 0 40 24"
        className="absolute left-1/2 top-[calc(var(--cw)*0.9)] w-[calc(var(--cw)*0.45)] -translate-x-1/2 drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]"
        aria-hidden="true"
      >
        <path
          d="M4,4 L36,4 L20,20 Z"
          fill="#fff"
          stroke="#d7e3ea"
          strokeWidth={3}
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  );
};

export const CallUnoButton = ({
  called,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { called: boolean }) => (
  <button
    type="button"
    aria-label="Call UNO"
    className={`group size-[clamp(84px,11vw,140px)] cursor-pointer transition-transform duration-150 enabled:hover:scale-105 enabled:active:scale-90 disabled:cursor-not-allowed ${className ?? ''}`}
    {...props}
  >
    <Image
      src={unoButton}
      alt=""
      className={`block size-full object-contain drop-shadow-[0_6px_6px_rgba(0,0,0,0.35)] transition ${
        called ? 'scale-95 saturate-50' : ''
      }`}
      draggable={false}
    />
  </button>
);

export const SpeakerButton = ({
  muted,
  onToggle,
  className,
}: {
  muted: boolean;
  onToggle: () => void;
  className?: string;
}) => (
  <button
    type="button"
    onClick={onToggle}
    aria-pressed={muted}
    aria-label={muted ? 'Unmute' : 'Mute'}
    className={`flex size-11 cursor-pointer items-center justify-center rounded-xl border-2 border-[#7a3a00] bg-linear-to-b from-[#ffe14a] to-[#f5a300] shadow-[0_3px_0_#7a3a00,0_6px_8px_rgba(0,0,0,0.3)] transition-transform hover:scale-105 active:translate-y-0.5 ${className ?? ''}`}
  >
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
      <path d="M4,9 L8,9 L13,5 L13,19 L8,15 L4,15 Z" fill="#3a2a10" />
      {muted ? (
        <path
          d="M16,9 L21,15 M21,9 L16,15"
          stroke="#3a2a10"
          strokeWidth={2.2}
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M16,9 Q18,12 16,15 M18.5,7 Q22,12 18.5,17"
          fill="none"
          stroke="#3a2a10"
          strokeWidth={2}
          strokeLinecap="round"
        />
      )}
    </svg>
  </button>
);

export const ChatBubble = ({
  text,
  className,
  style,
}: {
  text: string;
  className?: string;
  style?: CSSProperties;
}) => (
  <div
    className={`relative flex items-center gap-3 rounded-2xl border-2 border-[#2b7fd0] bg-linear-to-b from-white to-[#dff1ff] py-1.5 pl-5 pr-1.5 shadow-[0_4px_8px_rgba(0,0,0,0.3)] ${className ?? ''}`}
    style={style}
  >
    <span className="text-lg font-black text-[#1769d6]">{text}</span>
    <span className="flex size-8 items-center justify-center rounded-xl bg-linear-to-b from-[#7be05a] to-[#2fa52a] shadow-inner">
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
        <path d="M3,11 L21,3 L14,21 L11,13 Z" fill="#fff" />
      </svg>
    </span>
    <span className="absolute -bottom-2 left-6 size-3.5 rotate-45 border-b-2 border-r-2 border-[#2b7fd0] bg-[#dff1ff]" />
  </div>
);

export const ChatButton = ({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Chat"
    className={`flex cursor-pointer flex-col items-center transition-transform hover:scale-105 ${className ?? ''}`}
  >
    <svg
      viewBox="0 0 40 40"
      className="size-10 drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]"
      aria-hidden="true"
    >
      <circle
        cx={20}
        cy={20}
        r={18}
        fill="#ffd61f"
        stroke="#c47a00"
        strokeWidth={2.5}
      />
      <ellipse cx={14} cy={16} rx={2.2} ry={3.2} fill="#5a3200" />
      <ellipse cx={26} cy={16} rx={2.2} ry={3.2} fill="#5a3200" />
      <path
        d="M11,24 Q20,32 29,24"
        fill="none"
        stroke="#5a3200"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <ellipse cx={14} cy={9} rx={6} ry={3} fill="#fff" opacity={0.5} />
    </svg>
    <span className="-mt-1 text-xs font-black text-white [text-shadow:0_1px_0_#1769d6,0_0_3px_#1769d6]">
      Chat
    </span>
  </button>
);
