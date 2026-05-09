import { AuthRpcs } from "@qaveai/shared/module/auth/auth.rpc";
import { Effect } from "effect";

export const AuthRpcLive = AuthRpcs.toLayer(
  Effect.succeed(
    AuthRpcs.of({
      AuthMe: () => Effect.succeed(null),
      AuthLogout: () => Effect.void,
    }),
  ),
);
