import { useId } from 'react';
import { CARD_COLORS } from '../cards/card-base';

const RAYS = 24;
const RAY_LENGTH = 900;

const rayPath = (i: number) => {
  const half = Math.PI / RAYS;
  const a = (i * 2 * Math.PI) / RAYS;
  const p = (angle: number) =>
    `${(RAY_LENGTH * Math.cos(angle)).toFixed(1)},${(RAY_LENGTH * Math.sin(angle)).toFixed(1)}`;
  return `M0,0 L${p(a - half)} L${p(a + half)} Z`;
};

const CARDS: {
  x: number;
  y: number;
  r: number;
  s: number;
  color: keyof typeof CARD_COLORS;
  delay: number;
  dur: number;
}[] = [
  { x: 110, y: 110, r: -18, s: 1.1, color: 'red', delay: 0, dur: 6 },
  { x: 70, y: 330, r: 14, s: 0.9, color: 'yellow', delay: -2, dur: 7 },
  { x: 230, y: 410, r: -8, s: 0.7, color: 'green', delay: -4, dur: 5.5 },
  { x: 260, y: 60, r: 22, s: 0.6, color: 'blue', delay: -1, dur: 6.5 },
  { x: 910, y: 100, r: 16, s: 1, color: 'green', delay: -3, dur: 6 },
  { x: 960, y: 330, r: -20, s: 1.15, color: 'red', delay: -5, dur: 7.5 },
  { x: 790, y: 420, r: 10, s: 0.75, color: 'yellow', delay: -1.5, dur: 5 },
  { x: 770, y: 50, r: -12, s: 0.6, color: 'blue', delay: -2.5, dur: 6.8 },
];

const SPARKLES: { x: number; y: number; s: number; delay: number }[] = [
  { x: 180, y: 220, s: 1, delay: 0 },
  { x: 340, y: 120, s: 0.7, delay: -0.6 },
  { x: 380, y: 380, s: 0.8, delay: -1.2 },
  { x: 640, y: 90, s: 0.9, delay: -0.3 },
  { x: 700, y: 390, s: 0.6, delay: -1.6 },
  { x: 850, y: 240, s: 1.1, delay: -0.9 },
  { x: 520, y: 440, s: 0.7, delay: -2 },
  { x: 40, y: 40, s: 0.8, delay: -1.4 },
  { x: 990, y: 30, s: 0.7, delay: -0.2 },
];

const SPARKLE = 'M0,-12 Q2,-2 12,0 Q2,2 0,12 Q-2,2 -12,0 Q-2,-2 0,-12 Z';

const MiniUnoCard = ({ fill }: { fill: string }) => (
  <g>
    <rect
      x={-17}
      y={-25}
      width={34}
      height={50}
      rx={6}
      fill="#000"
      opacity={0.3}
      transform="translate(3 4)"
    />
    <rect x={-17} y={-25} width={34} height={50} rx={6} fill="#fff" />
    <rect x={-14} y={-22} width={28} height={44} rx={4} fill={fill} />
    <ellipse
      rx={10}
      ry={17}
      fill="none"
      stroke="#fff"
      strokeWidth={2.5}
      transform="rotate(30)"
    />
  </g>
);

