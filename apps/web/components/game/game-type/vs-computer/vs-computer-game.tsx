'use client';

import { useState } from 'react';
import { AVATARS } from '../../../avatars/presets';
import { useLoggedInUser } from '../../../../providers/loggedin-user';
import useLocalGame from '../../../../hooks/use-local-game';
import GameScreen from '../../game-screen';
import LobbyScreen from '../../lobby-screen';
import MatchmakingScreen from '../../game-ui/matchmaking-screen';
import VersusScreen from '../../versus-screen';

const LocalGame = () => {
  const { user } = useLoggedInUser();
  const [dealing, setDealing] = useState(true);
  const game = useLocalGame(String(user.id), user.avatarId, dealing);
  return <GameScreen game={game} dealing={dealing} setDealing={setDealing} />;
};

const VsComputerScreen = () => {
  const [phase, setPhase] = useState<
    'lobby' | 'searching' | 'versus' | 'playing'
  >('lobby');
  const { user } = useLoggedInUser();
  const you = AVATARS.find((a) => a.id === user.avatarId) ?? AVATARS[0]!;
  const bots = AVATARS.filter((a) => a.id !== user.avatarId).slice(0, 3);

  if (phase === 'playing') return <LocalGame />;
  if (phase === 'versus')
    return (
      <VersusScreen you={you} bots={bots} onDone={() => setPhase('playing')} />
    );
  if (phase === 'searching')
    return (
      <MatchmakingScreen
        title="VS Computer"
        you={you}
        bots={bots}
        onDone={() => setPhase('versus')}
        onBack={() => setPhase('lobby')}
      />
    );
  return (
    <LobbyScreen title="VS Computer" onStart={() => setPhase('searching')} />
  );
};

export default VsComputerScreen;
