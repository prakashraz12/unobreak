'use client';

import { useCallback, useEffect, useState } from 'react';

const INVITE_COOLDOWN_MS = 5_000;

const useInviteCooldown = () => {
  const [deadlines, setDeadlines] = useState<ReadonlyMap<number, number>>(
    new Map(),
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (deadlines.size === 0) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      setDeadlines((prev) => {
        const next = new Map([...prev].filter(([, end]) => end > t));
        return next.size === prev.size ? prev : next;
      });
    }, 250);
    return () => clearInterval(id);
  }, [deadlines.size]);

  const startCooldown = useCallback((userId: number) => {
    const t = Date.now();
    setNow(t);
    setDeadlines((prev) => new Map(prev).set(userId, t + INVITE_COOLDOWN_MS));
  }, []);

  const secondsLeft = (userId: number) => {
    const end = deadlines.get(userId);
    return end === undefined ? 0 : Math.max(0, Math.ceil((end - now) / 1000));
  };

  return { secondsLeft, startCooldown };
};

export default useInviteCooldown;
