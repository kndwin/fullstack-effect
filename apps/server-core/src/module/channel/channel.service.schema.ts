import { Schema } from "effect";

export const ChannelCreateInput = Schema.Struct({
  ctx: Schema.Struct({ tenantId: Schema.String, userId: Schema.String }),
  name: Schema.String,
  clientMutationId: Schema.String,
});
export type ChannelCreateInput = typeof ChannelCreateInput.Type;
