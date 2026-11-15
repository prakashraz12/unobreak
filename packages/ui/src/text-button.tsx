import type { ButtonHTMLAttributes } from 'react';

interface TextButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

const Spinner = () => (
  <svg
    viewBox="0 0 24 24"
    className="size-6 animate-spin"
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

const TextButton = ({
  className,
  children,
  type = 'button',
  loading = false,
  disabled,
  ...props
}: TextButtonProps) => (
  <button
    type={type}
    disabled={disabled || loading}
    aria-busy={loading}
    className={`relative isolate inline-flex h-14 min-w-40 shrink-0 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl border-4 border-[#6b2f00] bg-linear-to-b from-[#fff48a] via-[#ffd61f] to-[#f5a300] px-8 pb-1 font-display text-2xl font-black uppercase italic tracking-wide text-white shadow-[inset_0_-6px_0_#c46a00,inset_0_2px_0_#fff6b0,0_4px_0_#6b2f00,0_8px_10px_rgba(0,0,0,0.35)] outline-none transition-transform duration-150 [paint-order:stroke_fill] [text-shadow:0_3px_0_#6b2f00] [-webkit-text-stroke:6px_#6b2f00] before:absolute before:inset-x-5 before:top-1 before:-z-10 before:h-2/5 before:rounded-xl before:bg-linear-to-b before:from-white/85 before:to-white/0 hover:scale-105 focus-visible:ring-4 focus-visible:ring-white/70 active:translate-y-1 active:scale-95 active:shadow-[inset_0_-3px_0_#c46a00,inset_0_2px_0_#fff6b0,0_1px_0_#6b2f00,0_3px_6px_rgba(0,0,0,0.35)] disabled:cursor-not-allowed disabled:opacity-50 disabled:grayscale disabled:transform-none disabled:hover:scale-100 disabled:active:translate-y-0 disabled:active:scale-100 ${className ?? ''}`}
    {...props}
  >
    {loading ? <Spinner /> : children}
  </button>
);

export default TextButton;
