import { Preview } from "@qaveai/foldkit-preview";
import { Schema } from "effect";
import { html } from "foldkit/html";
import { TodoMessage, TodoToggleClicked, TodoToggled } from "../todo/todo.message";
import type { TodoModel } from "../todo/todo.model";
import { projectDetailView, projectListView, projectTodoDetailView } from "./project.view";
import {
  ProjectCreateClicked,
  ProjectCreated,
  ProjectDraftChanged,
  ProjectFailed,
  ProjectLoaded,
  ProjectMessage,
  ProjectSelected,
  ProjectStarted,
} from "./project.message";
import type { ProjectModel } from "./project.model";
import { update } from "./project.update";

const orgId = "org_acme";
const projectA = { id: "prj_inbox", orgId, name: "Inbox" };
const projectB = { id: "prj_client", orgId, name: "Client UI" };
const projects = [projectA, projectB];
const todoA = { id: "todo_project", projectId: projectB.id, title: "Mock project detail", completed: false };
const todoB = { id: "todo_done", projectId: projectB.id, title: "Wire routes", completed: true };
const idleStatus = { loadingProjects: false, creatingProject: false };
const todoModel: TodoModel = {
  draft: "",
  todos: [todoA, todoB].map((todo) => ({ todo, status: "idle" })),
  status: { loadingTodos: false, creatingTodo: false },
  error: null,
};
const wrapProject = (message: typeof ProjectMessage.Type) => message;
const wrapTodo = (message: typeof TodoMessage.Type) => message;
const populatedModel: ProjectModel = {
  draft: "",
  projects: projects.map((project, index) => ({ project, status: index === 1 ? "selected" : "idle" })),
  status: idleStatus,
  error: null,
};

export const ProjectPreview = Preview.module({
  title: "Module/Project",
  previews: [
    Preview.preview({
      name: "States",
      view: () => {
        const { div, h2, Class } = html<typeof ProjectMessage.Type | typeof TodoMessage.Type>();
        const example = (label: string, view: ReturnType<typeof projectListView>) =>
          div([Class("grid gap-3")], [h2([Class("text-sm font-medium text-muted-foreground")], [label]), view]);

        return div(
          [Class("w-[min(42rem,calc(100vw-4rem))] grid gap-8")],
          [
            example("List", projectListView(populatedModel, orgId, wrapProject)),
            example(
              "Creating",
              projectListView(
                { ...populatedModel, status: { ...idleStatus, creatingProject: true } },
                orgId,
                wrapProject,
              ),
            ),
            example("Detail", projectDetailView(populatedModel, todoModel, projectB.id, wrapTodo)),
            example("Todo detail", projectTodoDetailView(populatedModel, todoModel, projectB.id, todoA.id, wrapTodo)),
            example("Not found", projectDetailView(populatedModel, todoModel, "missing", wrapTodo)),
          ],
        );
      },
    }),
    Preview.preview({
      name: "Replay",
      init: (): ProjectModel => ({
        draft: "",
        projects: [],
        status: { ...idleStatus, loadingProjects: true },
        error: null,
      }),
      update,
      view: (model: ProjectModel) => {
        const { div, Class } = html<typeof ProjectMessage.Type>();
        return div([Class("w-[min(42rem,calc(100vw-4rem))]")], [projectListView(model, orgId, wrapProject)]);
      },
      scenarios: [
        Preview.scenario("Load projects", [ProjectStarted({ orgId }), ProjectLoaded({ projects })]),
        Preview.scenario("Create project", [
          ProjectLoaded({ projects: [projectA] }),
          ProjectDraftChanged({ value: "Mobile" }),
          ProjectCreateClicked({ orgId }),
          ProjectCreated({ project: { id: "prj_mobile", orgId, name: "Mobile" } }),
        ]),
        Preview.scenario("Select project", [ProjectLoaded({ projects }), ProjectSelected({ id: projectB.id })]),
        Preview.scenario("Create failed", [
          ProjectLoaded({ projects }),
          ProjectDraftChanged({ value: "Bad project" }),
          ProjectCreateClicked({ orgId }),
          ProjectFailed({ message: "Project create failed." }),
        ]),
        Preview.scenario("Kitchen sink", [
          ProjectStarted({ orgId }),
          Preview.step(ProjectLoaded({ projects }), { delayMs: 400 }),
          ProjectSelected({ id: projectB.id }),
          ProjectDraftChanged({ value: "Mobile" }),
          ProjectCreateClicked({ orgId }),
          Preview.step(ProjectCreated({ project: { id: "prj_mobile", orgId, name: "Mobile" } }), { delayMs: 500 }),
          ProjectSelected({ id: projectA.id }),
          ProjectDraftChanged({ value: "Client UI" }),
          ProjectCreateClicked({ orgId }),
          Preview.step(ProjectFailed({ message: "Project name already exists." }), { delayMs: 500 }),
        ]),
      ],
      commandResolutions: {
        ProjectCommandLoad: [{ label: "Resolve loaded", message: () => ProjectLoaded({ projects }) }],
        ProjectCommandCreate: [
          {
            label: "Resolve created",
            message: () => ProjectCreated({ project: { id: "prj_created", orgId, name: "Created project" } }),
          },
          { label: "Resolve failed", message: () => ProjectFailed({ message: "Mocked project create failed." }) },
        ],
      },
    }),
  ],
});

export const Message = Schema.Union([ProjectMessage, TodoToggleClicked, TodoToggled]);
