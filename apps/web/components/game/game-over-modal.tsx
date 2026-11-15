'use client';

import { useEffect, useRef, useState } from 'react';
import Confetti from 'react-confetti';
import { motion, useReducedMotion } from 'framer-motion';
import Avatar from '../avatars/avatar';
import { AVATARS } from '../avatars/presets';

const CONFETTI_COLORS = [
  '#3aa0ff',
  '#ff8a1f',
  '#ff4f8b',
  '#7be05a',
  '#ffd61f',
  '#b36bff',
];

const Star = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
    <path
      d="M10 1.5 L12.4 7 L18.4 7.6 L13.9 11.6 L15.3 17.6 L10 14.4 L4.7 17.6 L6.1 11.6 L1.6 7.6 L7.6 7 Z"
      fill="#ffd93b"
      stroke="#b87800"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
);

const LaurelBranch = ({
  className,
  mirrored = false,
}: {
  className?: string;
  mirrored?: boolean;
}) => (
  <svg
    viewBox="0 0 80 105"
    className={className}
    style={mirrored ? { transform: 'scaleX(-1)' } : undefined}
    aria-hidden="true"
  >
    <path
      d="M70 100 C40 104, 15 95, 10 60 C6 32, 16 10, 38 3"
      fill="none"
      stroke="#c4861b"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {[
      [62, 100, -15, 1],
      [46, 98, -35, -1],
      [29, 91, -55, 1],
      [17, 78, -70, -1],
      [10, 61, -82, 1],
      [11, 43, -72, -1],
      [18, 26, -55, 1],
      [30, 11, -35, -1],
    ].map(([x, y, a, s], i) => (
      <g key={i} transform={`translate(${x},${y}) rotate(${a}) scale(1,${s})`}>
        <path
          d="M-10 0 Q-2 -6.5 10 -1 Q-2 6.5 -10 0 Z"
          fill="#f7c948"
          stroke="#ffe89a"
          strokeWidth="1.4"
        />
        <path d="M-7 0 L7 -0.5" stroke="#c4861b" strokeWidth="1" />
      </g>
    ))}
  </svg>
);

const TrumpetSvg = ({
  id,
  delay,
  reduced,
}: {
  id: string;
  delay: number;
  reduced: boolean;
}) => (
  <svg
    viewBox="0 0 130 90"
    className="h-[90px] w-[130px] overflow-visible"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stopColor="#fff2a0" />
        <stop offset="0.45" stopColor="#ffd21f" />
        <stop offset="0.8" stopColor="#f0a400" />
        <stop offset="1" stopColor="#b8740a" />
      </linearGradient>
      <clipPath id={`${id}-bell`}>
        <path d="M50 34 C36 22, 20 8, 8 -2 C-4 14, -3 40, 10 54 C22 64, 40 64, 54 54 Z" />
      </clipPath>
    </defs>
    <path d="M48 42 L128 78 L124 88 L44 52 Z" fill="#8c1119" />
    <path d="M48 38 L128 74 L124 83 L44 48 Z" fill="#d11f2b" />
    <path
      d="M50 39 L122 71"
      fill="none"
      stroke="#ff6b6b"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <motion.g
      style={{ transformOrigin: '50px 44px', transformBox: 'fill-box' }}
      animate={
        reduced
          ? undefined
          : {
              scale: [1, 1.15, 1],
              filter: ['brightness(1)', 'brightness(1.25)', 'brightness(1)'],
            }
      }
      transition={{ repeat: Infinity, duration: 0.9, delay }}
    >
      <path
        d="M50 34 C36 22, 20 8, 8 -2 C-4 14, -3 40, 10 54 C22 64, 40 64, 54 54 Z"
        fill={`url(#${id})`}
      />
      <ellipse
        cx="30"
        cy="12"
        rx="12"
        ry="5"
        transform="rotate(-28 30 12)"
        fill="rgba(255,255,255,0.35)"
        clipPath={`url(#${id}-bell)`}
      />
      <ellipse
        cx="16"
        cy="22"
        rx="16"
        ry="26"
        transform="rotate(-22 16 22)"
        fill="#ffe46b"
        stroke="#fff2a0"
        strokeWidth="3.5"
      />
      <ellipse
        cx="19"
        cy="25"
        rx="9.5"
        ry="17"
        transform="rotate(-22 19 25)"
        fill="#c98400"
        opacity="0.5"
      />
    </motion.g>
  </svg>
);

