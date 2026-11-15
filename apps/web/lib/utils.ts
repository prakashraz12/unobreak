import type { UseMutationOptions } from '@tanstack/react-query';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ToastOptions } from '../components/pop-up-toaster';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export interface MutationSuccessData {
  message?: string;
}

export interface MutationOpts {
  successMessage?: string;
  disableDefaultToast?: boolean;
  disableErrorToast?: boolean;
}

type TriggerToast = (message: string, options?: ToastOptions) => number;

const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const payload = 'payload' in error ? error.payload : error;
    if (
      payload &&
      typeof payload === 'object' &&
      'message' in payload &&
      typeof payload.message === 'string'
    ) {
      return payload.message;
    }
    if (typeof payload === 'string') return payload;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
};

export const options = <
  Output extends MutationSuccessData = MutationSuccessData,
>(
  triggerToast: TriggerToast,
  successCallback?: (data: Output) => void | Promise<void>,
  opts?: MutationOpts,
): Omit<UseMutationOptions<Output, unknown, unknown>, 'mutationFn'> => ({
  onSuccess(data) {
    if (!opts?.disableDefaultToast) {
      const message = opts?.successMessage || data?.message;
      if (message) triggerToast(message, { type: 'success' });
    }
    if (successCallback) {
      void successCallback(data);
    }
  },
  onError(error: unknown) {
    if (!opts?.disableErrorToast) {
      triggerToast(getErrorMessage(error), { type: 'error' });
    }
  },
});
