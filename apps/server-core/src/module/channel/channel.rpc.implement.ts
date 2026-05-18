import { ChannelCreatedPayload } from "@qaveai/shared/module/channel/channel.schema";
import { ChannelRpcs } from "@qaveai/shared/module/channel/channel.rpc.interface";
import { Effect, Layer, Schema } from "effect";
import { SyncStoreSqlLive } from "../sync/sync.repo.implement";
import { ChannelServiceLive } from "./channel.service.implement";
import { ChannelService } from "./channel.service.interface";

export const ChannelRpcLive = ChannelRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* ChannelService;

    return ChannelRpcs.of({
      ChannelCreate: ({ tenantId, userId, name, clientMutationId }) =>
        service.createChannel({ ctx: { tenantId, userId }, name, clientMutationId }).pipe(
          Effect.map((result) => Schema.decodeUnknownSync(ChannelCreatedPayload)(result.result.payload).channel),
          Effect.orDie,
        ),
    });
  }),
).pipe(Layer.provide([ChannelServiceLive, SyncStoreSqlLive]));
