import { Preview } from "@qaveai/foldkit-preview";
import { Schema } from "effect";
import { emptyChannelModel } from "./channel.model";
import { ChannelMessage } from "./channel.message";
import { channelListView } from "./channel.view";

const tenantId = "tenant_preview";
const userId = "user_preview";
const channel = {
  id: "chn_general",
  tenantId,
  name: "General",
  createdByUserId: userId,
  createdAt: "2026-05-10T00:00:00.000Z",
  updatedAt: "2026-05-10T00:00:00.000Z",
};

export const ChannelPreview = Preview.module({
  title: "Module/Channel",
  previews: [
    Preview.preview({
      name: "States",
      view: () => channelListView({ ...emptyChannelModel(tenantId), channels: [channel] }, { tenantId, userId }),
    }),
  ],
});

export const Message = Schema.Union([ChannelMessage]);
