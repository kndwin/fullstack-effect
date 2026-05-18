import { ErrorTaskTitleRequired, type TaskCreatedPayload } from "@qaveai/shared/module/task/task.schema";
import { SyncStore } from "@qaveai/sync/server/sync.service.interface";
import { Effect, Layer } from "effect";
import { TaskRepository } from "./task.repo.interface";
import { TaskRepositoryLive } from "./task.repo.implement";
import { TaskService } from "./task.service.interface";

export const TaskServiceLive = Layer.effect(TaskService)(
  Effect.gen(function* () {
    const repo = yield* TaskRepository;
    const sync = yield* SyncStore;

    return TaskService.of({
      createTask: Effect.fn("TaskService.createTask")(function* (input) {
        const title = input.title.trim();
        if (title.length === 0) return yield* new ErrorTaskTitleRequired({ message: "Task title is required" });

        return yield* sync.withClientMutation(
          input.ctx,
          { clientMutationId: input.clientMutationId, domain: "tasks", commandType: "createTask" },
          (tx) =>
            Effect.gen(function* () {
              const now = new Date();
              const task = yield* repo.create({ tenantId: input.ctx.tenantId, userId: input.ctx.userId, title, now });
              const event = yield* tx.appendEvent(input.ctx, {
                domain: "tasks",
                type: "task.created",
                visibility: { type: "tenant" },
                aggregateType: "task",
                aggregateId: task.id,
                payload: {
                  task: {
                    ...task,
                    createdAt: task.createdAt.toISOString(),
                    updatedAt: task.updatedAt.toISOString(),
                  } satisfies TaskCreatedPayload["task"],
                },
              });

              return { result: event, resultEventSeq: event.seq };
            }),
        );
      }),
      updateTaskStatus: Effect.fn("TaskService.updateTaskStatus")(function* (input) {
        return yield* repo.updateStatus({
          tenantId: input.ctx.tenantId,
          taskId: input.taskId,
          status: input.status,
          now: new Date(),
        });
      }),
    });
  }),
).pipe(Layer.provide(TaskRepositoryLive));
