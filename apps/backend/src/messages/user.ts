import type { Messages } from './message.basetype.ts';

export const USER_MESSAGES = {
  CREATED: 'User created successfully',
  NOT_FOUND: 'User not found',
  FETCHED: 'Users fetched successfully',
  UPDATED: 'User updated successfully',
  DELETED: 'User deleted successfully',
} as const satisfies Messages;
