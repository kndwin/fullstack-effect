import { Match } from "effect";
import { Command } from "foldkit";
import { createProject, loadProjects } from "./project.command";
import type { ProjectModel } from "./project.model";
import { ProjectMessage } from "./project.message";

const idleStatus: ProjectModel["status"] = {
  loadingProjects: false,
  creatingProject: false,
};

export const init = () =>
  [{ draft: "", projects: [], status: { ...idleStatus, loadingProjects: false }, error: null }, []] as const;

export const update = (
  model: ProjectModel,
  message: ProjectMessage,
): readonly [ProjectModel, ReadonlyArray<Command.Command<ProjectMessage>>] =>
  Match.value(message).pipe(
    Match.withReturnType<readonly [ProjectModel, ReadonlyArray<Command.Command<ProjectMessage>>]>(),
    Match.tagsExhaustive({
      ProjectStarted: ({ orgId }) => [
        { ...model, status: { ...model.status, loadingProjects: true }, error: null },
        [loadProjects(orgId)],
      ],
      ProjectDraftChanged: ({ value }) => [{ ...model, draft: value }, []],
      ProjectCreateClicked: ({ orgId }) => {
        const name = model.draft.trim();
        return name.length === 0
          ? [model, []]
          : [
              { ...model, draft: "", status: { ...model.status, creatingProject: true }, error: null },
              [createProject(orgId, name)],
            ];
      },
      ProjectSelected: ({ id }) => [
        {
          ...model,
          projects: model.projects.map((item) => ({ ...item, status: item.project.id === id ? "selected" : "idle" })),
        },
        [],
      ],
      ProjectLoaded: ({ projects }) => [
        {
          ...model,
          projects: projects.map((project) => ({ project, status: "idle" })),
          status: { ...model.status, loadingProjects: false },
          error: null,
        },
        [],
      ],
      ProjectCreated: ({ project }) => [
        {
          ...model,
          projects: [
            ...model.projects.map((item) => ({ ...item, status: "idle" as const })),
            { project, status: "selected" },
          ],
          status: { ...model.status, creatingProject: false },
          error: null,
        },
        [],
      ],
      ProjectFailed: ({ message }) => [{ ...model, status: idleStatus, error: message }, []],
    }),
  );
