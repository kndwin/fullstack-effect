import { Schema } from "effect";
import { PopoverMessage } from "@qaveai/client-ds/popover";
import { m } from "foldkit/message";
import { AuthMessage } from "../module/auth/auth.message";
import { ChannelMessage } from "../module/channel/channel.message";
import { OrgMessage } from "../module/org/org.message";
import { TaskMessage } from "../module/task/task.message";
import { RouteMessage } from "./route.message";

export const GotChannelMessage = m("GotChannelMessage", { message: ChannelMessage });
export const GotTaskMessage = m("GotTaskMessage", { message: TaskMessage });
export const GotAuthMessage = m("GotAuthMessage", { message: AuthMessage });
export const GotOrgMessage = m("GotOrgMessage", { message: OrgMessage });
export const ToggledSidebarCollapsed = m("ToggledSidebarCollapsed");
export const GotUserPopoverMessage = m("GotUserPopoverMessage", { message: PopoverMessage });

export const AppMessage = Schema.Union([
  RouteMessage,
  ToggledSidebarCollapsed,
  GotUserPopoverMessage,
  GotChannelMessage,
  GotTaskMessage,
  GotAuthMessage,
  GotOrgMessage,
]);
export type AppMessage = typeof AppMessage.Type;
