import { ErrorProjectNotFound } from "@qaveai/shared/module/project/project.schema";
import { Context, Effect, Layer } from "effect";
import { DB, PgLive } from "../../platform/db";
import { projects } from "./project.table";

const newProjectId = () => `prj_${crypto.randomUUID()}`;

export class ProjectRepository extends Context.Service<ProjectRepository>()("ProjectRepository", {
  make: Effect.gen(function* () {
    const db = yield* DB;

    const findMany = Effect.fn("ProjectRepository.findMany")(function* (orgId: string) {
      return yield* db.query.projects.findMany({ where: { orgId }, orderBy: { name: "asc" } });
    });

    const create = Effect.fn("ProjectRepository.create")(function* (orgId: string, name: string) {
      const [project] = yield* db.insert(projects).values({ id: newProjectId(), orgId, name }).returning();
      if (!project) return yield* Effect.die(new Error("Project insert returned no rows"));
      return project;
    });

    const findById = Effect.fn("ProjectRepository.findById")(function* (id: string) {
      const project = yield* db.query.projects.findFirst({ where: { id } });
      if (!project) return yield* new ErrorProjectNotFound({ id });
      return project;
    });

    return {
      findMany,
      create,
      findById,
    };
  }),
}) {}

export const ProjectRepositoryLive = Layer.effect(ProjectRepository)(ProjectRepository.make).pipe(
  Layer.provide(PgLive),
);
