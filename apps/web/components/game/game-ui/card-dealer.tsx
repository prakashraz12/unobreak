'use client';

const CardDealer = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 220 185"
    className={className}
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="dlr-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3d3d3d" />
        <stop offset="55%" stopColor="#262626" />
        <stop offset="100%" stopColor="#141414" />
      </linearGradient>
      <linearGradient id="dlr-top" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#565656" />
        <stop offset="100%" stopColor="#303030" />
      </linearGradient>
      <linearGradient id="dlr-btn" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8a8a8a" />
        <stop offset="100%" stopColor="#4a4a4a" />
      </linearGradient>
      <linearGradient id="dlr-red" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ff5a4d" />
        <stop offset="100%" stopColor="#c01f14" />
      </linearGradient>
    </defs>

    <ellipse cx={110} cy={164} rx={86} ry={12} fill="#000" opacity={0.28} />

    <g transform="rotate(-7 110 34)">
      <rect
        x={82}
        y={10}
        width={56}
        height={40}
        rx={5}
        fill="#151515"
        stroke="#3a3a3a"
        strokeWidth={2}
      />
      <ellipse
        cx={110}
        cy={30}
        rx={18}
        ry={11}
        fill="#d42c22"
        transform="rotate(-20 110 30)"
      />
      <text
        x={110}
        y={34}
        textAnchor="middle"
        fontFamily="'Arial Black',Arial,sans-serif"
        fontSize={11}
        fontStyle="italic"
        fill="#ffd61f"
        transform="rotate(-20 110 30)"
      >
        UNO
      </text>
    </g>
    <rect x={68} y={38} width={84} height={16} rx={5} fill="#0d0d0d" />

    <path d="M38,52 L182,52 L170,30 L50,30 Z" fill="url(#dlr-top)" />
    <rect
      x={28}
      y={50}
      width={164}
      height={104}
      rx={16}
      fill="url(#dlr-body)"
      stroke="#000"
      strokeWidth={2}
    />
    <rect
      x={34}
      y={56}
      width={152}
      height={10}
      rx={5}
      fill="#fff"
      opacity={0.07}
    />

    <g transform="rotate(4 110 158)">
      <rect
        x={88}
        y={142}
        width={44}
        height={34}
        rx={4}
        fill="#181818"
        stroke="#3d3d3d"
        strokeWidth={2}
      />
      <ellipse
        cx={110}
        cy={160}
        rx={13}
        ry={8}
        fill="#d42c22"
        transform="rotate(-18 110 160)"
      />
    </g>
    <rect x={52} y={132} width={116} height={12} rx={5} fill="#050505" />
    <rect x={56} y={134} width={108} height={3} rx={1.5} fill="#2e2e2e" />

    <rect
      x={36}
      y={62}
      width={86}
      height={58}
      rx={9}
      fill="#1c1c1c"
      stroke="#0a0a0a"
    />

    <rect x={44} y={68} width={70} height={24} rx={4} fill="#0b120b" />
    <text
      x={79}
      y={85}
      textAnchor="middle"
      fontFamily="monospace"
      fontSize={13}
      letterSpacing={2}
      fill="#8ef58a"
    >
      7 7 7 7
    </text>
    <text
      x={79}
      y={101}
      textAnchor="middle"
      fontFamily="Arial,sans-serif"
      fontSize={7}
      letterSpacing={1.5}
      fill="#8d8d8d"
    >
      PLAYERS·CARDS
    </text>

    <circle cx={52} cy={110} r={7} fill="url(#dlr-btn)" stroke="#0a0a0a" />
    <path
      d="M49,110 L55,110 M52,107 L55,110 L52,113"
      stroke="#e8e8e8"
      strokeWidth={1.6}
      fill="none"
    />
    <circle cx={70} cy={110} r={7} fill="url(#dlr-btn)" stroke="#0a0a0a" />
    <path
      d="M67,110 L73,110 M70,107 L67,110 L70,113"
      stroke="#e8e8e8"
      strokeWidth={1.6}
      fill="none"
    />

    <circle cx={140} cy={72} r={6} fill="url(#dlr-btn)" stroke="#0a0a0a" />
    <circle cx={156} cy={72} r={6} fill="url(#dlr-btn)" stroke="#0a0a0a" />
    <circle
      cx={160}
      cy={100}
      r={12}
      fill="url(#dlr-red)"
      stroke="#7a0f08"
      strokeWidth={2}
    />
    <path d="M157,94 L157,106 L167,100 Z" fill="#fff" />
    <circle cx={138} cy={104} r={5} fill="url(#dlr-btn)" stroke="#0a0a0a" />
    <circle cx={138} cy={116} r={5} fill="url(#dlr-btn)" stroke="#0a0a0a" />
  </svg>
);

export default CardDealer;
