import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/unstable/rpc";
import { ErrorOrgInvalidName, OrgSchema } from "./org.schema";

export const OrgRpcs = RpcGroup.make(
  Rpc.make("OrgList", { success: OrgSchema, stream: true }),
  Rpc.make("OrgCreate", { success: OrgSchema, payload: { name: Schema.String }, error: ErrorOrgInvalidName }),
);
