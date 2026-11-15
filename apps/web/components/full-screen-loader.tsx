import RedFloor from './floors/red-floor';

const DOTS = 12;

const FullScreenLoader = () => {
  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <RedFloor />
      <div className="relative z-10 flex h-full items-center justify-center">
        <svg className="h-12 w-12 animate-spin" viewBox="0 0 50 50" fill="none">
          {Array.from({ length: DOTS }, (_, i) => {
            const angle = (i / DOTS) * Math.PI * 2;
            const cx = (25 + Math.cos(angle) * 20).toFixed(4);
            const cy = (25 + Math.sin(angle) * 20).toFixed(4);
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r="2.5"
                fill="white"
                opacity={(i + 1) / DOTS}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default FullScreenLoader;
