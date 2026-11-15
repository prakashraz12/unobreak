import { useId } from 'react';
import { cn } from '../../lib/utils';

export type HairStyle =
  | 'short'
  | 'spiky'
  | 'buzz'
  | 'curly'
  | 'quiff'
  | 'long'
  | 'bob'
  | 'ponytail'
  | 'bun'
  | 'pigtails'
  | 'curlyLong';
export type Mouth = 'smile' | 'grin';

export interface AvatarConfig {
  id: number;
  name: string;
  gender: 'male' | 'female';
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  eyes: string;
  shirt: string;
  background: string;
  mouth?: Mouth;
  lips?: string;
  beard?: boolean;
  glasses?: boolean;
  earrings?: boolean;
  beanie?: string;
}

const OUTLINE = '#6b2f00';

const shade = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) =>
    Math.max(
      0,
      Math.min(255, Math.round(c + (amt < 0 ? c * amt : (255 - c) * amt))),
    );
  const [r, g, b] = [f(n >> 16), f((n >> 8) & 255), f(n & 255)];
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
};

const circ = (cx: number, cy: number, r: number) =>
  `M${cx - r},${cy} a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 ${-r * 2},0 Z`;

const CURLY_TOP =
  [
    [37, 50, 8],
    [38, 40, 8],
    [44, 32, 9],
    [52, 27, 9],
    [60, 25, 9],
    [68, 27, 9],
    [76, 32, 9],
    [82, 40, 8],
    [83, 50, 8],
  ]
    .map(([x, y, r]) => circ(x!, y!, r!))
    .join(' ') + ' M38,40 C40,30 80,30 82,40 Z';

const HAIR: Record<HairStyle, { back?: string; front: string }> = {
  short: {
    front:
      'M34,58 C32,30 48,22 62,23 C78,23 90,34 86,58 C84,48 80,42 74,40 C64,44 50,42 40,42 C37,47 35,52 34,58 Z',
  },
  buzz: {
    front:
      'M36,52 C36,32 50,28 60,28 C72,28 85,34 84,52 C80,42 70,38 60,38 C50,38 40,42 36,52 Z',
  },
  spiky: {
    front:
      'M35,56 C33,42 36,34 42,30 L39,18 L50,26 L53,13 L62,24 L70,12 L73,26 L84,19 L80,32 C86,39 87,47 85,56 C80,46 72,42 60,42 C48,42 40,46 35,56 Z',
  },
  quiff: {
    front:
      'M34,58 C30,38 40,26 56,24 C66,14 86,16 88,32 C90,42 88,50 86,58 C84,48 78,42 70,40 C66,46 54,46 44,44 C38,47 35,52 34,58 Z',
  },
  curly: { front: CURLY_TOP },
  long: {
    back: 'M30,60 C26,30 44,22 60,22 C78,22 94,30 90,60 L95,104 C80,110 40,110 25,104 Z',
    front:
      'M34,60 C32,34 46,24 60,24 C76,24 88,34 86,60 C82,48 76,40 66,38 C60,46 46,48 38,48 C36,52 35,56 34,60 Z',
  },
  bob: {
    back: 'M30,72 C26,36 42,22 60,22 C78,22 94,36 90,72 C86,80 78,82 74,80 L46,80 C42,82 34,80 30,72 Z',
    front:
      'M34,54 C34,32 48,24 60,24 C74,24 86,32 86,54 L84,46 C70,48 50,48 36,46 Z',
  },
  ponytail: {
    back: 'M78,36 C100,30 106,56 98,80 C94,92 86,94 84,88 C94,68 92,50 78,46 Z',
    front:
      'M34,58 C32,34 46,24 62,24 C78,24 90,36 86,58 C82,44 70,38 56,40 C46,42 38,48 34,58 Z',
  },
  bun: {
    back: circ(60, 22, 13),
    front:
      'M35,56 C34,34 48,28 60,28 C74,28 86,34 85,56 C82,44 72,38 60,38 C48,38 38,44 35,56 Z',
  },
  pigtails: {
    back: `${circ(28, 64, 12)} ${circ(92, 64, 12)}`,
    front:
      'M34,58 C32,34 46,24 60,24 C74,24 88,34 86,58 C84,46 76,40 64,40 L60,32 L56,40 C44,40 36,46 34,58 Z',
  },
  curlyLong: {
    back: [
      [34, 50, 14],
      [30, 68, 13],
      [33, 86, 12],
      [86, 50, 14],
      [90, 68, 13],
      [87, 86, 12],
      [44, 30, 14],
      [60, 24, 15],
      [76, 30, 14],
      [60, 50, 26],
    ]
      .map(([x, y, r]) => circ(x!, y!, r!))
      .join(' '),
    front: CURLY_TOP,
  },
};

