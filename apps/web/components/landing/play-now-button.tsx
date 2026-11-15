import Link from 'next/link';

interface Props {
  size?: 'sm' | 'lg';
  className?: string;
}

export default function PlayNowButton({ size = 'sm', className = '' }: Props) {
  const sizing =
    size === 'lg'
      ? 'h-16 px-12 pb-1 text-3xl shadow-[inset_0_-6px_0_#c46a00,inset_0_2px_0_#fff6b0,0_5px_0_#6b2f00,0_10px_14px_rgba(0,0,0,0.4)] [-webkit-text-stroke:6px_#6b2f00] before:inset-x-6'
      : 'h-12 px-6 pb-0.5 text-lg shadow-[inset_0_-5px_0_#c46a00,inset_0_2px_0_#fff6b0,0_4px_0_#6b2f00,0_8px_10px_rgba(0,0,0,0.35)] [-webkit-text-stroke:5px_#6b2f00] before:inset-x-4 sm:h-14 sm:px-8 sm:text-2xl';
  return (
    <Link
      href="/menu"
      className={`relative isolate inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border-4 border-[#6b2f00] bg-linear-to-b from-[#fff48a] via-[#ffd61f] to-[#f5a300] font-display font-black uppercase italic tracking-wide text-white outline-none transition-transform duration-150 [paint-order:stroke_fill] [text-shadow:0_3px_0_#6b2f00] before:absolute before:top-1 before:-z-10 before:h-2/5 before:rounded-xl before:bg-linear-to-b before:from-white/85 before:to-white/0 hover:scale-105 focus-visible:ring-4 focus-visible:ring-white/70 active:translate-y-1 active:scale-95 ${sizing} ${className}`}
    >
      Play Now
    </Link>
  );
}
