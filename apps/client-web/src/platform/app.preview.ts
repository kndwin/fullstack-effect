import { initPopover } from "@qaveai/client-ds/popover";
import { Preview } from "@qaveai/foldkit-preview";
import { Schema } from "effect";
import { html } from "foldkit/html";
import { AuthLoaded } from "../module/auth/auth.message";
import { ChannelListRoute } from "../module/channel/channel.route";
import { OrgLoaded, OrgSelected } from "../module/org/org.message";
import { TaskDraftChanged } from "../module/task/task.message";
import { TaskListRoute } from "../module/task/task.route";
import { AppModel, type AppModel as AppModelType } from "./app.model";
import { AppMessage, GotAuthMessage, GotOrgMessage, GotTaskMessage, ToggledSidebarCollapsed } from "./app.message";
import { update as updateApp } from "./app.update";
import { view } from "./app.view";

const session = { user: { id: "user_preview_123", email: "ada@example.com", name: "Ada Lovelace", avatarUrl: null } };
const org = { id: "org_acme", name: "Acme" };
const task = {
  id: "task_a",
  tenantId: org.id,
  title: "Verify synced task shell",
  status: "todo" as const,
  createdByUserId: session.user.id,
  createdAt: "2026-05-10T00:00:00.000Z",
  updatedAt: "2026-05-10T00:00:00.000Z",
};

const appModel = (route: AppModelType["route"], signedIn = true): AppModelType => ({
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
  channel: {
    tenantId: org.id,
    channels: [
      {
        id: "chn_general",
        tenantId: org.id,
        name: "General",
        createdByUserId: session.user.id,
        createdAt: "2026-05-10T00:00:00.000Z",
        updatedAt: "2026-05-10T00:00:00.000Z",
      },
      {
        id: "chn_sync",
        tenantId: org.id,
        name: "Sync",
        createdByUserId: session.user.id,
        createdAt: "2026-05-10T00:00:00.000Z",
        updatedAt: "2026-05-10T00:00:00.000Z",
      },
    ],
    draft: "",
    error: null,
  },
  task: { tenantId: org.id, tasks: [task], lastAppliedSeq: 1, draft: "", error: null },
});

export const AppPreview = Preview.module({
  title: "Platform/App",
  previews: [
    Preview.preview({
      name: "States",
      view: () => {
        const { div, h2, Class } = html<typeof AppMessage.Type>();
        const example = (label: string, model: AppModelType) =>
          div([Class("grid gap-2")], [h2([Class("text-base font-medium")], [label]), view(model).body]);

        return div(
          [Class("grid gap-6")],
          [
            example("Channels", appModel(ChannelListRoute())),
            example("Tasks", appModel(TaskListRoute())),
            example("Signed out", appModel(ChannelListRoute(), false)),
          ],
        );
      },
    }),
    Preview.preview({
      name: "Interactive",
      init: (): AppModelType => appModel(ChannelListRoute()),
      update: updateApp,
      view: (model: AppModelType) => view(model).body,
      scenarios: [
        Preview.scenario("Task draft", [GotTaskMessage({ message: TaskDraftChanged({ value: "Write channel RPC" }) })]),
        Preview.scenario("Collapsed sidebar", [ToggledSidebarCollapsed()]),
        Preview.scenario("Reload orgs", [
          GotAuthMessage({ message: AuthLoaded({ session }) }),
          GotOrgMessage({ message: OrgLoaded({ orgs: [org] }) }),
          GotOrgMessage({ message: OrgSelected({ id: org.id }) }),
        ]),
      ],
    }),
  ],
});

export const Model = AppModel;
export const Message = Schema.Union([AppMessage]);