const Eye = ({
  x,
  color,
  lashes,
}: {
  x: number;
  color: string;
  lashes: boolean;
}) => {
  const dir = x < 60 ? -1 : 1;
  return (
    <g>
      {lashes && (
        <path
          d={`M${x + dir * 4.5},55 l${dir * 2.6},-2.2 M${x + dir * 3},53.4 l${dir * 1.8},-2.6`}
          stroke="#1a0d05"
          strokeWidth={1.4}
          strokeLinecap="round"
        />
      )}
      <ellipse cx={x} cy={59} rx={5} ry={5.6} fill="#fff" />
      <circle cx={x} cy={59.6} r={3.5} fill={color} />
      <circle cx={x} cy={59.6} r={1.8} fill="#140a04" />
      <circle cx={x + 1.3} cy={58} r={1.2} fill="#fff" />
      <path
        d={`M${x - 5},57.4 Q${x},52.4 ${x + 5},57.4`}
        fill="none"
        stroke="#1a0d05"
        strokeWidth={lashes ? 1.6 : 1}
        strokeLinecap="round"
      />
    </g>
  );
};

const Avatar = ({
  avatar,
  className,
  selected = false,
}: {
  avatar: AvatarConfig;
  className?: string;
  selected?: boolean;
}) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const id = (name: string) => `${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;
  const {
    skin,
    hair,
    hairStyle,
    eyes,
    shirt,
    background,
    gender,
    mouth = 'smile',
    lips,
    beard,
    glasses,
    earrings,
    beanie,
  } = avatar;
  const female = gender === 'female';
  const { back, front } = HAIR[hairStyle];
  const skinDark = shade(skin, -0.22);

  return (
    <svg
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${avatar.name}${selected ? ', selected' : ''}`}
      className={cn(
        'block size-20 shrink-0 select-none drop-shadow-[0_4px_4px_rgba(0,0,0,0.35)]',
        className,
      )}
    >
      <defs>
        <radialGradient id={id('bg')} cx="35%" cy="25%" r="80%">
          <stop offset="0%" stopColor={shade(background, 0.45)} />
          <stop offset="60%" stopColor={background} />
          <stop offset="100%" stopColor={shade(background, -0.3)} />
        </radialGradient>
        <radialGradient id={id('skin')} cx="40%" cy="32%" r="72%">
          <stop offset="0%" stopColor={shade(skin, 0.3)} />
          <stop offset="55%" stopColor={skin} />
          <stop offset="100%" stopColor={skinDark} />
        </radialGradient>
        <linearGradient id={id('hair')} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor={shade(hair, 0.35)} />
          <stop offset="45%" stopColor={hair} />
          <stop offset="100%" stopColor={shade(hair, -0.4)} />
        </linearGradient>
        <linearGradient id={id('shirt')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={shade(shirt, 0.3)} />
          <stop offset="100%" stopColor={shade(shirt, -0.35)} />
        </linearGradient>
        <linearGradient id={id('beanie')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={shade(beanie ?? shirt, 0.3)} />
          <stop offset="100%" stopColor={shade(beanie ?? shirt, -0.3)} />
        </linearGradient>
        <filter id={id('depth')} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx={0}
            dy={2.5}
            stdDeviation={1.5}
            floodColor="#000"
            floodOpacity={0.3}
          />
        </filter>
        <clipPath id={id('clip')}>
          <rect x={7} y={7} width={106} height={106} rx={26} />
        </clipPath>
      </defs>

      <rect x={1} y={1} width={118} height={118} rx={30} fill={OUTLINE} />
      <rect x={3.5} y={3.5} width={113} height={113} rx={28} fill="#fff" />

      <g clipPath={url('clip')}>
        <rect width={120} height={120} fill={url('bg')} />
        <ellipse cx={44} cy={22} rx={30} ry={14} fill="#fff" opacity={0.25} />

        <path
          d="M16,122 C16,98 34,88 60,88 C86,88 104,98 104,122 Z"
          fill={url('shirt')}
          filter={url('depth')}
        />
        {back && <path d={back} fill={url('hair')} filter={url('depth')} />}
        <path d="M52,72 L68,72 L68,88 Q60,96 52,88 Z" fill={skinDark} />
        <path
          d="M50,87.5 Q60,100 70,87.5"
          fill="none"
          stroke={shade(shirt, 0.45)}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <ellipse
          cx={60}
          cy={80}
          rx={10}
          ry={4}
          fill={shade(skin, -0.4)}
          opacity={0.5}
        />

        <g filter={url('depth')}>
          <ellipse cx={36} cy={61} rx={5} ry={7} fill={skinDark} />
          <ellipse cx={84} cy={61} rx={5} ry={7} fill={skinDark} />
          <ellipse cx={60} cy={58} rx={24} ry={26} fill={url('skin')} />
        </g>
        <ellipse
          cx={36.5}
          cy={61}
          rx={2.2}
          ry={3.8}
          fill={shade(skin, -0.38)}
          opacity={0.6}
        />
        <ellipse
          cx={83.5}
          cy={61}
          rx={2.2}
          ry={3.8}
          fill={shade(skin, -0.38)}
          opacity={0.6}
        />
        {earrings && (
          <g fill="#ffd61f" stroke="#c48a00" strokeWidth={0.8}>
            <circle cx={35} cy={70} r={2.6} />
            <circle cx={85} cy={70} r={2.6} />
          </g>
        )}

        <ellipse cx={45} cy={68} rx={5} ry={3} fill="#ff6b8a" opacity={0.35} />
        <ellipse cx={75} cy={68} rx={5} ry={3} fill="#ff6b8a" opacity={0.35} />

        {beard && (
          <path
            d="M37,62 C37,80 48,88 60,88 C72,88 83,80 83,62 C80,72 74,74 66,72 Q60,69 54,72 C46,74 40,72 37,62 Z"
            fill={url('hair')}
          />
        )}

        <path
          d="M58,62 Q56,68 59,69 Q61,69.6 62,68.6"
          fill="none"
          stroke={shade(skin, -0.35)}
          strokeWidth={1.6}
          strokeLinecap="round"
        />
        <ellipse cx={57.6} cy={64} rx={1.2} ry={2} fill="#fff" opacity={0.35} />

        {mouth === 'grin' ? (
          <g>
            <path d="M51,71 Q60,82 69,71 Z" fill="#5a1a1a" />
            <path
              d="M52.5,71.5 L67.5,71.5 Q66.5,74 60,74 Q53.5,74 52.5,71.5 Z"
              fill="#fff"
            />
            <ellipse cx={60} cy={77.4} rx={4} ry={1.8} fill="#e0566b" />
            {lips && (
              <path
                d="M51,71 Q60,82 69,71"
                fill="none"
                stroke={lips}
                strokeWidth={1.6}
                strokeLinejoin="round"
              />
            )}
          </g>
        ) : (
          <path
            d="M53,72 Q60,78 67,72"
            fill="none"
            stroke={lips ?? '#7a2a2a'}
            strokeWidth={lips ? 2.8 : 2.2}
            strokeLinecap="round"
          />
        )}

        <Eye x={50} color={eyes} lashes={female} />
        <Eye x={70} color={eyes} lashes={female} />
        <g
          fill="none"
          stroke={shade(hair, -0.3)}
          strokeWidth={female ? 1.8 : 2.6}
          strokeLinecap="round"
        >
          <path d="M45,50 Q50,47 55,49" />
          <path d="M65,49 Q70,47 75,50" />
        </g>

        <path d={front} fill={url('hair')} filter={url('depth')} />
        <ellipse
          cx={50}
          cy={32}
          rx={10}
          ry={3.5}
          fill="#fff"
          opacity={0.28}
          transform="rotate(-18 50 32)"
        />
        {hairStyle === 'pigtails' && (
          <g fill="#ff4fd8" stroke={OUTLINE} strokeWidth={0.8}>
            <circle cx={38} cy={58} r={3} />
            <circle cx={82} cy={58} r={3} />
          </g>
        )}

        {glasses && (
          <g>
            <g
              fill="#fff"
              fillOpacity={0.18}
              stroke="#1f1f1f"
              strokeWidth={2.2}
            >
              <rect x={42} y={52} width={16} height={13} rx={5} />
              <rect x={62} y={52} width={16} height={13} rx={5} />
            </g>
            <path
              d="M58,57 Q60,55 62,57 M42,56 L36,55 M78,56 L84,55"
              fill="none"
              stroke="#1f1f1f"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <path
              d="M45,55 L49,53.6 M65,55 L69,53.6"
              stroke="#fff"
              strokeWidth={1.4}
              strokeLinecap="round"
              opacity={0.8}
            />
          </g>
        )}

        {beanie && (
          <g filter={url('depth')}>
            <circle cx={60} cy={18} r={6} fill="#fff" />
            <path
              d="M34,48 C34,26 48,20 60,20 C74,20 86,26 86,48 Z"
              fill={url('beanie')}
            />
            <path
              d="M32,44 Q60,36 88,44 L88,52 Q60,44 32,52 Z"
              fill={shade(beanie, -0.2)}
            />
            <path
              d="M44,26 Q40,34 40,42 M60,22 L60,38 M76,26 Q80,34 80,42"
              fill="none"
              stroke={shade(beanie, -0.3)}
              strokeWidth={1.4}
            />
          </g>
        )}
      </g>

      <path
        d="M72,10 L38,10 Q10,10 10,38"
        fill="none"
        stroke="#fff"
        strokeWidth={2.5}
        strokeLinecap="round"
        opacity={0.7}
      />
      {selected && (
        <g>
          <rect
            x={4}
            y={4}
            width={112}
            height={112}
            rx={27}
            fill="none"
            stroke="#38d44a"
            strokeWidth={6}
          />
          <circle
            cx={99}
            cy={99}
            r={17}
            fill="#239c32"
            stroke="#fff"
            strokeWidth={3}
          />
          <path
            d="M91,99 L97,105 L108,93"
            fill="none"
            stroke="#fff"
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
    </svg>
  );
};

export default Avatar;
