import { ProjectSchema } from "@qaveai/shared/module/project/project.schema";
import { Schema } from "effect";

export const ProjectItemStatus = Schema.Union([Schema.Literal("idle"), Schema.Literal("selected")]);
export type ProjectItemStatus = typeof ProjectItemStatus.Type;

export const ProjectItem = Schema.Struct({
  project: ProjectSchema,
  status: ProjectItemStatus,
});
export type ProjectItem = typeof ProjectItem.Type;

export const ProjectModel = Schema.Struct({
  draft: Schema.String,
  projects: Schema.Array(ProjectItem),
  status: Schema.Struct({
    loadingProjects: Schema.Boolean,
    creatingProject: Schema.Boolean,
  }),
  error: Schema.NullOr(Schema.String),
});
export type ProjectModel = typeof ProjectModel.Type;
