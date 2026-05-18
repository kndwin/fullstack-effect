import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/unstable/rpc";
import { ChannelSchema } from "./channel.schema";

export const ChannelRpcs = RpcGroup.make(
  Rpc.make("ChannelCreate", {
    success: ChannelSchema,
    payload: {
      tenantId: Schema.String,
      userId: Schema.String,
      name: Schema.String,
      clientMutationId: Schema.String,
    },
  }),
);
