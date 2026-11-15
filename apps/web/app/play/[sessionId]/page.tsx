import ServerGameScreen from '../../../components/game/game-type/solo-player/server-game';

interface PlayPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function PlayPage({ params }: PlayPageProps) {
  const { sessionId } = await params;
  return <ServerGameScreen sessionId={Number(sessionId)} />;
}
