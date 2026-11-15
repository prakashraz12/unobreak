'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AVATARS } from '../components/avatars/presets';
import { classicRules, type UnoRules } from '../rules';

export interface GamePlayer {
  id: string;
  name: string;
  avatarId: number;
}

export interface StartGameInput {
  playerName: string;
  avatarId: number;
}

export interface GameState {
  status: 'onboarding' | 'lobby';
  player: GamePlayer | null;
  rules: UnoRules;
}

interface GameContextValue extends GameState {
  startGame: (input: StartGameInput) => GamePlayer;
  resetGame: () => void;

  inGame: boolean;
  setInGame: (inGame: boolean) => void;
}

const GameContext = createContext<GameContextValue | null>(null);
const initialState = (): GameState => ({
  status: 'onboarding',
  player: null,
  rules: { ...classicRules },
});

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<GameState>(initialState);

  const startGame = useCallback(({ playerName, avatarId }: StartGameInput) => {
    const name = playerName.trim();
    if (!name) throw new Error('Please enter your nickname.');
    if (name.length > 16)
      throw new Error('Nickname must be 16 characters or fewer.');
    if (!AVATARS.some((avatar) => avatar.id === avatarId))
      throw new Error('Please select an avatar.');

    const player: GamePlayer = { id: crypto.randomUUID(), name, avatarId };
    setState({ status: 'lobby', player, rules: { ...classicRules } });
    return player;
  }, []);

  const resetGame = useCallback(() => setState(initialState()), []);
  const [inGame, setInGame] = useState(false);
  const value = useMemo(
    () => ({ ...state, startGame, resetGame, inGame, setInGame }),
    [state, startGame, resetGame, inGame],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
};

export default GameProvider;
