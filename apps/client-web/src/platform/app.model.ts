import { Schema } from "effect";
import { PopoverModel } from "@qaveai/client-ds/popover";
import { AuthModel } from "../module/auth/auth.model";
import { OrgModel } from "../module/org/org.model";
import { ProjectModel } from "../module/project/project.model";
import { TodoModel } from "../module/todo/todo.model";
import { AppRoute } from "./route";

export const AppModel = Schema.Struct({
  route: AppRoute,
  isSidebarCollapsed: Schema.Boolean,
  userPopover: PopoverModel,
  auth: AuthModel,
  org: OrgModel,
  project: ProjectModel,
  todo: TodoModel,
});
export type AppModel = typeof AppModel.Type;
