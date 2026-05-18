import { Context, Effect } from "effect";
import type { channels } from "./channel.table";

export type ChannelRow = typeof channels.$inferSelect;

export type ChannelRepositoryShape = {
  readonly create: (input: {
    readonly tenantId: string;
    readonly userId: string;
    readonly name: string;
    readonly now: Date;
  }) => Effect.Effect<ChannelRow, unknown>;
};

export class ChannelRepository extends Context.Service<ChannelRepository>()("ChannelRepository", {
  make: Effect.succeed({} as ChannelRepositoryShape),
}) {}
