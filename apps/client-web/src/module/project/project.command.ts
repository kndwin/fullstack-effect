import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import { Command } from "foldkit";
import { projectRpc } from "../../rpc";
import { ProjectCreated, ProjectFailed, ProjectLoaded } from "./project.message";

const ProjectCommandLoad = Command.define("ProjectCommandLoad", ProjectLoaded, ProjectFailed);
const ProjectCommandCreate = Command.define("ProjectCommandCreate", ProjectCreated, ProjectFailed);

export const loadProjects = (orgId: string) =>
  ProjectCommandLoad(
    projectRpc.list(orgId).pipe(
      Effect.map((projects) => ProjectLoaded({ projects })),
      Effect.catchCause((cause) => Effect.succeed(ProjectFailed({ message: Cause.pretty(cause) }))),
    ),
  );

export const createProject = (orgId: string, name: string) =>
  ProjectCommandCreate(
    projectRpc.create(orgId, name).pipe(
      Effect.map((project) => ProjectCreated({ project })),
      Effect.catchCause((cause) => Effect.succeed(ProjectFailed({ message: Cause.pretty(cause) }))),
    ),
  );
