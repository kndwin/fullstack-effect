import { Schema } from "effect";

export const ClientMutationStatusSchema = Schema.Union([
  Schema.Literal("pending"),
  Schema.Literal("completed"),
  Schema.Literal("failed"),
]);
export type ClientMutationStatus = typeof ClientMutationStatusSchema.Type;

export const ClientMutationSchema = Schema.Struct({
  tenantId: Schema.String,
  userId: Schema.String,
  clientMutationId: Schema.String,
  domain: Schema.String,
  commandType: Schema.String,
  resultEventSeq: Schema.NullOr(Schema.Number),
  status: ClientMutationStatusSchema,
  createdAt: Schema.String,
});
export type ClientMutation = typeof ClientMutationSchema.Type;

export const ClientMutationInputSchema = Schema.Struct({
  clientMutationId: Schema.String,
  domain: Schema.String,
  commandType: Schema.String,
});
export type ClientMutationInput = typeof ClientMutationInputSchema.Type;