const BlueFloor = ({ className }: { className?: string }) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const id = (name: string) => `${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;
  const cls = (name: string) => `${uid}-${name}`;

  const css = `
    .${cls('spin')} { transform-origin: 0 0; animation: ${cls('spin')} 40s linear infinite; }
    .${cls('spin-rev')} { transform-origin: 0 0; animation: ${cls('spin')} 60s linear infinite reverse; }
    .${cls('pulse')} { transform-origin: 0 0; animation: ${cls('pulse')} 4.5s ease-out infinite; }
    .${cls('glow')} { transform-origin: 0 0; animation: ${cls('glow')} 3s ease-in-out infinite alternate; }
    .${cls('float')} { animation: ${cls('float')} var(--dur) ease-in-out var(--delay) infinite alternate; }
    .${cls('twinkle')} { transform-box: fill-box; transform-origin: center; animation: ${cls('twinkle')} 2.4s ease-in-out var(--delay) infinite; }
    @keyframes ${cls('spin')} { to { transform: rotate(360deg); } }
    @keyframes ${cls('pulse')} {
      0% { transform: scale(0.6); opacity: 0; }
      15% { opacity: 0.9; }
      100% { transform: scale(4.2); opacity: 0; }
    }
    @keyframes ${cls('glow')} {
      from { transform: scale(0.92); opacity: 0.75; }
      to { transform: scale(1.08); opacity: 1; }
    }
    @keyframes ${cls('float')} {
      from { transform: translateY(-10px) rotate(-6deg); }
      to { transform: translateY(12px) rotate(8deg); }
    }
    @keyframes ${cls('twinkle')} {
      0%, 100% { transform: scale(0.2) rotate(0deg); opacity: 0; }
      50% { transform: scale(1) rotate(90deg); opacity: 1; }
    }
    @media (prefers-reduced-motion: reduce) {
      .${cls('root')} * { animation: none !important; }
    }
  `;

  return (
    <svg
      viewBox="0 0 1024 477"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      className={`${cls('root')} absolute inset-0 block h-full w-full select-none ${className ?? ''}`}
    >
      <style>{css}</style>
      <defs>
        <radialGradient id={id('bg')} cx="50%" cy="50%" r="75%">
          <stop offset="0%" stopColor="#5b3bff" />
          <stop offset="45%" stopColor="#2a1aa8" />
          <stop offset="100%" stopColor="#0c0440" />
        </radialGradient>
        <radialGradient
          id={id('rays')}
          cx="0"
          cy="0"
          r={RAY_LENGTH}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#8f7bff" stopOpacity={0.55} />
          <stop offset="60%" stopColor="#6a4dff" stopOpacity={0.15} />
          <stop offset="100%" stopColor="#6a4dff" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={id('core')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="25%" stopColor="#7ff3ff" />
          <stop offset="60%" stopColor="#ff4fd8" stopOpacity={0.6} />
          <stop offset="100%" stopColor="#ff4fd8" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={id('vignette')} cx="50%" cy="50%" r="70%">
          <stop offset="55%" stopColor="#000" stopOpacity={0} />
          <stop offset="100%" stopColor="#05001f" stopOpacity={0.7} />
        </radialGradient>
        <filter id={id('blur')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={14} />
        </filter>
      </defs>

      <rect width={1024} height={477} fill={url('bg')} />

      <g transform="translate(512 240)">
        <g className={cls('spin')}>
          {Array.from(
            { length: RAYS },
            (_, i) =>
              i % 2 === 0 && <path key={i} d={rayPath(i)} fill={url('rays')} />,
          )}
        </g>
        <g
          className={cls('spin-rev')}
          fill="none"
          stroke="#9d8cff"
          strokeOpacity={0.35}
          strokeWidth={3}
          strokeDasharray="4 18"
          strokeLinecap="round"
        >
          <circle r={180} />
          <circle r={300} strokeDasharray="2 26" />
        </g>

        <g transform="scale(1 0.44)">
          {[0, 1.5, 3].map((delay) => (
            <circle
              key={delay}
              r={110}
              fill="none"
              stroke="#7ff3ff"
              strokeWidth={4}
              vectorEffect="non-scaling-stroke"
              className={cls('pulse')}
              style={{ animationDelay: `${-delay}s` }}
            />
          ))}
        </g>

        <g className={cls('glow')}>
          <ellipse
            rx={230}
            ry={110}
            fill={url('core')}
            opacity={0.75}
            filter={url('blur')}
          />
          <ellipse
            rx={120}
            ry={52}
            fill="#c8fbff"
            opacity={0.5}
            filter={url('blur')}
          />
        </g>
      </g>

      <rect width={1024} height={477} fill={url('vignette')} />

      {SPARKLES.map(({ x, y, s, delay }, i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <path
            d={SPARKLE}
            fill="#fff"
            className={cls('twinkle')}
            style={{ ['--delay' as string]: `${delay}s` }}
          />
        </g>
      ))}

      {CARDS.map(({ x, y, r, s, color, delay, dur }, i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
          <g
            className={cls('float')}
            style={{
              ['--delay' as string]: `${delay}s`,
              ['--dur' as string]: `${dur}s`,
            }}
          >
            <MiniUnoCard fill={CARD_COLORS[color]} />
          </g>
        </g>
      ))}
    </svg>
  );
};

export default BlueFloor;
