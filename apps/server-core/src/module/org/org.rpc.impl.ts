import { OrgRpcs } from "@qaveai/shared/module/org/org.rpc";
import { Effect, Layer, Stream } from "effect";
import { OrgService, OrgServiceLive } from "./org.service";

const demoUserId = "usr_demo";

export const OrgRpcLive = OrgRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* OrgService;

    return OrgRpcs.of({
      OrgList: () => Stream.fromIterableEffect(service.findManyForUser(demoUserId)).pipe(Stream.orDie),
      OrgCreate: ({ name }) =>
        service.createForUser(demoUserId, name).pipe(Effect.catchTag("EffectDrizzleQueryError", Effect.die)),
    });
  }),
).pipe(Layer.provide(OrgServiceLive));
