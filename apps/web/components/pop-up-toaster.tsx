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
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastOptions {
  type?: ToastType;
  duration?: number;
}

interface Toast extends Required<ToastOptions> {
  id: number;
  message: string;
}

interface ToasterContextValue {
  triggerToast: (message: string, options?: ToastOptions) => number;
  dismissToast: (id: number) => void;
}

const ToasterContext = createContext<ToasterContextValue | null>(null);
const COLORS: Record<ToastType, string> = {
  success: '#38a336',
  error: '#e3202b',
  info: '#0b5fc4',
};

const ToastItem = ({
  toast,
  dismiss,
}: {
  toast: Toast;
  dismiss: (id: number) => void;
}) => {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (toast.duration <= 0) return;
    const timer = window.setTimeout(() => dismiss(toast.id), toast.duration);
    return () => window.clearTimeout(timer);
  }, [toast.id, toast.duration, dismiss]);

  return (
    <motion.div
      layout={!reducedMotion}
      initial={{
        opacity: 0,
        y: reducedMotion ? 0 : 80,
        scale: reducedMotion ? 1 : 0.95,
      }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        y: reducedMotion ? 0 : 30,
        scale: reducedMotion ? 1 : 0.95,
      }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { type: 'spring', stiffness: 380, damping: 28 }
      }
      className="pointer-events-auto flex w-full items-center gap-3 rounded-3xl border-4 border-[#6b2f00] bg-linear-to-b from-[#fff48a] to-[#ffd61f] px-4 py-3 text-[#6b2f00] shadow-[inset_0_-4px_0_#e9a700,0_4px_0_#6b2f00,0_8px_20px_rgba(0,0,0,0.3)]"
    >
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden="true">
        <circle
          cx={16}
          cy={16}
          r={14}
          fill={COLORS[toast.type]}
          stroke="#fff"
          strokeWidth={2}
        />
        {toast.type === 'success' ? (
          <path
            d="M9,16 L14,21 L23,11"
            fill="none"
            stroke="#fff"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : toast.type === 'error' ? (
          <path
            d="M11,11 L21,21 M21,11 L11,21"
            stroke="#fff"
            strokeWidth={3}
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M16,15 L16,23 M16,9 L16,10"
            stroke="#fff"
            strokeWidth={3}
            strokeLinecap="round"
          />
        )}
      </svg>
      <p className="min-w-0 flex-1 text-sm font-bold wrap-break-word">
        {toast.message}
      </p>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => dismiss(toast.id)}
        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl outline-none hover:bg-[#6b2f00]/10 focus-visible:ring-2 focus-visible:ring-[#6b2f00]"
      >
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
          <path
            d="M5,5 L19,19 M19,5 L5,19"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
          />
        </svg>
      </button>
    </motion.div>
  );
};

const PopUpToasterProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const triggerToast = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const id = ++nextId.current;
      const { type = 'info', duration = 4000 } = options;
      setToasts((current) => [
        ...current.slice(-3),
        { id, message, type, duration },
      ]);
      return id;
    },
    [],
  );

  const value = useMemo(
    () => ({ triggerToast, dismissToast }),
    [triggerToast, dismissToast],
  );

  return (
    <ToasterContext.Provider value={value}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        aria-relevant="additions"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-100 mx-auto flex w-full max-w-md flex-col gap-3 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} dismiss={dismissToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToasterContext.Provider>
  );
};

export const usePopUpToaster = () => {
  const context = useContext(ToasterContext);
  if (!context)
    throw new Error('usePopUpToaster must be used within PopUpToasterProvider');
  return context;
};

export default PopUpToasterProvider;
