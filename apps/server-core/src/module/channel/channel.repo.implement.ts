import { ErrorChannelInsertFailed } from "@qaveai/shared/module/channel/channel.schema";
import { Effect, Layer } from "effect";
import { DB, PgLive } from "../../platform/db";
import { ChannelRepository } from "./channel.repo.interface";
import { channels } from "./channel.table";

const newChannelId = () => `chn_${crypto.randomUUID()}`;

export const ChannelRepositoryLive = Layer.effect(ChannelRepository)(
  Effect.gen(function* () {
    const db = yield* DB;

    return ChannelRepository.of({
      create: Effect.fn("ChannelRepository.create")(function* (input) {
        const [channel] = yield* db
          .insert(channels)
          .values({
            tenantId: input.tenantId,
            id: newChannelId(),
            name: input.name,
            createdByUserId: input.userId,
            createdAt: input.now,
            updatedAt: input.now,
          })
          .returning();
        if (!channel) return yield* new ErrorChannelInsertFailed({ message: "Channel insert returned no rows" });
        return channel;
      }),
    });
  }),
).pipe(Layer.provide(PgLive));
