import { Preview } from "@qaveai/foldkit-preview";
import { initPopover } from "@qaveai/client-ds/popover";
import { Schema } from "effect";
import { html } from "foldkit/html";
import { AuthFailed, AuthLoaded, AuthLoggedOut, AuthMessage, AuthStarted } from "../module/auth/auth.message";
import { OrgCreated, OrgFailed, OrgLoaded, OrgMessage, OrgSelected, OrgStarted } from "../module/org/org.message";
import {
  ProjectCreated,
  ProjectFailed,
  ProjectLoaded,
  ProjectMessage,
  ProjectSelected,
  ProjectStarted,
} from "../module/project/project.message";
import { ProjectDetailRoute, ProjectListRoute, ProjectTodoDetailRoute } from "../module/project/project.route";
import {
  TodoAddClicked,
  TodoCreated,
  TodoDeleted,
  TodoDeleteClicked,
  TodoDraftChanged,
  TodoFailed,
  TodoLoaded,
  TodoMessage,
  TodoStarted,
  TodoToggleClicked,
  TodoToggled,
} from "../module/todo/todo.message";
import { TodoListRoute } from "../module/todo/todo.route";
import type { AppModel } from "./app.model";
import {
  AppMessage,
  GotAuthMessage,
  GotOrgMessage,
  GotProjectMessage,
  GotTodoMessage,
  ToggledSidebarCollapsed,
} from "./app.message";
import { update as updateApp } from "./app.update";
import { NotFoundRoute } from "./route";
import { ChangedUrl, ClickedLink } from "./route.message";
import { view } from "./app.view";

const session = { user: { id: "user_preview_123", email: "ada@example.com", name: "Ada Lovelace", avatarUrl: null } };
const org = { id: "org_acme", name: "Acme" };
const projectA = { id: "prj_inbox", orgId: org.id, name: "Inbox" };
const projectB = { id: "prj_client", orgId: org.id, name: "Client UI" };
const todoA = { id: "todo_a", projectId: "prj_inbox", title: "Triage inbox", completed: false };
const todoB = { id: "todo_b", projectId: projectB.id, title: "Preview project detail", completed: true };

const appModel = (route: AppModel["route"], signedIn = true): AppModel => ({
  route,
  isSidebarCollapsed: false,
  userPopover: initPopover({ id: "app-preview-user-popover" }),
  auth: { session: signedIn ? session : null, loading: false, error: null },
  org: {
    draft: "",
    orgs: [{ org, status: "selected" }],
    status: { loadingOrgs: false, creatingOrg: false },
    error: null,
  },
  project: {
    draft: "",
    projects: [projectA, projectB].map((project, index) => ({ project, status: index === 0 ? "selected" : "idle" })),
    status: { loadingProjects: false, creatingProject: false },
    error: null,
  },
  todo: {
    draft: "",
    todos: [todoA, todoB].map((todo) => ({ todo, status: "idle" })),
    status: { loadingTodos: false, creatingTodo: false },
    error: null,
  },
});

const updatePreview = (model: AppModel, message: typeof AppMessage.Type): ReturnType<typeof updateApp> => {
  if (message._tag === "ClickedLink" && message.request._tag === "Internal") {
    return updateApp(model, ChangedUrl({ url: message.request.url }));
  }

  return updateApp(model, message);
};

