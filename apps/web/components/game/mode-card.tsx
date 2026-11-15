'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ModeCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: ReactNode;

  badge?: string;
  loading?: boolean;

  bare?: boolean;
}

const Spinner = () => (
  <svg
    viewBox="0 0 24 24"
    className="size-8 animate-spin"
    aria-hidden="true"
    fill="none"
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeWidth="4"
      opacity={0.25}
    />
    <path
      d="M21 12a9 9 0 0 0-9-9"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
    />
  </svg>
);

const ModeCard = ({
  label,
  badge,
  loading = false,
  bare = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ModeCardProps) => (
  <button
    type={type}
    disabled={disabled || loading}
    aria-busy={loading}
    className={`group relative aspect-2/3 shrink-0 cursor-pointer select-none rounded-[18px] p-0 outline-none transition-all duration-200 hover:-translate-y-3 hover:-rotate-2 focus-visible:ring-4 focus-visible:ring-white/70 active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:grayscale disabled:transform-none ${bare ? 'w-[clamp(180px,22vw,270px)]' : 'w-[clamp(140px,17vw,210px)] border-[6px] border-white bg-white shadow-[0_14px_28px_rgba(0,0,0,0.4)] hover:shadow-[0_24px_40px_rgba(0,0,0,0.45)] disabled:hover:shadow-[0_14px_28px_rgba(0,0,0,0.4)]'} ${className ?? ''}`}
    {...props}
  >
    <div className="absolute inset-0 overflow-hidden rounded-[12px]">
      {children}
    </div>

    <span className="pointer-events-none absolute inset-x-1 bottom-[8%] z-10 text-center font-display text-[clamp(14px,1.7vw,22px)] font-black uppercase italic leading-[0.95] text-white [paint-order:stroke_fill] [text-shadow:0_3px_0_rgba(0,0,0,0.5)] [-webkit-text-stroke:4px_#2b2b2b]">
      {label}
    </span>

    {badge && (
      <span className="absolute -right-3 -top-3 z-20 rotate-6 rounded-md border-2 border-white bg-[#ff2d55] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white shadow-[0_3px_6px_rgba(0,0,0,0.35)]">
        {badge}
      </span>
    )}

    {loading && (
      <span className="absolute inset-0 z-20 flex items-center justify-center rounded-[12px] bg-black/45 text-white">
        <Spinner />
      </span>
    )}
  </button>
);

export default ModeCard;
