import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/unstable/rpc";
import { AuthSessionSchema } from "./auth.schema";

export const AuthRpcs = RpcGroup.make(
  Rpc.make("AuthMe", { success: Schema.NullOr(AuthSessionSchema) }),
  Rpc.make("AuthLogout", { success: Schema.Void }),
);
