'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Modal, ModalContent } from '@repo/ui/modal';

interface NavigationGuardContextValue {
  armed: boolean;
  arm: () => void;
  disarm: () => void;
}

const NavigationGuardContext =
  createContext<NavigationGuardContextValue | null>(null);

const GUARD_STATE = { navigationGuard: true } as const;

const NavigationGuardProvider = ({ children }: { children: ReactNode }) => {
  const [armed, setArmed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'back' | 'reload'>('back');
  const armedRef = useRef(false);

  armedRef.current = armed;

  const arm = useCallback(() => setArmed(true), []);
  const disarm = useCallback(() => {
    setArmed(false);
    setConfirmOpen(false);
  }, []);

  useEffect(() => {
    if (!armed) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const reloadKey =
        e.key === 'F5' ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r');
      if (!reloadKey) return;
      e.preventDefault();
      setPendingAction('reload');
      setConfirmOpen(true);
    };

    history.pushState(GUARD_STATE, '');
    const onPopState = () => {
      if (!armedRef.current) return;
      history.pushState(GUARD_STATE, '');
      setPendingAction('back');
      setConfirmOpen(true);
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('popstate', onPopState);
    };
  }, [armed]);

  const leave = useCallback(() => {
    disarm();
    if (pendingAction === 'reload') window.location.reload();
    else history.back();
  }, [disarm, pendingAction]);

  const value = useMemo(() => ({ armed, arm, disarm }), [armed, arm, disarm]);

  return (
    <NavigationGuardContext.Provider value={value}>
      {children}
      <Modal
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open) setConfirmOpen(false);
        }}
      >
        <ModalContent>
          <div className="flex flex-col items-center gap-2 px-6 pb-6 pt-8 text-center">
            <span className="font-display text-2xl font-black uppercase italic text-white [-webkit-text-stroke:2px_#6b2f00] [paint-order:stroke_fill]">
              Leave the match?
            </span>
            <p className="text-sm font-bold text-white/70">
              Your match progress will be lost.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="cursor-pointer rounded-xl border-2 border-[#6b2f00] bg-linear-to-b from-[#7be05a] to-[#2fa52a] px-6 py-2 font-display text-base font-black uppercase italic text-white shadow-[0_3px_0_#6b2f00] transition-transform hover:scale-105 active:translate-y-0.5"
              >
                Stay
              </button>
              <button
                type="button"
                onClick={leave}
                className="cursor-pointer rounded-xl border-2 border-[#6b2f00] bg-linear-to-b from-[#ff9b8a] to-[#e8590c] px-6 py-2 font-display text-base font-black uppercase italic text-white shadow-[0_3px_0_#6b2f00] transition-transform hover:scale-105 active:translate-y-0.5"
              >
                Leave
              </button>
            </div>
          </div>
        </ModalContent>
      </Modal>
    </NavigationGuardContext.Provider>
  );
};

export const useNavigationGuard = () => {
  const context = useContext(NavigationGuardContext);
  if (!context) {
    throw new Error(
      'useNavigationGuard must be used within NavigationGuardProvider',
    );
  }
  return context;
};

export const useNavigationLock = (active: boolean) => {
  const { arm, disarm } = useNavigationGuard();
  useEffect(() => {
    if (!active) return;
    arm();
    return disarm;
  }, [active, arm, disarm]);
};

export default NavigationGuardProvider;
