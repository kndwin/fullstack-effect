import { ChannelSchema } from "@qaveai/shared/module/channel/channel.schema";
import { Schema } from "effect";

export const ChannelModel = Schema.Struct({
  tenantId: Schema.String,
  channels: Schema.Array(ChannelSchema),
  draft: Schema.String,
  error: Schema.NullOr(Schema.String),
});
export type ChannelModel = typeof ChannelModel.Type;

export const emptyChannelModel = (tenantId: string): ChannelModel => ({
  tenantId,
  channels: [],
  draft: "",
  error: null,
});
