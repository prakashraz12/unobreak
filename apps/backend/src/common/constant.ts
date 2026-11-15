export const RESPONSE_DTO_KEY = '__RESPONSE_DTO_KEY__';
export const IS_PUBLIC_KEY = '__IS_PUBLIC_KEY__';
export const REQUIRE_SUBSCRIPTION_KEY = '__REQUIRE_SUBSCRIPTION__';
export const BACKOFFICE_KEY = '__BACKOFFICE_KEY__';
export const CRON_PURGE_DELETIONS_JOB_NAME =
  '__CRON_PURGE_DELETIONS_JOB_NAME__';
export const DEFAULT_CRON_PURGE_DELETIONS_BATCH_SIZE = 50;

export const RATE_LIMIT_KEY = 'rate_limit_key';

export enum MatchStatus {
  FINDING = 'FINDING',
  JOINED = 'JOINED',
  CANCELLED = 'CANCELLED',
}

export enum MatchType {
  SOLO = 'SOLO',
  TEAM_2V2 = 'TEAM_2V2',
  PRIVATE_ROOM = 'PRIVATE_ROOM',
}

export enum GameSessionStatus {
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED',
  ABANDONED = 'ABANDONED',
}

export enum FriendshipStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
}

/** A listed user's relationship to the requesting user. */
export enum FriendRelation {
  NONE = 'NONE',
  FRIEND = 'FRIEND',
  OUTGOING = 'OUTGOING',
  INCOMING = 'INCOMING',
}
