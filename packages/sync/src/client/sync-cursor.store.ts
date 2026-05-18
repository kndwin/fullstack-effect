import { Schema } from "effect";

export const SyncCursorSchema = Schema.Struct({
  tenantId: Schema.String,
  lastSeq: Schema.Number,
});
export type SyncCursor = typeof SyncCursorSchema.Type;

export type CursorStore = {
  readonly getCursor: (tenantId: string) => Promise<SyncCursor | null>;
  readonly setCursor: (cursor: SyncCursor) => Promise<void>;
};
