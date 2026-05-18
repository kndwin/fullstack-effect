import { Schema } from "effect";

export const TaskStatus = Schema.Union([Schema.Literal("todo"), Schema.Literal("in_progress"), Schema.Literal("done")]);
export type TaskStatus = typeof TaskStatus.Type;

export const TaskSchema = Schema.Struct({
  tenantId: Schema.String,
  id: Schema.String,
  title: Schema.String,
  status: TaskStatus,
  createdByUserId: Schema.String,
  createdAt: Schema.String,
  updatedAt: Schema.String,
});
export type Task = typeof TaskSchema.Type;

export const TaskCreatedPayload = Schema.Struct({
  task: TaskSchema,
});
export type TaskCreatedPayload = typeof TaskCreatedPayload.Type;

export const TaskStatusUpdatedPayload = Schema.Struct({
  taskId: Schema.String,
  status: TaskStatus,
  updatedAt: Schema.String,
});
export type TaskStatusUpdatedPayload = typeof TaskStatusUpdatedPayload.Type;

export class ErrorTaskInsertFailed extends Schema.TaggedErrorClass<ErrorTaskInsertFailed>()("ErrorTaskInsertFailed", {
  message: Schema.String,
}) {}

export class ErrorTaskNotFound extends Schema.TaggedErrorClass<ErrorTaskNotFound>()("ErrorTaskNotFound", {
  id: Schema.String,
}) {}

export class ErrorTaskTitleRequired extends Schema.TaggedErrorClass<ErrorTaskTitleRequired>()(
  "ErrorTaskTitleRequired",
  {
    message: Schema.String,
  },
) {}
