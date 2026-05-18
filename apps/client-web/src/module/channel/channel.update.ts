import { Command } from "foldkit";
import { Match } from "effect";
import { createChannel } from "./channel.command";
import { emptyChannelModel, type ChannelModel } from "./channel.model";
import type { ChannelMessage } from "./channel.message";

export const init = (
  tenantId = "tenant_dev",
): readonly [ChannelModel, ReadonlyArray<Command.Command<ChannelMessage>>] => [emptyChannelModel(tenantId), []];

export const update = (
  model: ChannelModel,
  message: ChannelMessage,
): readonly [ChannelModel, ReadonlyArray<Command.Command<ChannelMessage>>] =>
  Match.value(message).pipe(
    Match.withReturnType<readonly [ChannelModel, ReadonlyArray<Command.Command<ChannelMessage>>]>(),
    Match.tagsExhaustive({
      ChannelDraftChanged: ({ value }) => [{ ...model, draft: value }, []],
      ChannelCreateClicked: ({ tenantId, userId }) => {
        const name = model.draft.trim();
        return name.length === 0
          ? [model, []]
          : [{ ...model, draft: "", error: null }, [createChannel({ tenantId, userId, name })]];
      },
      ChannelCreated: ({ channel }) => [
        {
          ...model,
          channels: model.channels.some((item) => item.id === channel.id)
            ? model.channels
            : [...model.channels, channel],
          error: null,
        },
        [],
      ],
      ChannelFailed: ({ message }) => [{ ...model, error: message }, []],
    }),
  );
