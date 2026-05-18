import type { SyncEvent } from "@qaveai/sync/shared/sync-event.schema";
import type { ClientMutationResult } from "@qaveai/sync/server/sync.service.interface";
import { Context, Effect } from "effect";
import type { ChannelCreateInput } from "./channel.service.schema";

export type ChannelServiceShape = {
  readonly createChannel: (input: ChannelCreateInput) => Effect.Effect<ClientMutationResult<SyncEvent>, unknown>;
};

export class ChannelService extends Context.Service<ChannelService>()("ChannelService", {
  make: Effect.succeed({} as ChannelServiceShape),
}) {}
