'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSocketEvent } from '@repo/socket';
import { useLoggedInUser } from '../../../../providers/loggedin-user';
import type { AvatarConfig } from '../../../avatars/avatar';
import { AVATARS } from '../../../avatars/presets';
import type { Match } from '../../../../services/types-schemas';

import useSoloMatch from './use-solo-match';
import MatchmakingScreen from '../../game-ui/matchmaking-screen';

const WAIT_FOR_PLAYERS_MS = 120_000;

const SoloMatchmaking = ({
  you,
  onBack,
  type = 'SOLO',
  title = 'Solo',
}: {
  you: AvatarConfig;
  onBack: () => void;
  type?: Match['type'];
  title?: string;
}) => {
  const router = useRouter();
  const { user } = useLoggedInUser();
  const { match, opponents, start, leave } = useSoloMatch(type);

  const deadlineAt =
    match?.expiresAt != null ? Date.parse(match.expiresAt) : undefined;

  const go = async () => {
    const sessionId = await start();
    if (sessionId !== null) router.push(`/play/${sessionId}`);
  };

  useEffect(() => {
    if (opponents.length >= 3) void go();
  }, [opponents.length]);

  useSocketEvent('game:started', ({ sessionId }: { sessionId: number }) => {
    router.push(`/play/${sessionId}`);
  });

  return (
    <MatchmakingScreen
      title={title}
      you={{ ...you, name: user.name, image: user.customProfileImage }}
      bots={AVATARS.filter((a) => a.id !== user.avatarId).slice(0, 3)}
      players={opponents}
      waitMs={WAIT_FOR_PLAYERS_MS}
      deadlineAt={deadlineAt}
      onDone={go}
      onBack={() => {
        leave();
        onBack();
      }}
    />
  );
};

export default SoloMatchmaking;