const Trumpet = ({
  id,
  className,
  mirrored = false,
  delay,
  reduced,
}: {
  id: string;
  className?: string;
  mirrored?: boolean;
  delay: number;
  reduced: boolean;
}) => (
  <motion.div
    className={`absolute ${className ?? ''}`}
    initial={reduced ? false : { rotate: mirrored ? -40 : 40, opacity: 0 }}
    animate={{ rotate: 0, opacity: 1 }}
    transition={{ delay: 0.25, type: 'spring', stiffness: 180, damping: 14 }}
    style={{ transformOrigin: mirrored ? 'right bottom' : 'left bottom' }}
  >
    <div style={mirrored ? { transform: 'scaleX(-1)' } : undefined}>
      <motion.div
        style={{ transformOrigin: '128px 80px', transformBox: 'fill-box' }}
        animate={reduced ? undefined : { rotate: [0, 5, 0] }}
        transition={{ repeat: Infinity, duration: 0.9, delay }}
        className="relative"
      >
        <TrumpetSvg id={id} delay={delay} reduced={reduced} />
      </motion.div>
    </div>
  </motion.div>
);

const Ribbon = () => (
  <svg viewBox="0 0 520 64" className="h-16 w-130" aria-hidden="true">
    <path
      d="M42 20 L8 32 L20 42 L8 56 L42 58 Z"
      fill="#b8263f"
      transform="translate(0,6)"
    />
    <path
      d="M478 20 L512 32 L500 42 L512 56 L478 58 Z"
      fill="#b8263f"
      transform="translate(0,6)"
    />
    <path d="M42 20 L30 38 L42 56 Z" fill="#8e1b2f" />
    <path d="M478 20 L490 38 L478 56 Z" fill="#8e1b2f" />
    <path d="M40 14 Q260 0 480 14 L480 56 Q260 44 40 56 Z" fill="#f04a62" />
    <path d="M40 14 Q260 0 480 14 L480 19 Q260 5 40 19 Z" fill="#ff7a8e" />
    <path d="M40 51 Q260 39 480 51 L480 56 Q260 44 40 56 Z" fill="#c9304b" />
  </svg>
);

interface GameOverModalProps {
  won: boolean;
  winnerName: string;
  winnerAvatar: { avatarId: number; image?: string | null };
  onHome: () => void;
}

