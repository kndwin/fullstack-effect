import { UserSchema } from "@qaveai/shared/module/auth/auth.schema";
import { Context, Effect, Layer } from "effect";
import { OrgRepository, OrgRepositoryLive } from "./org.repo";

type User = typeof UserSchema.Type;

export class OrgService extends Context.Service<OrgService>()("OrgService", {
  make: Effect.gen(function* () {
    const repo = yield* OrgRepository;

    return {
      ensureDefaultForUser: (user: User) => repo.ensureDefaultForUser(user),
      findManyForUser: repo.findManyForUser,
      userCanAccess: repo.userCanAccess,
      createForUser: repo.createForUser,
    };
  }),
}) {}

export const OrgServiceLive = Layer.effect(OrgService)(OrgService.make).pipe(Layer.provide(OrgRepositoryLive));
