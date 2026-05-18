import { Schema } from "effect";

export const ChannelSchema = Schema.Struct({
  tenantId: Schema.String,
  id: Schema.String,
  name: Schema.String,
  createdByUserId: Schema.String,
  createdAt: Schema.String,
  updatedAt: Schema.String,
});
export type Channel = typeof ChannelSchema.Type;

export const ChannelCreatedPayload = Schema.Struct({
  channel: ChannelSchema,
});
export type ChannelCreatedPayload = typeof ChannelCreatedPayload.Type;

export class ErrorChannelInsertFailed extends Schema.TaggedErrorClass<ErrorChannelInsertFailed>()(
  "ErrorChannelInsertFailed",
  { message: Schema.String },
) {}

export class ErrorChannelNameRequired extends Schema.TaggedErrorClass<ErrorChannelNameRequired>()(
  "ErrorChannelNameRequired",
  { message: Schema.String },
) {}
