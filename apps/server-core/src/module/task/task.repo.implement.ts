import { ErrorTaskInsertFailed, ErrorTaskNotFound } from "@qaveai/shared/module/task/task.schema";
import { and, eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { DB, PgLive } from "../../platform/db";
import { TaskRepository } from "./task.repo.interface";
import { tasks } from "./task.table";

const newTaskId = () => `tsk_${crypto.randomUUID()}`;

export const TaskRepositoryLive = Layer.effect(TaskRepository)(
  Effect.gen(function* () {
    const db = yield* DB;

    return TaskRepository.of({
      create: Effect.fn("TaskRepository.create")(function* (input) {
        const [task] = yield* db
          .insert(tasks)
          .values({
            tenantId: input.tenantId,
            id: newTaskId(),
            title: input.title,
            status: "todo",
            createdByUserId: input.userId,
            createdAt: input.now,
            updatedAt: input.now,
          })
          .returning();
        if (!task) return yield* new ErrorTaskInsertFailed({ message: "Task insert returned no rows" });
        return task;
      }),
      updateStatus: Effect.fn("TaskRepository.updateStatus")(function* (input) {
        const [task] = yield* db
          .update(tasks)
          .set({ status: input.status, updatedAt: input.now })
          .where(and(eq(tasks.tenantId, input.tenantId), eq(tasks.id, input.taskId)))
          .returning();
        if (!task) return yield* new ErrorTaskNotFound({ id: input.taskId });
        return task;
      }),
    });
  }),
).pipe(Layer.provide(PgLive));
