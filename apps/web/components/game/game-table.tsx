'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSocketEvent } from '@repo/socket';
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

const GameTableContent = () => {
  const router = useRouter();
  const { user } = useLoggedInUser();
  const avatar = AVATARS.find((a) => a.id === user.avatarId);
  const { openSheet } = useSheet();

  const [solo, setSolo] = useState(false);
  const [team, setTeam] = useState(false);
  const [custom, setCustom] = useState(false);
  const [duel, setDuel] = useState(false);

  const [invitedMatchId, setInvitedMatchId] = useState<number | null>(null);

  const [invitedType, setInvitedType] = useState<
    'TEAM_2V2' | 'PRIVATE_ROOM' | null
  >(null);

  const [invite, setInvite] = useState<{
    matchId: number;
    type: 'TEAM_2V2' | 'PRIVATE_ROOM';
    from: { userId: number; name: string; avatarId: number };
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useSocketEvent(
    'match:invite',
    (payload: {
      matchId: number;
      type: 'TEAM_2V2' | 'PRIVATE_ROOM';
      from: { userId: number; name: string; avatarId: number };
    }) => {
      if (payload.type === 'TEAM_2V2' || payload.type === 'PRIVATE_ROOM') {
        setInvite(payload);
      }
    },
  );

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
          setInvitedMatchId(null);
          setInvitedType(null);
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
          setInvitedMatchId(null);
          setInvitedType(null);
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

      {invite && (
        <div className="absolute inset-x-0 bottom-8 z-20 flex justify-center">
          <div className="flex items-center gap-4 rounded-2xl border-2 border-[#6b2f00] bg-white/95 px-5 py-3 shadow-lg">
            <span className="font-display text-base font-black uppercase italic text-[#6b2f00]">
              {invite.from.name} invites you to a{' '}
              {invite.type === 'TEAM_2V2' ? '2v2 match' : 'custom match'}
            </span>
            <button
              type="button"
              onClick={() => {
                setInvitedMatchId(invite.matchId);
                setInvitedType(invite.type);
                setInvite(null);
              }}
              className="cursor-pointer rounded-xl border-2 border-[#6b2f00] bg-linear-to-b from-[#7be05a] to-[#2fa52a] px-4 py-1.5 font-display text-sm font-black uppercase italic text-white shadow-[0_2px_0_#6b2f00] transition-transform hover:scale-105"
            >
              Join
            </button>
            <button
              type="button"
              onClick={() => setInvite(null)}
              className="cursor-pointer rounded-xl border-2 border-[#6b2f00] bg-linear-to-b from-[#ff9b8a] to-[#e8590c] px-4 py-1.5 font-display text-sm font-black uppercase italic text-white shadow-[0_2px_0_#6b2f00] transition-transform hover:scale-105"
            >
              Decline
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const GameTable = () => (
  <LandscapeGuard>
    <GameTableContent />
  </LandscapeGuard>
);

export default GameTable;
