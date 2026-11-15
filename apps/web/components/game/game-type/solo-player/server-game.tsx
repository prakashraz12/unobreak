'use client';

import { useEffect, useState } from 'react';
import useServerGame from '../../../../hooks/use-server-game';
import { useMatchInvite } from '../../../../providers/match-invite-provider';
import FullScreenLoader from '../../../full-screen-loader';
import GameScreen from '../../game-screen';

const ServerGameScreen = ({ sessionId }: { sessionId: number }) => {
  const [dealing, setDealing] = useState(true);
  const { clearJoinRequest } = useMatchInvite();
  const game = useServerGame(sessionId, dealing);

  // The invite that brought us here is consumed once the game mounts —
  // otherwise /menu would reopen the finished match's lobby afterwards.
  useEffect(() => clearJoinRequest(), [clearJoinRequest]);

  if (!game) return <FullScreenLoader />;
  return <GameScreen game={game} dealing={dealing} setDealing={setDealing} />;
};

export default ServerGameScreen;
