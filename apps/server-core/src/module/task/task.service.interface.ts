import type { SyncEvent } from "@qaveai/sync/shared/sync-event.schema";
import type { ClientMutationResult } from "@qaveai/sync/server/sync.service.interface";
import { Context, Effect } from "effect";
import type { TaskRow } from "./task.repo.interface";
import type { TaskCreateInput, TaskUpdateStatusInput } from "./task.service.schema";

export type TaskServiceShape = {
  readonly createTask: (input: TaskCreateInput) => Effect.Effect<ClientMutationResult<SyncEvent>, unknown>;
  readonly updateTaskStatus: (input: TaskUpdateStatusInput) => Effect.Effect<TaskRow, unknown>;
};

export class TaskService extends Context.Service<TaskService>()("TaskService", {
  make: Effect.succeed({} as TaskServiceShape),
}) {}
