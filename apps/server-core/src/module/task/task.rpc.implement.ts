import { TaskCreatedPayload } from "@qaveai/shared/module/task/task.schema";
import { TaskRpcs } from "@qaveai/shared/module/task/task.rpc.interface";
import { Effect, Layer, Schema } from "effect";
import { SyncStoreSqlLive } from "../sync/sync.repo.implement";
import { TaskServiceLive } from "./task.service.implement";
import { TaskService } from "./task.service.interface";

export const TaskRpcLive = TaskRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* TaskService;

    return TaskRpcs.of({
      TaskCreate: ({ tenantId, userId, title, clientMutationId }) =>
        service.createTask({ ctx: { tenantId, userId }, title, clientMutationId }).pipe(
          Effect.map((result) => Schema.decodeUnknownSync(TaskCreatedPayload)(result.result.payload).task),
          Effect.orDie,
        ),
      TaskUpdateStatus: ({ tenantId, userId, taskId, status }) =>
        service.updateTaskStatus({ ctx: { tenantId, userId }, taskId, status }).pipe(
          Effect.map((task) => ({
            ...task,
            createdAt: task.createdAt.toISOString(),
            updatedAt: task.updatedAt.toISOString(),
          })),
          Effect.orDie,
        ),
    });
  }),
).pipe(Layer.provide([TaskServiceLive, SyncStoreSqlLive]));
