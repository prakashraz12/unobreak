import { useId } from 'react';

const CX = 512;
const CY = 1000;
const R = 860;

const onSurface = (deg: number, inset = 0) => {
  const a = (deg * Math.PI) / 180;
  return {
    x: CX + (R - inset) * Math.sin(a),
    y: CY - (R - inset) * Math.cos(a),
  };
};

const BUILDINGS: { a: number; w: number; h: number; tone: number }[] = [
  { a: -36, w: 70, h: 120, tone: 0 },
  { a: -30, w: 46, h: 190, tone: 1 },
  { a: -24, w: 80, h: 90, tone: 2 },
  { a: -18, w: 54, h: 150, tone: 0 },
  { a: -12, w: 64, h: 70, tone: 1 },
  { a: -6, w: 90, h: 130, tone: 2 },
  { a: 0, w: 60, h: 80, tone: 0 },
  { a: 7, w: 72, h: 160, tone: 1 },
  { a: 13, w: 50, h: 100, tone: 2 },
  { a: 19, w: 84, h: 140, tone: 0 },
  { a: 26, w: 56, h: 200, tone: 1 },
  { a: 32, w: 76, h: 110, tone: 2 },
  { a: 38, w: 60, h: 150, tone: 0 },
];

const TONES = [
  { face: '#5fb0ef', side: '#3b8fd6', top: '#9cd6ff' },
  { face: '#7cc2f5', side: '#4f9fe0', top: '#bfe6ff' },
  { face: '#4aa1e6', side: '#2e7fc8', top: '#86c9fa' },
];

const TREES: { a: number; s: number }[] = [
  { a: -40, s: 1.2 },
  { a: -35, s: 0.9 },
  { a: -31, s: 1.1 },
  { a: -27, s: 0.8 },
  { a: 27, s: 0.85 },
  { a: 31, s: 1.15 },
  { a: 35, s: 0.9 },
  { a: 40, s: 1.25 },
];

const ConeTree = () => (
  <g>
    <ellipse cx={6} cy={7} rx={32} ry={8} fill="#175012" opacity={0.3} />
    <rect x={-5} y={-6} width={5} height={15} fill="#8a5a26" />
    <rect x={0} y={-6} width={5} height={15} fill="#5e3a16" />
    <ellipse cx={0} cy={-4} rx={30} ry={9} fill="#256e20" />
    <path d="M0,-58 Q-26,-36 -30,-4 Q-18,5 0,6 Z" fill="#46b136" />
    <path d="M0,-58 Q26,-36 30,-4 Q18,5 0,6 Z" fill="#2a7a24" />
    <path
      d="M-2,-52 Q-18,-38 -24,-18"
      stroke="#8ede5a"
      strokeWidth={4}
      fill="none"
      strokeLinecap="round"
      opacity={0.8}
    />
  </g>
);

const JungleBush = () => (
  <g>
    <ellipse cx={4} cy={4} rx={30} ry={7} fill="#175012" opacity={0.3} />
    <circle cx={-12} cy={-8} r={13} fill="#2a7a24" />
    <circle cx={4} cy={-14} r={15} fill="#37962c" />
    <circle cx={14} cy={-6} r={11} fill="#256e20" />
    <circle cx={-6} cy={-16} r={9} fill="#46b136" />
    <circle cx={-10} cy={-19} r={3} fill="#8ede5a" opacity={0.7} />
  </g>
);

const CLOUDS: { x: number; y: number; s: number }[] = [
  { x: 60, y: 40, s: 1.3 },
  { x: 250, y: 20, s: 0.9 },
  { x: 700, y: 30, s: 1 },
  { x: 960, y: 60, s: 1.4 },
  { x: 880, y: 180, s: 0.8 },
  { x: 90, y: 200, s: 0.9 },
];

const CUBES: { x: number; y: number; s: number; r: number }[] = [
  { x: 210, y: 150, s: 34, r: 18 },
  { x: 820, y: 120, s: 28, r: -14 },
  { x: 760, y: 230, s: 20, r: 30 },
  { x: 300, y: 250, s: 18, r: -24 },
];

const JUNGLE: { x: number; y: number; s: number; bush?: boolean }[] = [
  { x: 60, y: 430, s: 2.2 },
  { x: 150, y: 458, s: 1.7 },
  { x: 240, y: 438, s: 1.9, bush: true },
  { x: 335, y: 460, s: 1.4, bush: true },
  { x: 640, y: 465, s: 1.3, bush: true },
  { x: 740, y: 455, s: 1.5, bush: true },
  { x: 820, y: 462, s: 1.5, bush: true },
  { x: 880, y: 428, s: 2.3 },
  { x: 968, y: 456, s: 1.9 },
];

