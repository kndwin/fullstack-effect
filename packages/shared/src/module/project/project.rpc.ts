import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/unstable/rpc";
import { ProjectSchema } from "./project.schema";

export const ProjectRpcs = RpcGroup.make(
  Rpc.make("ProjectList", { success: ProjectSchema, stream: true, payload: { orgId: Schema.String } }),
  Rpc.make("ProjectCreate", { success: ProjectSchema, payload: { orgId: Schema.String, name: Schema.String } }),
);
