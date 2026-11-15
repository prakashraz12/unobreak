'use client';

import { useSyncExternalStore } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';

const MOBILE_QUERY = '(max-width: 767px)';
const TABLET_QUERY = '(min-width: 768px) and (max-width: 1023px)';
const PORTRAIT_QUERY = '(orientation: portrait)';

const getDeviceType = (): DeviceType => {
  if (window.matchMedia(MOBILE_QUERY).matches) return 'mobile';
  if (window.matchMedia(TABLET_QUERY).matches) return 'tablet';
  return 'desktop';
};

const getOrientation = (): Orientation =>
  window.matchMedia(PORTRAIT_QUERY).matches ? 'portrait' : 'landscape';

let cached: Device | null = null;

const subscribe = (onChange: () => void) => {
  const queries = [MOBILE_QUERY, TABLET_QUERY, PORTRAIT_QUERY].map((q) =>
    window.matchMedia(q),
  );
  const handleChange = () => {
    cached = null;
    onChange();
  };
  queries.forEach((mql) => mql.addEventListener('change', handleChange));
  return () =>
    queries.forEach((mql) => mql.removeEventListener('change', handleChange));
};

export type Device = {
  type: DeviceType;
  orientation: Orientation;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
};

const getSnapshot = (): Device => {
  if (cached) return cached;
  const type = getDeviceType();
  const orientation = getOrientation();
  cached = {
    type,
    orientation,
    isMobile: type === 'mobile',
    isTablet: type === 'tablet',
    isDesktop: type === 'desktop',
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
  };
  return cached;
};

const SERVER_SNAPSHOT: Device = {
  type: 'desktop',
  orientation: 'landscape',
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isPortrait: false,
  isLandscape: true,
};

const useDevice = (): Device =>
  useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);

export default useDevice;
