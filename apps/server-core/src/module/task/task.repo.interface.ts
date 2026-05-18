import type { TaskStatus } from "@qaveai/shared/module/task/task.schema";
import { Context, Effect } from "effect";
import type { tasks } from "./task.table";

export type TaskRow = typeof tasks.$inferSelect;

export type TaskRepositoryShape = {
  readonly create: (input: {
    readonly tenantId: string;
    readonly userId: string;
    readonly title: string;
    readonly now: Date;
  }) => Effect.Effect<TaskRow, unknown>;
  readonly updateStatus: (input: {
    readonly tenantId: string;
    readonly taskId: string;
    readonly status: TaskStatus;
    readonly now: Date;
  }) => Effect.Effect<TaskRow, unknown>;
};

export class TaskRepository extends Context.Service<TaskRepository>()("TaskRepository", {
  make: Effect.succeed({} as TaskRepositoryShape),
}) {}
