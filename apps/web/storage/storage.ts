export type StorageType = 'local' | 'session' | 'cookie';

export interface CookieOptions {
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
  sameSite?: 'Strict' | 'Lax' | 'None';
  secure?: boolean;
}

const CHANGE_EVENT = 'app-storage-change';

const notify = () => window.dispatchEvent(new Event(CHANGE_EVENT));

const cookieAttributes = (options: CookieOptions) => {
  const {
    path = '/',
    domain,
    maxAge,
    expires,
    sameSite = 'Lax',
    secure = typeof location !== 'undefined' && location.protocol === 'https:',
  } = options;
  if ([path, domain].some((value) => value && /[;\r\n]/.test(value))) {
    throw new TypeError('Invalid cookie path or domain');
  }
  if (sameSite === 'None' && !secure)
    throw new TypeError('SameSite=None requires Secure');
  if (maxAge !== undefined && !Number.isFinite(maxAge))
    throw new TypeError('Invalid cookie maxAge');
  return [
    `Path=${path}`,
    domain && `Domain=${domain}`,
    maxAge !== undefined && `Max-Age=${Math.floor(maxAge)}`,
    expires && `Expires=${expires.toUTCString()}`,
    `SameSite=${sameSite}`,
    secure && 'Secure',
  ]
    .filter(Boolean)
    .join('; ');
};

export const storage = {
  getRaw(key: string, type: StorageType = 'local'): string | null {
    if (typeof window === 'undefined') return null;
    try {
      if (type !== 'cookie')
        return (
          type === 'local' ? window.localStorage : window.sessionStorage
        ).getItem(key);
      const prefix = `${encodeURIComponent(key)}=`;
      const cookie = document.cookie
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith(prefix));
      return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
    } catch {
      return null;
    }
  },

  get<T>(key: string, type: StorageType = 'local'): T | null {
    const raw = storage.getRaw(key, type);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  set<T>(
    key: string,
    value: T,
    type: StorageType = 'local',
    options: CookieOptions = {},
  ): void {
    if (typeof window === 'undefined') return;
    const raw = JSON.stringify(value);
    if (raw === undefined)
      throw new TypeError('Storage values must be JSON serializable');
    if (type === 'cookie') {
      document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(raw)}; ${cookieAttributes(options)}`;
    } else {
      (type === 'local' ? window.localStorage : window.sessionStorage).setItem(
        key,
        raw,
      );
    }
    notify();
  },

  remove(
    key: string,
    type: StorageType = 'local',
    options: CookieOptions = {},
  ): void {
    if (typeof window === 'undefined') return;
    if (type === 'cookie') {
      document.cookie = `${encodeURIComponent(key)}=; ${cookieAttributes({ ...options, maxAge: 0, expires: new Date(0) })}`;
    } else {
      (type === 'local'
        ? window.localStorage
        : window.sessionStorage
      ).removeItem(key);
    }
    notify();
  },

  subscribe(listener: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener(CHANGE_EVENT, listener);
    window.addEventListener('storage', listener);
    window.addEventListener('focus', listener);
    return () => {
      window.removeEventListener(CHANGE_EVENT, listener);
      window.removeEventListener('storage', listener);
      window.removeEventListener('focus', listener);
    };
  },
};

export default storage;
