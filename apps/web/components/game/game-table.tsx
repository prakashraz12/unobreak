'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SettingsButton from '@repo/ui/settings-button';
import UserAvatar from '../avatars/user-avatar';
import { AVATARS } from '../avatars/presets';
import ModeSelect from './mode-select';
import Logo from '../logo';
import { useLoggedInUser } from '../../providers/loggedin-user';
import { useSheet } from '../../providers/sheet-provider';
import WorldFloor from '../floors/world-floor';
import SoloMatchmaking from './game-type/solo-player/solo-matchmaking';
import Team2v2Matchmaking from './game-type/team-2v2/team-2v2-matchmaking';
import CustomMatch from './game-type/custom-match/custom-match';
import LandscapeGuard from './landscape-guard';
import { useMatchInvite } from '../../providers/match-invite-provider';
import { useAppSettings } from '../../providers/app-provider';
import { SOUNDS } from '../../assets/export';

const GameTableContent = () => {
  const router = useRouter();
  const { user } = useLoggedInUser();
  const avatar = AVATARS.find((a) => a.id === user.avatarId);
  const { openSheet } = useSheet();

  const [solo, setSolo] = useState(false);
  const [team, setTeam] = useState(false);
  const [custom, setCustom] = useState(false);
  const [duel, setDuel] = useState(false);

  const { joinRequest, clearJoinRequest } = useMatchInvite();
  const invitedMatchId = joinRequest?.matchId ?? null;
  const invitedType = joinRequest?.type ?? null;
  const [copied, setCopied] = useState(false);

  const { settings } = useAppSettings();
  const inLobby = !solo && !team && !custom && !duel && invitedMatchId === null;
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const volumeRef = useRef(settings.volume);
  volumeRef.current = settings.volume;

  useEffect(() => {
    if (!inLobby || !settings.music) return;
    musicRef.current ??= Object.assign(new Audio(SOUNDS.bgMusic), {
      loop: true,
    });
    const audio = musicRef.current;
    audio.volume = volumeRef.current;
    const play = () => void audio.play().catch(() => {});
    play();
    window.addEventListener('pointerdown', play);
    window.addEventListener('keydown', play);
    return () => {
      window.removeEventListener('pointerdown', play);
      window.removeEventListener('keydown', play);
      audio.pause();
    };
  }, [inLobby, settings.music]);

  useEffect(() => {
    if (musicRef.current) musicRef.current.volume = settings.volume;
  }, [settings.volume]);

  const copyUserId = () => {
    void navigator.clipboard.writeText(String(user.userId)).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleStartWithComputer = () => {
    router.push('/vs-computer');
  };

  if (team || (invitedMatchId !== null && invitedType === 'TEAM_2V2')) {
    return (
      <Team2v2Matchmaking
        you={avatar ?? AVATARS[0]!}
        joinMatchId={invitedMatchId ?? undefined}
        onBack={() => {
          setTeam(false);
          clearJoinRequest();
        }}
      />
    );
  }

  if (
    custom ||
    duel ||
    (invitedMatchId !== null && invitedType === 'PRIVATE_ROOM')
  ) {
    return (
      <CustomMatch
        you={avatar ?? AVATARS[0]!}
        joinMatchId={invitedMatchId ?? undefined}
        duel={duel}
        onBack={() => {
          setCustom(false);
          setDuel(false);
          clearJoinRequest();
        }}
      />
    );
  }

  if (solo) {
    return (
      <SoloMatchmaking
        you={avatar ?? AVATARS[0]!}
        onBack={() => setSolo(false)}
      />
    );
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <WorldFloor />
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-center justify-between p-4">
          <Logo className="h-auto w-32 drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)]" />
          <div className="flex items-center gap-3">
            <div className="flex h-14 items-center gap-2 rounded-xl border-2 border-[#6b2f00] bg-linear-to-b from-[#ffd61f] to-[#f5a300] pl-1.5 pr-2 shadow-[0_3px_0_#6b2f00] transition-transform hover:scale-[1.03]">
              <button
                type="button"
                aria-label="Players"
                onClick={() => openSheet('users')}
                className="flex cursor-pointer items-center gap-2 outline-none active:translate-y-0.5"
              >
                <UserAvatar
                  avatarId={user.avatarId}
                  image={user.customProfileImage}
                  className="size-10 shrink-0"
                />
                <span className="flex flex-col items-start leading-none">
                  <span className="font-display text-sm font-black uppercase italic tracking-wide text-white [-webkit-text-stroke:3px_#6b2f00] [paint-order:stroke_fill] [text-shadow:0_2px_0_rgba(0,0,0,0.4)]">
                    {user.name}
                  </span>
                  <span className="mt-1 text-[10px] font-black tracking-wide text-[#6b2f00]/80">
                    {user.userId}
                  </span>
                </span>
              </button>
              <button
                type="button"
                aria-label="Copy user ID"
                title="Copy user ID"
                onClick={copyUserId}
                className="relative flex size-8 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-[#6b2f00] bg-linear-to-b from-[#7be05a] to-[#2fa52a] text-white shadow-[0_2px_0_#6b2f00] outline-none transition-[filter] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/70 active:translate-y-0.5"
              >
                <span
                  className="pointer-events-none absolute inset-x-1 top-0.5 h-2/5 rounded-t-md bg-linear-to-b from-white/85 to-transparent"
                  aria-hidden="true"
                />
                {copied ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="relative size-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    className="relative size-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x={9} y={9} width={12} height={12} rx={2.5} />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </div>
            <SettingsButton onClick={() => openSheet('settings')} />
          </div>
        </div>
        <ModeSelect
          onVsComputer={handleStartWithComputer}
          onSolo={() => setSolo(true)}
          onFriends={() => setTeam(true)}
          onCustom={() => setCustom(true)}
          onDuel={() => setDuel(true)}
          soloLoading={false}
        />
      </div>
    </div>
  );
};

const GameTable = () => (
  <LandscapeGuard>
    <GameTableContent />
  </LandscapeGuard>
);

export default GameTable;
