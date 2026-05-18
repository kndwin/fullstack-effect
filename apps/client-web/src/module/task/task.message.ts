import { TaskSchema, TaskStatus } from "@qaveai/shared/module/task/task.schema";
import { Schema } from "effect";
import { m } from "foldkit/message";

export const TaskDraftChanged = m("TaskDraftChanged", { value: Schema.String });
export const TaskCreateClicked = m("TaskCreateClicked", { tenantId: Schema.String, userId: Schema.String });
export const TaskStatusClicked = m("TaskStatusClicked", {
  tenantId: Schema.String,
  userId: Schema.String,
  taskId: Schema.String,
  status: TaskStatus,
});
export const TaskCreated = m("TaskCreated", { task: TaskSchema });
export const TaskStatusUpdated = m("TaskStatusUpdated", { task: TaskSchema });
export const TaskFailed = m("TaskFailed", { message: Schema.String });

export const TaskMessage = Schema.Union([
  TaskDraftChanged,
  TaskCreateClicked,
  TaskStatusClicked,
  TaskCreated,
  TaskStatusUpdated,
  TaskFailed,
]);
export type TaskMessage = typeof TaskMessage.Type;
