import { ProjectSchema } from "@qaveai/shared/module/project/project.schema";
import { Schema } from "effect";
import { m } from "foldkit/message";

export const ProjectStarted = m("ProjectStarted", { orgId: Schema.String });
export const ProjectDraftChanged = m("ProjectDraftChanged", { value: Schema.String });
export const ProjectCreateClicked = m("ProjectCreateClicked", { orgId: Schema.String });
export const ProjectSelected = m("ProjectSelected", { id: Schema.String });
export const ProjectLoaded = m("ProjectLoaded", { projects: Schema.Array(ProjectSchema) });
export const ProjectCreated = m("ProjectCreated", { project: ProjectSchema });
export const ProjectFailed = m("ProjectFailed", { message: Schema.String });

export const ProjectMessage = Schema.Union([
  ProjectStarted,
  ProjectDraftChanged,
  ProjectCreateClicked,
  ProjectSelected,
  ProjectLoaded,
  ProjectCreated,
  ProjectFailed,
]);
export type ProjectMessage = typeof ProjectMessage.Type;
