import { Schema } from "effect";

export const PendingMutationStatusSchema = Schema.Union([
  Schema.Literal("pending"),
  Schema.Literal("flushing"),
  Schema.Literal("failed"),
]);
export type PendingMutationStatus = typeof PendingMutationStatusSchema.Type;

export const PendingMutationSchema = Schema.Struct({
  tenantId: Schema.String,
  domain: Schema.String,
  commandType: Schema.String,
  clientMutationId: Schema.String,
  payload: Schema.Unknown,
  status: PendingMutationStatusSchema,
  createdAt: Schema.String,
  attemptCount: Schema.Number,
  lastError: Schema.optional(Schema.String),
});
export type PendingMutation = typeof PendingMutationSchema.Type;
