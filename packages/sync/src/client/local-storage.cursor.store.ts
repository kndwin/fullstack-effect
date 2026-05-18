import { Schema } from "effect";
import { SyncCursorSchema, type CursorStore, type SyncCursor } from "./sync-cursor.store";

export type SyncCursorStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type LocalStorageCursorStoreInput = {
  readonly storage: SyncCursorStorage;
  readonly keyPrefix?: string;
};

const cursorJsonSchema = Schema.fromJsonString(SyncCursorSchema);
const defaultKeyPrefix = "qave.sync.cursor";

export const createLocalStorageCursorStore = (input: LocalStorageCursorStoreInput): CursorStore => {
  const keyForTenant = (tenantId: string) => `${input.keyPrefix ?? defaultKeyPrefix}:${tenantId}`;

  return {
    getCursor: async (tenantId: string): Promise<SyncCursor | null> => {
      const value = input.storage.getItem(keyForTenant(tenantId));
      return value === null ? null : Schema.decodeUnknownSync(cursorJsonSchema)(value);
    },
    setCursor: async (cursor: SyncCursor): Promise<void> => {
      input.storage.setItem(keyForTenant(cursor.tenantId), Schema.encodeSync(cursorJsonSchema)(cursor));
    },
  };
};