export const AppPreview = Preview.module({
  title: "Platform/App",
  previews: [
    Preview.preview({
      name: "States",
      view: () => {
        const { div, h2, Class } = html<typeof AppMessage.Type>();
        const example = (label: string, model: AppModel) =>
          div(
            [Class("grid gap-3")],
            [h2([Class("text-sm font-medium text-muted-foreground")], [label]), view(model).body],
          );

        return div(
          [Class("grid w-[min(56rem,calc(100vw-4rem))] gap-10")],
          [
            example("Signed out", appModel(TodoListRoute(), false)),
            example("Todos", appModel(TodoListRoute())),
            example("Projects", appModel(ProjectListRoute())),
            example("Project detail", appModel(ProjectDetailRoute({ projectId: projectB.id }))),
            example("Todo detail", appModel(ProjectTodoDetailRoute({ projectId: projectB.id, todoId: todoB.id }))),
            example("Not found", appModel(NotFoundRoute({ path: "/missing" }))),
          ],
        );
      },
    }),
    Preview.preview({
      name: "Replay",
      init: (): AppModel => appModel(TodoListRoute()),
      update: updatePreview,
      view: (model: AppModel) => view(model).body,
      routing: { onUrlRequest: (request) => ClickedLink({ request }) },
      scenarios: [
        Preview.scenario("Collapse and expand sidebar", [ToggledSidebarCollapsed(), ToggledSidebarCollapsed()]),
        Preview.scenario("Collapse sidebar", [ToggledSidebarCollapsed()]),
        Preview.scenario("Kitchen sink", [
          ToggledSidebarCollapsed(),
          GotAuthMessage({ message: AuthStarted() }),
          Preview.step(GotAuthMessage({ message: AuthLoaded({ session }) }), { delayMs: 500 }),
          GotOrgMessage({ message: OrgStarted() }),
          Preview.step(GotOrgMessage({ message: OrgLoaded({ orgs: [org] }) }), { delayMs: 400 }),
          GotOrgMessage({ message: OrgCreated({ org: { id: "org_ops", name: "Ops" } }) }),
          GotOrgMessage({ message: OrgSelected({ id: org.id }) }),
          GotProjectMessage({ message: ProjectStarted({ orgId: org.id }) }),
          Preview.step(GotProjectMessage({ message: ProjectLoaded({ projects: [projectA, projectB] }) }), {
            delayMs: 400,
          }),
          GotProjectMessage({ message: ProjectSelected({ id: projectB.id }) }),
          GotProjectMessage({
            message: ProjectCreated({ project: { id: "prj_mobile", orgId: org.id, name: "Mobile" } }),
          }),
          GotTodoMessage({ message: TodoStarted() }),
          Preview.step(GotTodoMessage({ message: TodoLoaded({ todos: [todoA, todoB] }) }), { delayMs: 400 }),
          GotTodoMessage({ message: TodoDraftChanged({ value: "Rehearse full app flow" }) }),
          GotTodoMessage({ message: TodoAddClicked({ projectId: projectB.id }) }),
          Preview.step(
            GotTodoMessage({
              message: TodoCreated({
                todo: {
                  id: "todo_kitchen_sink",
                  projectId: projectB.id,
                  title: "Rehearse full app flow",
                  completed: false,
                },
              }),
            }),
            { delayMs: 500 },
          ),
          GotTodoMessage({ message: TodoToggleClicked({ id: todoA.id }) }),
          GotTodoMessage({ message: TodoToggled({ todo: { ...todoA, completed: true } }) }),
          GotTodoMessage({ message: TodoDeleteClicked({ id: todoB.id }) }),
          Preview.step(GotTodoMessage({ message: TodoDeleted({ id: todoB.id }) }), { delayMs: 300 }),
          ToggledSidebarCollapsed(),
        ]),
      ],
      commandResolutions: {
        AuthCommandMe: [
          { label: "Resolve signed in", message: () => GotAuthMessage({ message: AuthLoaded({ session }) }) },
          { label: "Resolve signed out", message: () => GotAuthMessage({ message: AuthLoaded({ session: null }) }) },
          {
            label: "Resolve failed",
            message: () => GotAuthMessage({ message: AuthFailed({ message: "Mocked auth load failed." }) }),
          },
        ],
        AuthCommandLogout: [
          { label: "Resolve logged out", message: () => GotAuthMessage({ message: AuthLoggedOut() }) },
          {
            label: "Resolve failed",
            message: () => GotAuthMessage({ message: AuthFailed({ message: "Mocked logout failed." }) }),
          },
        ],
        OrgCommandLoad: [
          { label: "Resolve loaded", message: () => GotOrgMessage({ message: OrgLoaded({ orgs: [org] }) }) },
          {
            label: "Resolve failed",
            message: () => GotOrgMessage({ message: OrgFailed({ message: "Mocked org load failed." }) }),
          },
        ],
        OrgCommandCreate: [
          {
            label: "Resolve created",
            message: () => GotOrgMessage({ message: OrgCreated({ org: { id: "org_created", name: "Created org" } }) }),
          },
          {
            label: "Resolve failed",
            message: () => GotOrgMessage({ message: OrgFailed({ message: "Mocked org create failed." }) }),
          },
        ],
        ProjectCommandLoad: [
          {
            label: "Resolve loaded",
            message: () => GotProjectMessage({ message: ProjectLoaded({ projects: [projectA, projectB] }) }),
          },
          {
            label: "Resolve failed",
            message: () => GotProjectMessage({ message: ProjectFailed({ message: "Mocked project load failed." }) }),
          },
        ],
        ProjectCommandCreate: [
          {
            label: "Resolve created",
            message: () =>
              GotProjectMessage({
                message: ProjectCreated({ project: { id: "prj_created", orgId: org.id, name: "Created project" } }),
              }),
          },
          {
            label: "Resolve failed",
            message: () => GotProjectMessage({ message: ProjectFailed({ message: "Mocked project create failed." }) }),
          },
        ],
        TodoCommandLoad: [
          {
            label: "Resolve loaded",
            message: () => GotTodoMessage({ message: TodoLoaded({ todos: [todoA, todoB] }) }),
          },
          {
            label: "Resolve failed",
            message: () => GotTodoMessage({ message: TodoFailed({ message: "Mocked todo load failed." }) }),
          },
        ],
        TodoCommandCreate: [
          {
            label: "Resolve created",
            message: () =>
              GotTodoMessage({
                message: TodoCreated({
                  todo: { id: "todo_created", projectId: projectA.id, title: "Created from command", completed: false },
                }),
              }),
          },
          {
            label: "Resolve failed",
            message: () => GotTodoMessage({ message: TodoFailed({ message: "Mocked todo create failed." }) }),
          },
        ],
        TodoCommandToggle: [
          {
            label: "Resolve toggled",
            message: () => GotTodoMessage({ message: TodoToggled({ todo: { ...todoA, completed: true } }) }),
          },
          {
            label: "Resolve failed",
            message: () => GotTodoMessage({ message: TodoFailed({ message: "Mocked todo toggle failed." }) }),
          },
        ],
        TodoCommandDelete: [
          { label: "Resolve deleted", message: () => GotTodoMessage({ message: TodoDeleted({ id: todoA.id }) }) },
          {
            label: "Resolve failed",
            message: () => GotTodoMessage({ message: TodoFailed({ message: "Mocked todo delete failed." }) }),
          },
        ],
      },
    }),
  ],
});

export const Message = Schema.Union([AppMessage, AuthMessage, OrgMessage, ProjectMessage, TodoMessage]);
