import { TaskStatus } from "@qaveai/shared/module/task/task.schema";
import { Schema } from "effect";

export const TaskCreateInput = Schema.Struct({
  ctx: Schema.Struct({ tenantId: Schema.String, userId: Schema.String }),
  title: Schema.String,
  clientMutationId: Schema.String,
});
export type TaskCreateInput = typeof TaskCreateInput.Type;

export const TaskUpdateStatusInput = Schema.Struct({
  ctx: Schema.Struct({ tenantId: Schema.String, userId: Schema.String }),
  taskId: Schema.String,
  status: TaskStatus,
});
export type TaskUpdateStatusInput = typeof TaskUpdateStatusInput.Type;
