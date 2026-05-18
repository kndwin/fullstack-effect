import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/unstable/rpc";
import { TaskSchema, TaskStatus } from "./task.schema";

export const TaskRpcs = RpcGroup.make(
  Rpc.make("TaskCreate", {
    success: TaskSchema,
    payload: {
      tenantId: Schema.String,
      userId: Schema.String,
      title: Schema.String,
      clientMutationId: Schema.String,
    },
  }),
  Rpc.make("TaskUpdateStatus", {
    success: TaskSchema,
    payload: {
      tenantId: Schema.String,
      userId: Schema.String,
      taskId: Schema.String,
      status: TaskStatus,
    },
  }),
);
