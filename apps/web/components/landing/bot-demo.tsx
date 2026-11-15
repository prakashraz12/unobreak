'use client';

import { useState } from 'react';
import Image from 'next/image';
import { LoggedInUserContext } from '../../providers/loggedin-user';
import useBotDemo from '../../hooks/use-bot-demo';
import GameScreen from '../game/game-screen';
import { AVATARS } from '../avatars/presets';
import type { User } from '../../services/types-schemas';
import playCover from '../../assets/landing/play.png';

const seatAvatar = AVATARS[0]!;

const demoUser = {
  id: -1,
  name: seatAvatar.name,
  avatarId: seatAvatar.id,
} as User;

const Inner = () => {
  const [dealing, setDealing] = useState(true);
  const game = useBotDemo(seatAvatar.id);
  return (
    <GameScreen
      game={game}
      dealing={dealing}
      setDealing={setDealing}
      defaultMuted
      hideGameOver
    />
  );
};

const BotDemo = () => {
  const [started, setStarted] = useState(false);
  return (
    <LoggedInUserContext.Provider value={{ user: demoUser }}>
      <div className="relative aspect-16/10 w-full overflow-hidden rounded-3xl border-[6px] border-[#2e7d1e] bg-[#57a81e] shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
        {started ? (
          <div className="pointer-events-none absolute inset-0">
            <Inner />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setStarted(true)}
            aria-label="Play the bot demo"
            className="absolute inset-0 cursor-pointer"
          >
            <Image
              src={playCover}
              alt="Play the bot demo"
              fill
              className="object-cover"
              placeholder="blur"
            />
          </button>
        )}
      </div>
    </LoggedInUserContext.Provider>
  );
};

export default BotDemo;
