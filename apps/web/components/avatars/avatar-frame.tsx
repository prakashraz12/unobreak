import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

const TIMER_PATH =
  'M200 64 H264 A40 40 0 0 1 304 104 V236 A40 40 0 0 1 264 276 H136 A40 40 0 0 1 96 236 V104 A40 40 0 0 1 136 64 Z';

const AvatarFrame = ({
  children,
  className,
  windowClassName,
  windowStyle,
  progress,
}: {
  children: ReactNode;
  className?: string;

  windowClassName?: string;
  windowStyle?: CSSProperties;
  progress?: number | null;
}) => (
  <div className={cn('relative aspect-square w-20 shrink-0', className)}>
    <svg
      viewBox="0 0 400 360"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{
        width: '204.08%',
        height: '183.67%',
        left: '-52.04%',
        top: '-36.73%',
      }}
    >
      <rect
        x="80"
        y="50"
        width="240"
        height="240"
        rx="48"
        fill="#fff"
        stroke="#c9d1d8"
        strokeWidth="2"
      />
      <rect x="88" y="58" width="224" height="224" rx="41" fill="#1a1a1e" />
    </svg>
    <div
      className={cn(
        'absolute inset-0 overflow-hidden rounded-[15%]',
        windowClassName,
      )}
      style={windowStyle}
    >
      {children}
    </div>
    <svg
      viewBox="0 0 400 360"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{
        width: '204.08%',
        height: '183.67%',
        left: '-52.04%',
        top: '-36.73%',
      }}
    >
      <defs>
        <linearGradient id="af-red" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f0343a" />
          <stop offset="1" stopColor="#c3161d" />
        </linearGradient>
        <linearGradient id="af-glove" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dfe6ec" />
        </linearGradient>
        <g id="af-card">
          <rect
            width="52"
            height="76"
            rx="8"
            fill="#fff"
            stroke="#222"
            strokeWidth="2.5"
          />
          <rect x="5" y="5" width="42" height="66" rx="5" fill="currentColor" />
          <ellipse
            cx="26"
            cy="38"
            rx="15"
            ry="24"
            fill="#fff"
            transform="rotate(30 26 38)"
          />
          <text
            x="26"
            y="38"
            transform="rotate(-22 26 38)"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="'Arial Black','Helvetica Neue',Arial,sans-serif"
            fontSize="13"
            fontWeight="900"
            fontStyle="italic"
            fill="currentColor"
            stroke="#222"
            strokeWidth="2"
            strokeLinejoin="round"
            paintOrder="stroke"
          >
            UNO
          </text>
        </g>
        <g id="af-glove">
          <circle
            cx="-17"
            cy="-16"
            r="8"
            fill="url(#af-glove)"
            stroke="#2b2b2b"
            strokeWidth="3"
          />
          <circle
            cx="-3"
            cy="-21"
            r="8.5"
            fill="url(#af-glove)"
            stroke="#2b2b2b"
            strokeWidth="3"
          />
          <circle
            cx="12"
            cy="-19"
            r="8"
            fill="url(#af-glove)"
            stroke="#2b2b2b"
            strokeWidth="3"
          />
          <ellipse
            cx="0"
            cy="0"
            rx="26"
            ry="21"
            fill="url(#af-glove)"
            stroke="#2b2b2b"
            strokeWidth="3"
          />
          <circle
            cx="-22"
            cy="4"
            r="9"
            fill="url(#af-glove)"
            stroke="#2b2b2b"
            strokeWidth="3"
          />
          <path
            d="M-14 20 Q0 28 14 20 L14 30 Q0 36 -14 30 Z"
            fill="#fff"
            stroke="#2b2b2b"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </g>
      </defs>

      <rect
        x="102"
        y="72"
        width="196"
        height="196"
        rx="30"
        fill="none"
        stroke="#000"
        strokeOpacity="0.35"
        strokeWidth="3"
      />

      {progress == null ? (
        <Fragment>
          <path
            d="M150 62 C78 112 92 232 188 268 C236 284 296 266 306 228"
            fill="none"
            stroke="#6e0d12"
            strokeWidth="30"
            strokeLinecap="round"
          />
          <path
            d="M150 62 C78 112 92 232 188 268 C236 284 296 266 306 228"
            fill="none"
            stroke="url(#af-red)"
            strokeWidth="22"
            strokeLinecap="round"
          />
          <path
            d="M146 70 C88 116 100 226 186 258"
            fill="none"
            stroke="#ff7c80"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.8"
          />
        </Fragment>
      ) : (
        progress > 0 &&
        (
          [
            ['#6e0d12', 26],
            ['url(#af-red)', 18],
            ['#ff7c80', 3],
          ] as const
        ).map(([stroke, width]) => (
          <path
            key={width}
            d={TIMER_PATH}
            fill="none"
            stroke={stroke}
            strokeWidth={width}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={width === 3 ? 0.8 : 1}
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - Math.min(1, progress)}
          />
        ))
      )}

      <g>
        <circle
          cx="162"
          cy="52"
          r="18"
          fill="#fff"
          stroke="#2a1a1a"
          strokeWidth="4"
        />
        <circle cx="165" cy="56" r="9" fill="#6b3a22" />
        <circle cx="166" cy="57" r="4.5" fill="#111" />
        <circle cx="162" cy="52" r="2.8" fill="#fff" />
        <path
          d="M144 48 Q162 30 180 48"
          fill="none"
          stroke="#2a1a1a"
          strokeWidth="5"
          strokeLinecap="round"
        />

        <circle
          cx="244"
          cy="52"
          r="18"
          fill="#fff"
          stroke="#2a1a1a"
          strokeWidth="4"
        />
        <circle cx="241" cy="56" r="9" fill="#6b3a22" />
        <circle cx="240" cy="57" r="4.5" fill="#111" />
        <circle cx="244" cy="52" r="2.8" fill="#fff" />
        <path
          d="M226 48 Q244 30 262 48"
          fill="none"
          stroke="#2a1a1a"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>

      <use
        href="#af-card"
        color="#d62828"
        transform="translate(88 200) rotate(-16)"
      />
      <use
        href="#af-card"
        color="#2a6fd6"
        transform="translate(122 214) rotate(18)"
      />
      <use href="#af-glove" transform="translate(120 268)" />

      <use
        href="#af-card"
        color="#2fa84f"
        transform="translate(262 206) rotate(8)"
      />
      <use href="#af-glove" transform="translate(284 266) scale(-1 1)" />
    </svg>
  </div>
);

export default AvatarFrame;
