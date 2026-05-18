import { Effect, Match } from "effect";
import { initPopover, updatePopover } from "@qaveai/client-ds/popover";
import { Command } from "foldkit";
import type { Url } from "foldkit/url";
import { toString as urlToString } from "foldkit/url";
import type { AuthMessage } from "../module/auth/auth.message";
import { init as initAuth, update as updateAuth } from "../module/auth/auth.update";
import { emptyChannelModel } from "../module/channel/channel.model";
import type { ChannelMessage } from "../module/channel/channel.message";
import { update as updateChannel } from "../module/channel/channel.update";
import { OrgStarted, type OrgMessage } from "../module/org/org.message";
import { init as initOrg, selectedOrgId, update as updateOrg } from "../module/org/org.update";
import { emptyTaskModel } from "../module/task/task.model";
import type { TaskMessage } from "../module/task/task.message";
import { update as updateTask } from "../module/task/task.update";
import { loadExternal, navigateInternal } from "./route.command";
import { ChangedUrl } from "./route.message";
import { urlToAppRoute } from "./route";
import type { AppModel } from "./app.model";
import {
  AppMessage,
  GotAuthMessage,
  GotChannelMessage,
  GotOrgMessage,
  GotTaskMessage,
  GotUserPopoverMessage,
} from "./app.message";

const taskModel = (tenantId: string) => ({ ...emptyTaskModel(tenantId), draft: "", error: null });

const delegateTask = (
  model: AppModel,
  message: TaskMessage,
): readonly [AppModel, ReadonlyArray<Command.Command<AppMessage>>] => {
  const [task, commands] = updateTask(model.task, message);

  return [{ ...model, task }, commands.map(Command.mapEffect(Effect.map((message) => GotTaskMessage({ message }))))];
};

const delegateChannel = (
  model: AppModel,
  message: ChannelMessage,
): readonly [AppModel, ReadonlyArray<Command.Command<AppMessage>>] => {
  const [channel, commands] = updateChannel(model.channel, message);

  return [
    { ...model, channel },
    commands.map(Command.mapEffect(Effect.map((message) => GotChannelMessage({ message })))),
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
    return [
      { ...model, org, channel: emptyChannelModel(orgId), task: taskModel(orgId) },
      commands.map(Command.mapEffect(Effect.map((message) => GotOrgMessage({ message })))),
    ];
  }

  return [{ ...model, org }, commands.map(Command.mapEffect(Effect.map((message) => GotOrgMessage({ message }))))];
};

export const init = () => {
  const [auth, authCommands] = initAuth();
  const [org] = initOrg();

  return [
    {
      route: { _tag: "ChannelList" as const },
      isSidebarCollapsed: false,
      userPopover: initPopover({ id: "app-user-popover" }),
      auth,
      org,
      channel: emptyChannelModel("tenant_dev"),
      task: taskModel("tenant_dev"),
    },
    [...authCommands.map(Command.mapEffect(Effect.map((message) => GotAuthMessage({ message }))))],
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
            Internal: ({ url }): readonly [AppModel, ReadonlyArray<Command.Command<AppMessage>>] => {
              const href = urlToString(url);
              return href.startsWith("/auth/") ? [model, [loadExternal(href)]] : [model, [navigateInternal(url)]];
            },
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
      GotChannelMessage: ({ message }) => delegateChannel(model, message),
      GotTaskMessage: ({ message }) => delegateTask(model, message),
      GotAuthMessage: ({ message }) => delegateAuth(model, message),
      GotOrgMessage: ({ message }) => delegateOrg(model, message),
    }),
  );

export const onUrlChange = (url: Url) => ChangedUrl({ url });
