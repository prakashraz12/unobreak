export interface MessageBaseType {
  CREATED: string;
  NOT_FOUND: string;
  UPDATED: string;
  DELETED: string;
}

export type Messages = MessageBaseType & Record<string, string>;
