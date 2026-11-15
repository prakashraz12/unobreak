import { useId, type ReactNode } from 'react';
import type { ActionType, CardColor } from '../../constant';

export const CARD_COLORS: Record<CardColor, string> = {
  red: '#e3202b',
  yellow: '#f7d109',
  blue: '#0b5fc4',
  green: '#38a336',
};

const WILD_QUADRANTS: CardColor[] = ['red', 'blue', 'yellow', 'green'];
const OUTLINE = '#111';

export interface CardBaseProps {
  color: CardColor | null;
  value: number | ActionType;
  faceDown?: boolean;

  flat?: boolean;
  className?: string;
}

const Label = ({ text, size = 100 }: { text: string; size?: number }) => (
  <text
    x={0}
    y={0}
    textAnchor="middle"
    dominantBaseline="central"
    fontSize={size}
    fontWeight={900}
    fontStyle="italic"
    fontFamily="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
    fill="#fff"
    stroke={OUTLINE}
    strokeWidth={size * 0.09}
    strokeLinejoin="round"
    paintOrder="stroke"
  >
    {text}
  </text>
);

const WildOval = ({ clipId }: { clipId: string }) => (
  <g transform="rotate(30)">
    <clipPath id={clipId}>
      <ellipse rx={36} ry={60} />
    </clipPath>
    <g clipPath={`url(#${clipId})`}>
      <rect
        x={-40}
        y={-64}
        width={40}
        height={64}
        fill={CARD_COLORS[WILD_QUADRANTS[0]!]}
      />
      <rect
        x={0}
        y={-64}
        width={40}
        height={64}
        fill={CARD_COLORS[WILD_QUADRANTS[1]!]}
      />
      <rect
        x={0}
        y={0}
        width={40}
        height={64}
        fill={CARD_COLORS[WILD_QUADRANTS[2]!]}
      />
      <rect
        x={-40}
        y={0}
        width={40}
        height={64}
        fill={CARD_COLORS[WILD_QUADRANTS[3]!]}
      />
    </g>
    <ellipse rx={36} ry={60} fill="none" stroke="#fff" strokeWidth={5} />
  </g>
);

