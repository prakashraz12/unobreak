'use client';

const UsersSheetTrigger = ({
  onClick,
  count = 0,
}: {
  onClick: () => void;

  count?: number;
}) => (
  <button
    type="button"
    aria-label="Players"
    title="Players"
    onClick={onClick}
    className="fixed left-0 top-1/2 z-40 h-20 w-12 -translate-x-2 -translate-y-1/2 cursor-pointer rounded-r-xl border-[3px] border-l-0 border-[#6b2f00] bg-linear-to-b from-[#f0a000] to-[#c46a00] p-0.75 shadow-[0_4px_10px_rgba(0,0,0,0.4)] outline-none transition-all duration-200 hover:w-14 hover:translate-x-0 focus-visible:translate-x-0 focus-visible:ring-4 focus-visible:ring-white/70 active:scale-95"
  >
    <span className="relative flex size-full items-center justify-center overflow-hidden rounded-r-lg bg-[radial-gradient(65%_65%_at_50%_35%,#fff48a_0%,#ffd61f_45%,#f5a300_100%)]">
      <span
        className="pointer-events-none absolute inset-x-1.5 top-0.5 h-2/5 rounded-t-lg bg-linear-to-b from-white/85 to-transparent"
        aria-hidden="true"
      />
      <svg
        viewBox="0 0 40 24"
        className="relative w-7 drop-shadow-[0_2px_0_#6b2f00]"
        aria-hidden="true"
      >
        <circle
          cx={13}
          cy={8}
          r={5}
          fill="#fff"
          stroke="#6b2f00"
          strokeWidth={2.5}
        />
        <path
          d="M3,22 Q3,14 13,14 Q23,14 23,22 Z"
          fill="#fff"
          stroke="#6b2f00"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        <circle
          cx={30}
          cy={10}
          r={4}
          fill="#fff"
          stroke="#6b2f00"
          strokeWidth={2.5}
        />
        <path
          d="M23,22 Q23,16 30,16 Q37,16 37,22 Z"
          fill="#fff"
          stroke="#6b2f00"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full border-2 border-white bg-[#e3202b] text-xs font-black text-white shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </span>
  </button>
);

export default UsersSheetTrigger;
