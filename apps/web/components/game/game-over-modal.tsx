'use client';

import TextButton from '@repo/ui/text-button';

interface GameOverModalProps {
  winnerName: string;
  onRestart: () => void;
  onHome: () => void;
}

const GameOverModal = ({
  winnerName,
  onRestart,
  onHome,
}: GameOverModalProps) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    role="dialog"
    aria-label="Game over"
  >
    <div className="flex flex-col items-center gap-6 rounded-3xl border-4 border-[#6b2f00] bg-[#fff48a] p-8 shadow-[0_8px_0_#6b2f00,0_16px_30px_rgba(0,0,0,0.4)]">
      <p className="font-display text-3xl font-black uppercase italic text-[#6b2f00]">
        {winnerName === 'You' ? 'You win!' : `${winnerName} wins!`}
      </p>
      <div className="flex flex-col items-center gap-3">
        <TextButton onClick={onRestart}>Play again</TextButton>
        <TextButton onClick={onHome}>Home</TextButton>
      </div>
    </div>
  </div>
);

export default GameOverModal;
