'use client';

import {
  useCallback,
  useMemo,
  useSyncExternalStore,
  type SetStateAction,
} from 'react';
import storage, {
  type CookieOptions,
  type StorageType,
} from '../storage/storage';

export interface UseStorageOptions extends CookieOptions {
  type?: StorageType;
}

const serverSnapshot = () => null;

export const useStorage = <T>(
  key: string,
  initialValue: T,
  options: UseStorageOptions = {},
) => {
  const {
    type = 'local',
    path,
    domain,
    maxAge,
    expires,
    sameSite,
    secure,
  } = options;
  const getSnapshot = useCallback(() => storage.getRaw(key, type), [key, type]);
  const raw = useSyncExternalStore(
    storage.subscribe,
    getSnapshot,
    serverSnapshot,
  );
  const value = useMemo(() => {
    if (raw === null) return initialValue;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return initialValue;
    }
  }, [raw, initialValue]);

  const setValue = useCallback(
    (next: SetStateAction<T>) => {
      let result: T;
      if (typeof next === 'function') {
        const currentRaw = storage.getRaw(key, type);
        let current = initialValue;
        if (currentRaw !== null) {
          try {
            current = JSON.parse(currentRaw) as T;
          } catch {
            current = initialValue;
          }
        }
        result = (next as (previous: T) => T)(current);
      } else {
        result = next;
      }
      storage.set(key, result, type, {
        path,
        domain,
        maxAge,
        expires,
        sameSite,
        secure,
      });
    },
    [key, type, initialValue, path, domain, maxAge, expires, sameSite, secure],
  );

  const removeValue = useCallback(() => {
    storage.remove(key, type, { path, domain, sameSite, secure });
  }, [key, type, path, domain, sameSite, secure]);

  return [value, setValue, removeValue] as const;
};

export default useStorage;
