import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import { Command } from "foldkit";
import { channelRpc } from "../../rpc";
import { ChannelCreated, ChannelFailed } from "./channel.message";

const ChannelCommandCreate = Command.define("ChannelCommandCreate", ChannelCreated, ChannelFailed);

export const createChannel = (input: { readonly tenantId: string; readonly userId: string; readonly name: string }) =>
  ChannelCommandCreate(
    channelRpc.create({ ...input, clientMutationId: crypto.randomUUID() }).pipe(
      Effect.map((channel) => ChannelCreated({ channel })),
      Effect.catchCause((cause) => Effect.succeed(ChannelFailed({ message: Cause.pretty(cause) }))),
    ),
  );
