import { Schema } from "effect";
import { m } from "foldkit/message";
import { ChannelSchema } from "@qaveai/shared/module/channel/channel.schema";

export const ChannelDraftChanged = m("ChannelDraftChanged", { value: Schema.String });
export const ChannelCreateClicked = m("ChannelCreateClicked", { tenantId: Schema.String, userId: Schema.String });
export const ChannelCreated = m("ChannelCreated", { channel: ChannelSchema });
export const ChannelFailed = m("ChannelFailed", { message: Schema.String });

export const ChannelMessage = Schema.Union([ChannelDraftChanged, ChannelCreateClicked, ChannelCreated, ChannelFailed]);
export type ChannelMessage = typeof ChannelMessage.Type;
