import { useId, type ButtonHTMLAttributes, type ReactNode } from 'react';

export const BUTTON_OUTLINE = '#6b2f00';

export interface ButtonBaseProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  label: string;
}

const ButtonBase = ({
  label,
  className,
  icon,
  type = 'button',
  ...props
}: ButtonBaseProps & { icon: ReactNode }) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const id = (name: string) => `${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;

  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`group size-14 shrink-0 cursor-pointer rounded-xl outline-none transition-transform duration-150 hover:scale-105 focus-visible:ring-4 focus-visible:ring-white/70 active:translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:grayscale ${className ?? ''}`}
      {...props}
    >
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="block size-full select-none drop-shadow-[0_3px_3px_rgba(0,0,0,0.4)]"
      >
        <defs>
          <radialGradient id={id('face')} cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fff48a" />
            <stop offset="45%" stopColor="#ffd61f" />
            <stop offset="100%" stopColor="#f5a300" />
          </radialGradient>
          <linearGradient id={id('rim')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0a000" />
            <stop offset="100%" stopColor="#c46a00" />
          </linearGradient>
          <linearGradient id={id('gloss')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity={0.85} />
            <stop offset="100%" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <filter id={id('icon')} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow
              dx={0}
              dy={2.5}
              stdDeviation={0}
              floodColor={BUTTON_OUTLINE}
              floodOpacity={0.9}
            />
          </filter>
        </defs>

        <rect
          x={2}
          y={2}
          width={96}
          height={96}
          rx={22}
          fill={BUTTON_OUTLINE}
        />
        <rect x={7} y={10} width={86} height={86} rx={19} fill={url('rim')} />
        <rect x={9} y={7} width={82} height={82} rx={17} fill={url('face')} />
        <rect
          x={21}
          y={11}
          width={58}
          height={22}
          rx={11}
          fill={url('gloss')}
        />
        <rect
          x={9}
          y={7}
          width={82}
          height={82}
          rx={17}
          fill="none"
          stroke="#fff6b0"
          strokeOpacity={0.6}
          strokeWidth={1.5}
        />

        <g transform="translate(50 50)" filter={url('icon')}>
          <g
            fill="#fff"
            stroke={BUTTON_OUTLINE}
            strokeWidth={5}
            strokeLinejoin="round"
            strokeLinecap="round"
            paintOrder="stroke"
          >
            {icon}
          </g>
        </g>
      </svg>
    </button>
  );
};

export default ButtonBase;
