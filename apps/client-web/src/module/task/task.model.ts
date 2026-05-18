import { TaskSchema } from "@qaveai/shared/module/task/task.schema";
import { Schema } from "effect";

export const TaskModel = Schema.Struct({
  tenantId: Schema.String,
  tasks: Schema.Array(TaskSchema),
  lastAppliedSeq: Schema.Number,
});
export type TaskModel = typeof TaskModel.Type;

export const emptyTaskModel = (tenantId: string): TaskModel => ({ tenantId, tasks: [], lastAppliedSeq: 0 });
