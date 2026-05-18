import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import { Command } from "foldkit";
import { taskRpc } from "../../rpc";
import { TaskCreated, TaskFailed, TaskStatusUpdated } from "./task.message";

const TaskCommandCreate = Command.define("TaskCommandCreate", TaskCreated, TaskFailed);
const TaskCommandUpdateStatus = Command.define("TaskCommandUpdateStatus", TaskStatusUpdated, TaskFailed);

export const createTask = (input: { readonly tenantId: string; readonly userId: string; readonly title: string }) =>
  TaskCommandCreate(
    taskRpc.create({ ...input, clientMutationId: crypto.randomUUID() }).pipe(
      Effect.map((task) => TaskCreated({ task })),
      Effect.catchCause((cause) => Effect.succeed(TaskFailed({ message: Cause.pretty(cause) }))),
    ),
  );

export const updateTaskStatus = (input: Parameters<typeof taskRpc.updateStatus>[0]) =>
  TaskCommandUpdateStatus(
    taskRpc.updateStatus(input).pipe(
      Effect.map((task) => TaskStatusUpdated({ task })),
      Effect.catchCause((cause) => Effect.succeed(TaskFailed({ message: Cause.pretty(cause) }))),
    ),
  );
