import { USER_MESSAGES } from './user.ts';

export const MESSAGES = {
  user: USER_MESSAGES,
} as const;

type MessageModules = typeof MESSAGES;

export function getMessage<
  M extends keyof MessageModules,
  K extends keyof MessageModules[M],
>(module: M, key: K): MessageModules[M][K] {
  return MESSAGES[module][key];
}
