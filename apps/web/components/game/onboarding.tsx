'use client';
import { useRef, useState } from 'react';
import Script from 'next/script';
import TextButton from '@repo/ui/text-button';
import RedFloor from '../floors/red-floor';
import Logo from '../logo';
import TextInput from '../inputs/text-input';
import { useUserControllerCreateUser } from '../../services/queries-components';
import { usePopUpToaster } from '../pop-up-toaster';
import { options } from '../../lib/utils';
import useStorage from '../../hooks/use-storage';
import { ACCESS_TOKEN } from '../../keys';
import { AVATARS } from '../avatars/presets';

interface GoogleTokenClient {
  requestAccessToken: () => void;
}

interface GoogleAccounts {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: { access_token?: string; error?: string }) => void;
        error_callback?: (error: { type: string }) => void;
      }) => GoogleTokenClient;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleAccounts;
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.07.72-2.44 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.27 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.37-2.28v-3.1H1.29a12 12 0 0 0 0 10.76l3.98-3.1Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.76c1.76 0 3.34.6 4.58 1.8l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.1C6.22 6.87 8.87 4.76 12 4.76Z"
    />
  </svg>
);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

const Onboarding = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({ name: '', email: '', password: '' });

  const { triggerToast } = usePopUpToaster();
  const [, setAccessToken] = useStorage<string | null>(ACCESS_TOKEN, null);
  const { mutate: createUser, isPending } = useUserControllerCreateUser(
    options(triggerToast, (data) => {
      setAccessToken(data.data.accessToken);
    }),
  );

  const handleContinue = () => {
    const name = form.name.trim();
    const email = form.email.trim();
    const nextErrors = {
      name: name ? '' : 'Nickname is required',
      email: !email
        ? 'Email is required'
        : EMAIL_REGEX.test(email)
          ? ''
          : 'Enter a valid email address',
      password: !form.password
        ? 'Password is required'
        : form.password.length < MIN_PASSWORD_LENGTH
          ? `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
          : '',
    };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.email || nextErrors.password) return;
    createUser({
      body: {
        name,
        avatarId: AVATARS[Math.floor(Math.random() * AVATARS.length)]!.id,
        email,
        password: form.password,
      },
    });
  };

  const tokenClient = useRef<GoogleTokenClient | null>(null);

  const loginWithGoogle = async (googleAccessToken: string) => {
    const res = await fetch(`${API_BASE_URL}/users/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: googleAccessToken }),
    });
    console.log(res);
    if (!res.ok) {
      triggerToast('Google sign-in failed. Please try again.', {
        type: 'error',
      });
      return;
    }
    const data = (await res.json()) as { data: { accessToken: string } };
    setAccessToken(data.data.accessToken);
  };

  const handleGoogle = () => {
    if (!GOOGLE_CLIENT_ID) {
      triggerToast('Google sign-in is not configured', { type: 'error' });
      return;
    }
    if (!window.google) {
      triggerToast('Google sign-in is still loading, try again', {
        type: 'info',
      });
      return;
    }
    tokenClient.current ??= window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: (response) => {
        if (response.access_token) {
          void loginWithGoogle(response.access_token);
        }
      },
      error_callback: () => {
        triggerToast('Google sign-in was cancelled', { type: 'info' });
      },
    });
    tokenClient.current.requestAccessToken();
  };

  const canContinue =
    form.name.trim().length > 0 &&
    form.email.trim().length > 0 &&
    form.password.length > 0;

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="lazyOnload"
      />
      <RedFloor />
      <div className="relative z-10 flex items-center justify-center p-4">
        <Logo className="h-auto w-32 drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)]" />
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-10">
        <div className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-center">
          <div className="flex w-full flex-col items-center gap-6 rounded-3xl border-4 border-[#6b2f00] bg-linear-to-b from-[#b5741a]/85 to-[#7c4a04]/85 px-8 py-10 shadow-[inset_0_3px_0_rgba(255,214,31,0.35),0_8px_0_#3d1f00,0_16px_24px_rgba(0,0,0,0.4)] backdrop-blur-sm">
            <h1 className="font-display text-4xl font-black uppercase italic tracking-wide text-white [paint-order:stroke_fill] [text-shadow:0_3px_0_#6b2f00] [-webkit-text-stroke:6px_#6b2f00]">
              Welcome
            </h1>

            <TextInput
              label="Nickname"
              type="text"
              autoComplete="nickname"
              placeholder="Enter your name"
              maxLength={16}
              value={form.name}
              error={errors.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
            />
            <TextInput
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              error={errors.email}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
            />
            <TextInput
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={form.password}
              error={errors.password}
              onChange={(e) => {
                setForm({ ...form, password: e.target.value });
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
            />

            <TextButton
              onClick={handleContinue}
              disabled={!canContinue}
              loading={isPending}
              className="w-full max-w-sm"
            >
              Continue
            </TextButton>

            <div className="flex w-full max-w-sm items-center gap-4">
              <div className="h-0.5 flex-1 rounded bg-white/40" />
              <span className="font-display text-sm font-black uppercase italic tracking-wide text-white [text-shadow:0_2px_0_#6b2f00]">
                or
              </span>
              <div className="h-0.5 flex-1 rounded bg-white/40" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              className="flex h-14 w-full max-w-sm cursor-pointer items-center justify-center gap-3 rounded-xl border-4 border-[#6b2f00] bg-linear-to-b from-white to-[#fde9a8] px-8 text-lg font-bold text-[#6b2f00] shadow-[0_4px_0_#6b2f00,0_8px_10px_rgba(0,0,0,0.3)] transition-transform hover:scale-105 active:translate-y-1 active:scale-95 active:shadow-[0_1px_0_#6b2f00,0_3px_6px_rgba(0,0,0,0.35)]"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
