'use client';

import useStorage from '../../hooks/use-storage';
import { ACCESS_TOKEN } from '../../keys';
import { cn } from '../../lib/utils';
import { useAppSettings } from '../../providers/app-provider';
import TextButton from '@repo/ui/text-button';
import {
  SheetBody,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/sheet';

const ROW_LABEL =
  'font-display text-sm font-black uppercase italic tracking-wide text-white [text-shadow:0_2px_0_rgba(0,0,0,0.4)]';

const ToggleRow = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) => (
  <div className="flex items-center justify-between rounded-xl border-2 border-[#6b2f00] bg-black/25 px-4 py-3 shadow-[inset_0_2px_0_rgba(255,255,255,0.08)]">
    <span className={ROW_LABEL}>{label}</span>
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={() => onChange(!value)}
      className="group relative h-9 w-20 shrink-0 cursor-pointer rounded-xl outline-none transition-transform duration-150 hover:scale-105 focus-visible:ring-4 focus-visible:ring-white/70 active:translate-y-0.5"
    >
      <span className="absolute inset-0 rounded-xl border-[3px] border-[#6b2f00] bg-linear-to-b from-[#f0a000] to-[#c46a00] p-0.75 shadow-[0_3px_0_#6b2f00]">
        <span
          className={cn(
            'relative block size-full overflow-hidden rounded-[7px] transition-all duration-200',
            value
              ? 'bg-[radial-gradient(80%_80%_at_50%_30%,#a5f27a_0%,#59c93e_55%,#2fa52a_100%)]'
              : 'bg-[radial-gradient(80%_80%_at_50%_30%,#cfcfcf_0%,#9a9a9a_55%,#6e6e6e_100%)]',
          )}
        >
          <span
            className="pointer-events-none absolute inset-x-1 top-0 h-1/3 rounded-t-md bg-linear-to-b from-white/70 to-transparent"
            aria-hidden="true"
          />
        </span>
      </span>

      <span
        className={cn(
          'absolute top-1/2 size-11 -translate-y-1/2 rounded-full border-[3px] border-[#6b2f00] bg-[radial-gradient(70%_70%_at_40%_30%,#ffffff_0%,#f0f0f0_55%,#cfcfcf_100%)] shadow-[0_3px_0_#6b2f00,0_4px_6px_rgba(0,0,0,0.4)] transition-all duration-200',
          value ? 'left-[calc(100%-2.5rem)]' : '-left-1',
        )}
      >
        <span
          className="pointer-events-none absolute inset-x-1.5 top-1 h-1/3 rounded-t-full bg-linear-to-b from-white/90 to-transparent"
          aria-hidden="true"
        />
      </span>
    </button>
  </div>
);

const SettingsSheet = () => {
  const { settings, updateSettings } = useAppSettings();
  const [, , removeAccessToken] = useStorage<string | null>(ACCESS_TOKEN, null);

  const signOut = () => {
    removeAccessToken();
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>Settings</SheetTitle>
        <SheetDescription>Sound, music and session.</SheetDescription>
      </SheetHeader>

      <SheetBody className="flex flex-col gap-4">
        <ToggleRow
          label="Sound FX"
          value={settings.sound}
          onChange={(sound) => updateSettings({ sound })}
        />
        <ToggleRow
          label="Music"
          value={settings.music}
          onChange={(music) => updateSettings({ music })}
        />

        <div className="flex flex-col gap-2 rounded-xl border-2 border-[#6b2f00] bg-black/25 px-4 py-3 shadow-[inset_0_2px_0_rgba(255,255,255,0.08)]">
          <span className={ROW_LABEL}>
            Volume — {Math.round(settings.volume * 100)}%
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(settings.volume * 100)}
            onChange={(e) =>
              updateSettings({ volume: Number(e.target.value) / 100 })
            }
            aria-label="Volume"
            className="h-3 w-full cursor-pointer appearance-none rounded-xl border-2 border-[#6b2f00] bg-[#3a3a3a] accent-[#ffd61f]"
          />
        </div>
      </SheetBody>

      <SheetFooter>
        <TextButton onClick={signOut} className="w-full text-lg">
          Sign Out
        </TextButton>
      </SheetFooter>
    </>
  );
};

export default SettingsSheet;
