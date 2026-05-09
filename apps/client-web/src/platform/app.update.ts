import { Effect, Match } from "effect";
import { initPopover, updatePopover } from "@qaveai/client-ds/popover";
import { Command } from "foldkit";
import type { Url } from "foldkit/url";
import type { AuthMessage } from "../module/auth/auth.message";
import { init as initAuth, update as updateAuth } from "../module/auth/auth.update";
import { OrgStarted, type OrgMessage } from "../module/org/org.message";
import { init as initOrg, selectedOrgId, update as updateOrg } from "../module/org/org.update";
import { ProjectStarted } from "../module/project/project.message";
import type { ProjectMessage } from "../module/project/project.message";
import { init as initProject, update as updateProject } from "../module/project/project.update";
import type { TodoMessage } from "../module/todo/todo.message";
import { init as initTodo, update as updateTodo } from "../module/todo/todo.update";
import { loadExternal, navigateInternal } from "./route.command";
import { ChangedUrl } from "./route.message";
import { urlToAppRoute } from "./route";
import type { AppModel } from "./app.model";
import {
  AppMessage,
  GotAuthMessage,
  GotOrgMessage,
  GotProjectMessage,
  GotTodoMessage,
  GotUserPopoverMessage,
} from "./app.message";

const delegateTodo = (
  model: AppModel,
  message: TodoMessage,
): readonly [AppModel, ReadonlyArray<Command.Command<AppMessage>>] => {
  const [todo, commands] = updateTodo(model.todo, message);

  return [{ ...model, todo }, commands.map(Command.mapEffect(Effect.map((message) => GotTodoMessage({ message }))))];
};

const delegateProject = (
  model: AppModel,
  message: ProjectMessage,
): readonly [AppModel, ReadonlyArray<Command.Command<AppMessage>>] => {
  const [project, commands] = updateProject(model.project, message);

  return [
    { ...model, project },
    commands.map(Command.mapEffect(Effect.map((message) => GotProjectMessage({ message })))),
  ];
};

const delegateAuth = (
  model: AppModel,
  message: AuthMessage,
): readonly [AppModel, ReadonlyArray<Command.Command<AppMessage>>] => {
  const [auth, commands] = updateAuth(model.auth, message);
  if (message._tag === "AuthLoaded" && message.session) {
    const [org, orgCommands] = updateOrg(model.org, OrgStarted());
    return [
      { ...model, auth, org },
      [
        ...commands.map(Command.mapEffect(Effect.map((message) => GotAuthMessage({ message })))),
        ...orgCommands.map(Command.mapEffect(Effect.map((message) => GotOrgMessage({ message })))),
      ],
    ];
  }

  return [{ ...model, auth }, commands.map(Command.mapEffect(Effect.map((message) => GotAuthMessage({ message }))))];
};

const delegateOrg = (
  model: AppModel,
  message: OrgMessage,
): readonly [AppModel, ReadonlyArray<Command.Command<AppMessage>>] => {
  const [org, commands] = updateOrg(model.org, message);
  const orgId = selectedOrgId(org);
  if (orgId && (message._tag === "OrgLoaded" || message._tag === "OrgSelected" || message._tag === "OrgCreated")) {
    const [project, projectCommands] = updateProject(model.project, ProjectStarted({ orgId }));
    return [
      { ...model, org, project },
      [
        ...commands.map(Command.mapEffect(Effect.map((message) => GotOrgMessage({ message })))),
        ...projectCommands.map(Command.mapEffect(Effect.map((message) => GotProjectMessage({ message })))),
      ],
    ];
  }

  return [{ ...model, org }, commands.map(Command.mapEffect(Effect.map((message) => GotOrgMessage({ message }))))];
};

export const init = (url: Url) => {
  const [todo, commands] = initTodo();
  const [project] = initProject();
  const [auth, authCommands] = initAuth();
  const [org] = initOrg();

  return [
    {
      route: urlToAppRoute(url),
      isSidebarCollapsed: false,
      userPopover: initPopover({ id: "app-user-popover" }),
      auth,
      org,
      project,
      todo,
    },
    [
      ...commands.map(Command.mapEffect(Effect.map((message) => GotTodoMessage({ message })))),
      ...authCommands.map(Command.mapEffect(Effect.map((message) => GotAuthMessage({ message })))),
    ],
  ] as const;
};

export const update = (
  model: AppModel,
  message: AppMessage,
): readonly [AppModel, ReadonlyArray<Command.Command<AppMessage>>] =>
  Match.value(message).pipe(
    Match.withReturnType<readonly [AppModel, ReadonlyArray<Command.Command<AppMessage>>]>(),
    Match.tagsExhaustive({
      ClickedLink: ({ request }) =>
        Match.value(request).pipe(
          Match.tagsExhaustive({
            Internal: ({ url }): readonly [AppModel, ReadonlyArray<Command.Command<AppMessage>>] => [
              model,
              [navigateInternal(url)],
            ],
            External: ({ href }): readonly [AppModel, ReadonlyArray<Command.Command<AppMessage>>] => [
              model,
              [loadExternal(href)],
            ],
          }),
        ),
      ChangedUrl: ({ url }) => [{ ...model, route: urlToAppRoute(url) }, []],
      ToggledSidebarCollapsed: () => [{ ...model, isSidebarCollapsed: !model.isSidebarCollapsed }, []],
      GotUserPopoverMessage: ({ message }) => {
        const [userPopover, commands] = updatePopover(model.userPopover, message);
        return [
          { ...model, userPopover },
          commands.map(Command.mapEffect(Effect.map((message) => GotUserPopoverMessage({ message })))),
        ];
      },
      CompletedNavigateInternal: () => [model, []],
      CompletedLoadExternal: () => [model, []],
      GotTodoMessage: ({ message }) => delegateTodo(model, message),
      GotProjectMessage: ({ message }) => delegateProject(model, message),
      GotAuthMessage: ({ message }) => delegateAuth(model, message),
      GotOrgMessage: ({ message }) => delegateOrg(model, message),
    }),
  );

export const onUrlChange = (url: Url) => ChangedUrl({ url });
