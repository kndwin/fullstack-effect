import { ProjectRpcs } from "@qaveai/shared/module/project/project.rpc";
import { Effect, Layer, Stream } from "effect";
import { ProjectService, ProjectServiceLive } from "./project.service";

export const ProjectRpcLive = ProjectRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* ProjectService;

    return ProjectRpcs.of({
      ProjectList: ({ orgId }) => Stream.fromIterableEffect(service.findMany(orgId)).pipe(Stream.orDie),
      ProjectCreate: ({ orgId, name }) => service.create(orgId, name).pipe(Effect.orDie),
    });
  }),
).pipe(Layer.provide(ProjectServiceLive));
