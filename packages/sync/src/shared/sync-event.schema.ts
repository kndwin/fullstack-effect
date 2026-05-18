import { Schema } from "effect";
import { SyncVisibilitySchema } from "./sync-visibility.schema";

export const SyncEventSchema = Schema.Struct({
  tenantId: Schema.String,
  userId: Schema.String,
  seq: Schema.Number,
  domain: Schema.String,
  type: Schema.String,
  visibility: SyncVisibilitySchema,
  aggregateType: Schema.String,
  aggregateId: Schema.String,
  payload: Schema.Unknown,
  createdAt: Schema.String,
});
export type SyncEvent = typeof SyncEventSchema.Type;

export const SyncEventInputSchema = Schema.Struct({
  domain: Schema.String,
  type: Schema.String,
  visibility: SyncVisibilitySchema,
  aggregateType: Schema.String,
  aggregateId: Schema.String,
  payload: Schema.Unknown,
});
export type SyncEventInput = typeof SyncEventInputSchema.Type;

export const EphemeralEventSchema = Schema.Struct({
  tenantId: Schema.String,
  userId: Schema.String,
  domain: Schema.String,
  type: Schema.String,
  visibility: SyncVisibilitySchema,
  payload: Schema.Unknown,
  createdAt: Schema.String,
});
export type EphemeralEvent = typeof EphemeralEventSchema.Type;
