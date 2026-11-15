'use client';

import { useState } from 'react';
import useServerGame from '../../../../hooks/use-server-game';
import FullScreenLoader from '../../../full-screen-loader';
import GameScreen from '../../game-screen';

const ServerGameScreen = ({ sessionId }: { sessionId: number }) => {
  const [dealing, setDealing] = useState(true);
  const game = useServerGame(sessionId, dealing);
  if (!game) return <FullScreenLoader />;
  return <GameScreen game={game} dealing={dealing} setDealing={setDealing} />;
};

export default ServerGameScreen;