const MiniCard = ({
  x,
  y,
  fill,
  rotate = 0,
}: {
  x: number;
  y: number;
  fill: string;
  rotate?: number;
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
    <rect
      x={-15}
      y={-22}
      width={30}
      height={44}
      rx={5}
      fill={OUTLINE}
      transform="translate(2.5 2.5)"
      opacity={0.45}
    />
    <rect
      x={-15}
      y={-22}
      width={30}
      height={44}
      rx={5}
      fill={fill}
      stroke="#fff"
      strokeWidth={4}
    />
  </g>
);

const SkipIcon = () => (
  <g fill="none" strokeLinecap="round">
    {[
      { c: OUTLINE, w: 22 },
      { c: '#fff', w: 12 },
    ].map(({ c, w }) => (
      <g key={c} stroke={c} strokeWidth={w}>
        <circle r={30} />
        <line x1={-21} y1={21} x2={21} y2={-21} />
      </g>
    ))}
  </g>
);

const ARROW = 'M-30,-7 L4,-7 L4,-20 L30,0 L4,20 L4,7 L-30,7 Z';

const ReverseIcon = () => (
  <g
    fill="#fff"
    stroke={OUTLINE}
    strokeWidth={5}
    strokeLinejoin="round"
    paintOrder="stroke"
  >
    <path d={ARROW} transform="rotate(-45) translate(0 -14)" />
    <path d={ARROW} transform="rotate(135) translate(0 -14)" />
  </g>
);

const Glyph = ({
  value,
  fill,
  clipId,
  corner,
}: {
  value: number | ActionType;
  fill: string;
  clipId: string;
  corner: boolean;
}) => {
  if (typeof value === 'number') {
    return (
      <g>
        <Label text={String(value)} />
        {(value === 6 || value === 9) && (
          <rect
            x={-24}
            y={44}
            width={48}
            height={10}
            fill="#fff"
            stroke={OUTLINE}
            strokeWidth={6}
            paintOrder="stroke"
          />
        )}
      </g>
    );
  }
  switch (value) {
    case 'skip':
      return <SkipIcon />;
    case 'reverse':
      return <ReverseIcon />;
    case 'draw-two':
      return corner ? (
        <Label text="+2" size={80} />
      ) : (
        <g>
          <MiniCard x={-10} y={-12} fill={fill} />
          <MiniCard x={10} y={12} fill={fill} />
        </g>
      );
    case 'wild':
      return <WildOval clipId={clipId} />;
    case 'wild-draw-four':
      return corner ? (
        <Label text="+4" size={80} />
      ) : (
        <g>
          <MiniCard x={-24} y={10} fill={CARD_COLORS.blue} />
          <MiniCard x={-8} y={-10} fill={CARD_COLORS.green} />
          <MiniCard x={8} y={10} fill={CARD_COLORS.red} />
          <MiniCard x={24} y={-10} fill={CARD_COLORS.yellow} />
        </g>
      );
  }
};

const CardFrame = ({
  background,
  flat = false,
  className,
  children,
}: {
  background: string;
  flat?: boolean;
  className?: string;
  children: ReactNode;
}) => (
  <svg
    viewBox="0 0 120 180"
    xmlns="http://www.w3.org/2000/svg"
    className={`aspect-2/3 w-24 select-none ${flat ? '' : 'drop-shadow-[0_3px_4px_rgba(0,0,0,0.35)]'} ${className ?? ''}`}
  >
    <rect
      x={0.5}
      y={0.5}
      width={119}
      height={179}
      rx={11}
      fill="#fff"
      stroke="#cfcfcf"
    />
    <rect x={7} y={7} width={106} height={166} rx={7} fill={background} />
    {children}
  </svg>
);

const CardBase = ({
  color,
  value,
  faceDown = false,
  flat = false,
  className,
}: CardBaseProps) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  if (faceDown) {
    return (
      <CardFrame background={OUTLINE} flat={flat} className={className}>
        <g transform="translate(60 90) rotate(30)">
          <ellipse rx={40} ry={68} fill={CARD_COLORS.red} />
        </g>
        <g transform="translate(60 90) rotate(-22)">
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={40}
            fontWeight={900}
            fontStyle="italic"
            fontFamily="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
            fill={CARD_COLORS.yellow}
            stroke={OUTLINE}
            strokeWidth={5}
            strokeLinejoin="round"
            paintOrder="stroke"
          >
            UNO
          </text>
        </g>
      </CardFrame>
    );
  }

  const fill = color ? CARD_COLORS[color] : OUTLINE;
  const isWildFace = value === 'wild';

  return (
    <CardFrame background={fill} flat={flat} className={className}>
      {!isWildFace && (
        <ellipse
          cx={60}
          cy={90}
          rx={40}
          ry={68}
          fill="none"
          stroke="#fff"
          strokeWidth={4}
          transform="rotate(30 60 90)"
        />
      )}

      <filter id={`${uid}-s`} x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow
          dx={2.5}
          dy={2.5}
          stdDeviation={1.2}
          floodColor="#000"
          floodOpacity={0.45}
        />
      </filter>
      <g transform="translate(60 90) scale(0.7)" filter={`url(#${uid}-s)`}>
        <Glyph value={value} fill={fill} clipId={`${uid}-c`} corner={false} />
      </g>

      <g transform="translate(22 28) scale(0.24)">
        <Glyph value={value} fill={fill} clipId={`${uid}-tl`} corner />
      </g>
      <g transform="translate(98 152) rotate(180) scale(0.24)">
        <Glyph value={value} fill={fill} clipId={`${uid}-br`} corner />
      </g>
    </CardFrame>
  );
};

export default CardBase;