const WorldFloor = ({
  className,
  scenery = false,
  water = true,
  skyline = true,
}: {
  className?: string;

  scenery?: boolean;

  water?: boolean;

  skyline?: boolean;
}) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const id = (name: string) => `${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;

  return (
    <svg
      viewBox="0 0 1024 477"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`absolute inset-0 block h-full w-full select-none ${className ?? ''}`}
    >
      <defs>
        <linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2fa6f5" />
          <stop offset="55%" stopColor="#7fd0ff" />
          <stop offset="100%" stopColor="#c4ecff" />
        </linearGradient>
        <radialGradient id={id('planet')} cx="50%" cy="10%" r="60%">
          <stop offset="0%" stopColor="#e6f76a" />
          <stop offset="25%" stopColor="#b7e548" />
          <stop offset="55%" stopColor="#6cc534" />
          <stop offset="80%" stopColor="#36a02e" />
          <stop offset="100%" stopColor="#1d7a2c" />
        </radialGradient>
        <radialGradient id={id('water')} cx="50%" cy="50%" r="50%">
          <stop offset="88%" stopColor="#36b2f0" />
          <stop offset="100%" stopColor="#1a7fd0" />
        </radialGradient>
        <radialGradient id={id('vignette')} cx="50%" cy="45%" r="75%">
          <stop offset="60%" stopColor="#000" stopOpacity={0} />
          <stop offset="100%" stopColor="#00305a" stopOpacity={0.35} />
        </radialGradient>
        <filter id={id('soft')} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
        <filter id={id('haze')} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={1.5} />
        </filter>
      </defs>

      {skyline && <rect width={1024} height={477} fill={url('sky')} />}

      {skyline && (
        <g fill="#fff" filter={url('soft')} opacity={0.85}>
          {CLOUDS.map(({ x, y, s }) => (
            <g key={`${x}-${y}`} transform={`translate(${x} ${y}) scale(${s})`}>
              <circle cx={-40} cy={10} r={34} />
              <circle cx={0} cy={-8} r={44} />
              <circle cx={44} cy={8} r={36} />
              <ellipse cx={0} cy={26} rx={90} ry={22} />
            </g>
          ))}
        </g>
      )}

      {skyline && (
        <g filter={url('haze')}>
          {BUILDINGS.map(({ a, w, h, tone }) => {
            const t = TONES[tone]!;
            return (
              <g key={a} transform={`rotate(${a} ${CX} ${CY})`}>
                <rect
                  x={CX - w / 2}
                  y={CY - R - h + 30}
                  width={w}
                  height={h}
                  fill={t.face}
                />
                <path
                  d={`M${CX + w / 2},${CY - R - h + 30} l16,-10 l0,${h} l-16,10 Z`}
                  fill={t.side}
                />
                <path
                  d={`M${CX - w / 2},${CY - R - h + 30} l16,-10 l${w},0 l-16,10 Z`}
                  fill={t.top}
                />
              </g>
            );
          })}
        </g>
      )}

      {skyline &&
        CUBES.map(({ x, y, s, r }) => (
          <g
            key={`${x}-${y}`}
            transform={`translate(${x} ${y}) rotate(${r})`}
            opacity={0.9}
          >
            <rect x={-s / 2} y={-s / 2} width={s} height={s} fill="#5aaef0" />
            <path
              d={`M${-s / 2},${-s / 2} l${s * 0.3},${-s * 0.25} l${s},0 l${-s * 0.3},${s * 0.25} Z`}
              fill="#a8dcff"
            />
            <path
              d={`M${s / 2},${-s / 2} l${s * 0.3},${-s * 0.25} l0,${s} l${-s * 0.3},${s * 0.25} Z`}
              fill="#3a8ad4"
            />
          </g>
        ))}

      {water && <circle cx={CX} cy={CY} r={R + 40} fill={url('water')} />}
      <circle cx={CX} cy={CY} r={R} fill={url('planet')} />
      <ellipse
        cx={CX}
        cy={CY - R + 120}
        rx={360}
        ry={90}
        fill="#f2ff9a"
        opacity={0.35}
      />

      <g
        transform={`translate(${CX} ${CY - R + 150}) scale(1 0.5)`}
        fontFamily="'Arial Rounded MT Bold', 'Arial Black', 'Helvetica Neue', Arial, sans-serif"
        fontWeight={900}
        fontSize={110}
        textAnchor="middle"
        dominantBaseline="central"
        letterSpacing={15}
        strokeLinejoin="round"
        opacity={0.55}
      >
        {(
          [
            [32, '#2f6b18'],
            [27, '#367a1d'],
            [22, '#3d8922'],
            [17, '#449727'],
            [12, '#4ba52b'],
            [7, '#51b12f'],
            [3, '#57bd33'],
          ] as [number, string][]
        ).map(([dy, fill]) => (
          <text
            key={dy}
            x={0}
            y={dy}
            fill={fill}
            stroke={fill}
            strokeWidth={8}
            opacity={0.95}
          >
            UNO
          </text>
        ))}
        <text x={0} y={0} fill="#a6de55" stroke="#c9f07a" strokeWidth={8}>
          UNO
        </text>
      </g>

      {scenery && (
        <>
          {TREES.map(({ a, s }) => {
            const { x, y } = onSurface(a, 12);
            return (
              <g
                key={a}
                transform={`translate(${x} ${y}) rotate(${a}) scale(${s})`}
              >
                <ConeTree />
              </g>
            );
          })}

          {JUNGLE.map(({ x, y, s, bush }) => (
            <g key={`${x}-${y}`} transform={`translate(${x} ${y}) scale(${s})`}>
              {bush ? <JungleBush /> : <ConeTree />}
            </g>
          ))}
        </>
      )}

      {skyline && <rect width={1024} height={477} fill={url('vignette')} />}
    </svg>
  );
};

export default WorldFloor;
