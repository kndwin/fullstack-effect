import { Context, Effect, Layer } from "effect";
import { ProjectRepository, ProjectRepositoryLive } from "./project.repo";

export class ProjectService extends Context.Service<ProjectService>()("ProjectService", {
  make: Effect.gen(function* () {
    const repo = yield* ProjectRepository;

    return {
      findMany: repo.findMany,
      create: (orgId: string, name: string) => repo.create(orgId, name.trim()),
      findById: repo.findById,
    };
  }),
}) {}

export const ProjectServiceLive = Layer.effect(ProjectService)(ProjectService.make).pipe(
  Layer.provide(ProjectRepositoryLive),
);
