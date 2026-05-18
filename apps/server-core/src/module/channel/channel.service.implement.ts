import { ErrorChannelNameRequired, type ChannelCreatedPayload } from "@qaveai/shared/module/channel/channel.schema";
import { SyncStore } from "@qaveai/sync/server/sync.service.interface";
import { Effect, Layer } from "effect";
import { ChannelRepository } from "./channel.repo.interface";
import { ChannelRepositoryLive } from "./channel.repo.implement";
import { ChannelService } from "./channel.service.interface";

export const ChannelServiceLive = Layer.effect(ChannelService)(
  Effect.gen(function* () {
    const repo = yield* ChannelRepository;
    const sync = yield* SyncStore;

    return ChannelService.of({
      createChannel: Effect.fn("ChannelService.createChannel")(function* (input) {
        const name = input.name.trim();
        if (name.length === 0) return yield* new ErrorChannelNameRequired({ message: "Channel name is required" });

        return yield* sync.withClientMutation(
          input.ctx,
          { clientMutationId: input.clientMutationId, domain: "channels", commandType: "createChannel" },
          (tx) =>
            Effect.gen(function* () {
              const now = new Date();
              const channel = yield* repo.create({
                tenantId: input.ctx.tenantId,
                userId: input.ctx.userId,
                name,
                now,
              });
              const event = yield* tx.appendEvent(input.ctx, {
                domain: "channels",
                type: "channel.created",
                visibility: { type: "tenant" },
                aggregateType: "channel",
                aggregateId: channel.id,
                payload: {
                  channel: {
                    ...channel,
                    createdAt: channel.createdAt.toISOString(),
                    updatedAt: channel.updatedAt.toISOString(),
                  } satisfies ChannelCreatedPayload["channel"],
                },
              });

              return { result: event, resultEventSeq: event.seq };
            }),
        );
      }),
    });
  }),
).pipe(Layer.provide(ChannelRepositoryLive));
