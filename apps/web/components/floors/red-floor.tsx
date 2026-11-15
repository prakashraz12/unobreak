import { useId } from 'react';

const CONFETTI: {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  skew: number;
  o: number;
  blur?: boolean;
}[] = [
  { x: 172, y: 16, w: 22, h: 6, r: 30, skew: -20, o: 0.9 },
  { x: 194, y: 30, w: 16, h: 12, r: 10, skew: 30, o: 0.8 },
  { x: 168, y: 116, w: 52, h: 18, r: -25, skew: -30, o: 0.75, blur: true },
  { x: 22, y: 142, w: 18, h: 6, r: 50, skew: -10, o: 0.9 },
  { x: 92, y: 136, w: 22, h: 6, r: 25, skew: -20, o: 0.85 },
  { x: 76, y: 190, w: 30, h: 7, r: -15, skew: -30, o: 0.85 },
  { x: 48, y: 258, w: 62, h: 14, r: -8, skew: -40, o: 0.95 },
  { x: 80, y: 340, w: 14, h: 5, r: 20, skew: -20, o: 0.6, blur: true },
  { x: 42, y: 386, w: 32, h: 12, r: 20, skew: -35, o: 0.85 },
  { x: 940, y: 12, w: 18, h: 6, r: -50, skew: -20, o: 0.9 },
  { x: 798, y: 34, w: 12, h: 6, r: -60, skew: 0, o: 0.8 },
  { x: 974, y: 46, w: 18, h: 6, r: -30, skew: -20, o: 0.8 },
  { x: 850, y: 76, w: 52, h: 16, r: -4, skew: -35, o: 0.9 },
  { x: 922, y: 124, w: 22, h: 6, r: 35, skew: -10, o: 0.8 },
  { x: 976, y: 138, w: 20, h: 30, r: -20, skew: -25, o: 0.6, blur: true },
  { x: 872, y: 180, w: 24, h: 5, r: 10, skew: -30, o: 0.6 },
  { x: 968, y: 222, w: 22, h: 6, r: 20, skew: -20, o: 0.8 },
  { x: 958, y: 322, w: 44, h: 16, r: 30, skew: -30, o: 0.9 },
  { x: 888, y: 420, w: 74, h: 22, r: 22, skew: -35, o: 0.95 },
];

const RedFloor = ({ className }: { className?: string }) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const id = (name: string) => `${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;

  return (
    <svg
      viewBox="0 0 1024 477"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      className={`absolute inset-0 block h-full w-full select-none ${className ?? ''}`}
    >
      <defs>
        <radialGradient
          id={id('bg')}
          cx="50%"
          cy="50%"
          r="75%"
          gradientTransform="translate(0.5 0.5) scale(1 1.6) translate(-0.5 -0.5)"
        >
          <stop offset="0%" stopColor="#ff7a00" />
          <stop offset="30%" stopColor="#ff2a00" />
          <stop offset="60%" stopColor="#d60000" />
          <stop offset="100%" stopColor="#9a0000" />
        </radialGradient>

        <radialGradient id={id('core')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffe53d" />
          <stop offset="35%" stopColor="#ffc21a" />
          <stop offset="65%" stopColor="#ff8a00" />
          <stop offset="88%" stopColor="#ff4a00" />
          <stop offset="100%" stopColor="#ff2200" />
        </radialGradient>

        <radialGradient id={id('vignette')} cx="50%" cy="50%" r="70%">
          <stop offset="60%" stopColor="#000" stopOpacity={0} />
          <stop offset="100%" stopColor="#4a0000" stopOpacity={0.55} />
        </radialGradient>

        <filter id={id('blur-lg')} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={18} />
        </filter>
        <filter id={id('blur-md')} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
        <filter id={id('blur-sm')} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={1.6} />
        </filter>
        <filter id={id('glow')} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={3} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width={1024} height={477} fill={url('bg')} />

      <g transform="translate(512 260)">
        <ellipse
          rx={470}
          ry={215}
          fill="none"
          stroke="#ff2a10"
          strokeOpacity={0.35}
          strokeWidth={14}
          filter={url('blur-md')}
        />
        <ellipse
          rx={440}
          ry={198}
          fill="none"
          stroke="#ff3a1a"
          strokeOpacity={0.4}
          strokeWidth={6}
          filter={url('blur-sm')}
        />
        <ellipse
          rx={400}
          ry={180}
          fill="#ff1a00"
          opacity={0.55}
          filter={url('blur-lg')}
        />

        <ellipse
          cy={-10}
          rx={368}
          ry={162}
          fill={url('core')}
          filter={url('blur-md')}
        />
        <ellipse
          cy={-10}
          rx={368}
          ry={162}
          fill="none"
          stroke="#ff1e00"
          strokeWidth={4}
          opacity={0.8}
          filter={url('blur-sm')}
        />

        <ellipse
          cy={-18}
          rx={240}
          ry={100}
          fill="none"
          stroke="#ff9a10"
          strokeOpacity={0.5}
          strokeWidth={18}
          filter={url('blur-md')}
        />
        <ellipse
          cy={-18}
          rx={210}
          ry={90}
          fill="none"
          stroke="#ffb21a"
          strokeWidth={3}
          filter={url('glow')}
        />
        <ellipse
          cy={-22}
          rx={170}
          ry={68}
          fill="#ffe84a"
          opacity={0.45}
          filter={url('blur-lg')}
        />
      </g>

      <rect width={1024} height={477} fill={url('vignette')} />

      {CONFETTI.map(({ x, y, w, h, r, skew, o, blur }, i) => (
        <rect
          key={i}
          x={-w / 2}
          y={-h / 2}
          width={w}
          height={h}
          fill="#ff1a0a"
          opacity={o}
          transform={`translate(${x} ${y}) rotate(${r}) skewX(${skew})`}
          filter={blur ? url('blur-sm') : undefined}
        />
      ))}
    </svg>
  );
};

export default RedFloor;
