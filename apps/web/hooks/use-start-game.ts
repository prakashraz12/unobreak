'use client';

import { useCallback } from 'react';
import {
  useGame,
  type GamePlayer,
  type StartGameInput,
} from '../context/game-context';
import { usePopUpToaster } from '../components/pop-up-toaster';

const useStartGame = ({ playerName, avatarId }: StartGameInput) => {
  const { startGame: createGame, status } = useGame();
  const { triggerToast } = usePopUpToaster();

  const startGame = useCallback((): GamePlayer | null => {
    if (status !== 'onboarding') return null;
    try {
      const player = createGame({ playerName, avatarId });
      triggerToast(`Welcome, ${player.name}!`, { type: 'success' });
      return player;
    } catch (error) {
      triggerToast(
        error instanceof Error
          ? error.message
          : 'Could not start the game. Please try again.',
        { type: 'error' },
      );
      return null;
    }
  }, [createGame, playerName, avatarId, status, triggerToast]);

  return { startGame, isStarted: status !== 'onboarding' };
};

export default useStartGame;
