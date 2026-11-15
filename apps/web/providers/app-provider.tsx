'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import useStorage from '../hooks/use-storage';
import { APP_SETTINGS } from '../keys';

export interface AppSettings {
  sound: boolean;
  music: boolean;
  volume: number;
}

const defaultSettings: AppSettings = {
  sound: true,
  music: true,
  volume: 1,
};

interface AppSettingsContextValue {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
}

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export default function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useStorage<AppSettings>(
    APP_SETTINGS,
    defaultSettings,
  );

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      setSettings((prev) => ({ ...prev, ...patch }));
    },
    [setSettings],
  );

  const value = useMemo(
    () => ({ settings, updateSettings }),
    [settings, updateSettings],
  );

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within AppProvider');
  }
  return context;
};
