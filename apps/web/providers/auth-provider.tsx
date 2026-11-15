'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import useStorage from '../hooks/use-storage';
import { ACCESS_TOKEN } from '../keys';
import FullScreenLoader from '../components/full-screen-loader';
import LoggedInUserProvider from './loggedin-user';

const PUBLIC_PATHS = new Set(['/', '/auth']);
const AUTH_PATH = '/auth';
const DEFAULT_APP_PATH = '/menu';

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [accessToken] = useStorage<string | null>(ACCESS_TOKEN, null);
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_PATHS.has(pathname);
  const needsAuthRedirect = !isChecking && !accessToken && !isPublic;
  const needsAppRedirect =
    !isChecking && !!accessToken && pathname === AUTH_PATH;

  useEffect(() => {
    setIsChecking(false);
  }, []);

  useEffect(() => {
    if (needsAuthRedirect) router.replace(AUTH_PATH);
    if (needsAppRedirect) router.replace(DEFAULT_APP_PATH);
  }, [needsAuthRedirect, needsAppRedirect, router]);

  if (isChecking || needsAuthRedirect || needsAppRedirect) {
    return <FullScreenLoader />;
  }
  if (isPublic) return <>{children}</>;
  return <LoggedInUserProvider>{children}</LoggedInUserProvider>;
};

export default AuthProvider;
