import { Schema } from "effect";
import { PopoverMessage } from "@qaveai/client-ds/popover";
import { m } from "foldkit/message";
import { AuthMessage } from "../module/auth/auth.message";
import { OrgMessage } from "../module/org/org.message";
import { ProjectMessage } from "../module/project/project.message";
import { TodoMessage } from "../module/todo/todo.message";
import { RouteMessage } from "./route.message";

export const GotTodoMessage = m("GotTodoMessage", { message: TodoMessage });
export const GotProjectMessage = m("GotProjectMessage", { message: ProjectMessage });
export const GotAuthMessage = m("GotAuthMessage", { message: AuthMessage });
export const GotOrgMessage = m("GotOrgMessage", { message: OrgMessage });
export const ToggledSidebarCollapsed = m("ToggledSidebarCollapsed");
export const GotUserPopoverMessage = m("GotUserPopoverMessage", { message: PopoverMessage });

export const AppMessage = Schema.Union([
  RouteMessage,
  ToggledSidebarCollapsed,
  GotUserPopoverMessage,
  GotTodoMessage,
  GotProjectMessage,
  GotAuthMessage,
  GotOrgMessage,
]);
export type AppMessage = typeof AppMessage.Type;
