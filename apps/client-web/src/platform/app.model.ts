import { Schema } from "effect";
import { PopoverModel } from "@qaveai/client-ds/popover";
import { AuthModel } from "../module/auth/auth.model";
import { ChannelModel } from "../module/channel/channel.model";
import { OrgModel } from "../module/org/org.model";
import { TaskSchema } from "@qaveai/shared/module/task/task.schema";
import { AppRoute } from "./route";

export const AppTaskModel = Schema.Struct({
  tenantId: Schema.String,
  tasks: Schema.Array(TaskSchema),
  lastAppliedSeq: Schema.Number,
  draft: Schema.String,
  error: Schema.NullOr(Schema.String),
});
export type AppTaskModel = typeof AppTaskModel.Type;

export const AppModel = Schema.Struct({
  route: AppRoute,
  isSidebarCollapsed: Schema.Boolean,
  userPopover: PopoverModel,
  auth: AuthModel,
  org: OrgModel,
  channel: ChannelModel,
  task: AppTaskModel,
});
export type AppModel = typeof AppModel.Type;