const GameOverModal = ({
  won,
  winnerName,
  winnerAvatar,
  onHome,
}: GameOverModalProps) => {
  const reducedMotion = useReducedMotion();
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const homeFiredRef = useRef(false);

  useEffect(() => {
    const update = () =>
      setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const onHomeRef = useRef(onHome);
  onHomeRef.current = onHome;

  useEffect(() => {
    const id = setInterval(
      () => setSecondsLeft((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (secondsLeft > 0 || homeFiredRef.current) return;
    homeFiredRef.current = true;
    onHomeRef.current();
  }, [secondsLeft]);

  const title = won
    ? winnerName === 'Your team'
      ? 'VICTORY!'
      : 'YOU WIN!'
    : 'WINNER';
  const subtitle = won
    ? winnerName === 'Your team'
      ? 'Your team won this round!'
      : 'You won this round!'
    : `${winnerName} won this round.`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-label="Game over"
    >
      <div className="absolute inset-0 bg-[rgba(4,14,34,0.78)]" />
      <div className="pointer-events-none absolute inset-0">
        {size.w > 0 && (
          <Confetti
            width={size.w}
            height={size.h}
            numberOfPieces={180}
            recycle
            gravity={0.12}
            colors={CONFETTI_COLORS}
            confettiSource={{ x: 0, y: 0, w: size.w, h: 0 }}
            drawShape={(ctx) => {
              const w = 6 + Math.random() * 4;
              if (Math.random() < 0.5) {
                ctx.beginPath();
                ctx.moveTo(0, -w / 2);
                ctx.lineTo(w / 2, w / 2);
                ctx.lineTo(-w / 2, w / 2);
                ctx.closePath();
                ctx.fill();
              } else {
                ctx.fillRect(-w / 2, -w / 3, w, (w * 2) / 3);
              }
            }}
          />
        )}
      </div>

      <div className="relative w-130 max-w-none scale-[0.62] min-[420px]:scale-75 min-[560px]:scale-90 min-[700px]:scale-100">
        <div className="relative h-52.5">
          <Trumpet
            id="tr-o-l"
            className="left-[calc(50%-187px)] top-[43px]"
            delay={0}
            reduced={reducedMotion ?? false}
          />
          <Trumpet
            id="tr-i-l"
            className="left-[calc(50%-121px)] top-[52px] scale-[0.8]"
            delay={0.15}
            reduced={reducedMotion ?? false}
          />
          <Trumpet
            id="tr-o-r"
            className="right-[calc(50%-187px)] top-[43px]"
            mirrored
            delay={0}
            reduced={reducedMotion ?? false}
          />
          <Trumpet
            id="tr-i-r"
            className="right-[calc(50%-121px)] top-[52px] scale-[0.8]"
            mirrored
            delay={0.15}
            reduced={reducedMotion ?? false}
          />

          <LaurelBranch className="absolute left-[calc(50%-85px)] top-0 z-5 h-[105px] w-20" />
          <LaurelBranch
            className="absolute right-[calc(50%-85px)] top-0 z-5 h-[105px] w-20"
            mirrored
          />

          <motion.div
            className="absolute left-1/2 top-0 z-10 -translate-x-1/2"
            initial={reducedMotion ? false : { scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          >
            <div className="relative flex size-24 items-center justify-center rounded-[14px] bg-white p-1.75 shadow-[0_6px_14px_rgba(0,0,0,0.35)]">
              <div className="relative size-full overflow-hidden rounded-[9px] bg-linear-to-b from-[#6aa8f5] to-[#2f62cf]">
                {winnerAvatar.image ? (
                  <img
                    src={winnerAvatar.image}
                    alt={winnerName}
                    referrerPolicy="no-referrer"
                    className="size-full object-cover"
                  />
                ) : (
                  <Avatar
                    avatar={
                      AVATARS.find((a) => a.id === winnerAvatar.avatarId) ??
                      AVATARS[0]!
                    }
                    className="size-full! translate-y-[8%] scale-[1.55]"
                  />
                )}
              </div>
              <div className="absolute bottom-0.5 left-1/2 z-10 flex -translate-x-1/2 gap-0.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">
                {Array.from({ length: won ? 3 : 2 }).map((_, i) => (
                  <Star key={i} className="size-5" />
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            className="absolute left-1/2 top-26 z-20 -translate-x-1/2"
            initial={reducedMotion ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.15, duration: 0.3, ease: 'easeOut' }}
          >
            <div className="relative">
              <Ribbon />
              <p className="absolute inset-0 flex items-center justify-center font-display text-[22px] font-black tracking-[0.5px] text-[#ffe14d] drop-shadow-[0_2px_0_rgba(0,0,0,0.35)] [-webkit-text-stroke:4px_#5a0c1c] [paint-order:stroke_fill]">
                {title}
              </p>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="mt-[-38px] flex flex-col items-center"
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.3 }}
        >
          <p className="max-w-[320px] text-center font-sans text-lg font-extrabold leading-snug text-[#ffc93c]">
            {subtitle}
            <br />
            Returning home in {secondsLeft}s
          </p>

          <div className="mt-11.5 flex items-center">
            <button
              type="button"
              onClick={onHome}
              className="relative h-11.25 w-31.5 overflow-hidden isolate rounded-xl border-2 border-[#2b8f12] bg-linear-to-b from-[#9cf24f] to-[#43c21f] font-display text-[22px] font-black text-white shadow-[inset_0_-4px_0_#2b8f12,0_4px_10px_rgba(0,0,0,0.35)] outline-none transition-transform duration-150 [-webkit-text-stroke:3px_#1e6b0c] [paint-order:stroke_fill] before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-linear-to-b before:-z-10 before:from-white/50 before:to-white/0 hover:scale-105 active:translate-y-px"
            >
              Return
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GameOverModal;
