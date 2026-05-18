import { TaskCreatedPayload, TaskStatusUpdatedPayload } from "@qaveai/shared/module/task/task.schema";
import type { SyncEvent } from "@qaveai/sync/shared/sync-event.schema";
import { Schema } from "effect";
import type { TaskModel } from "./task.model";

export const applyTaskEvent = (model: TaskModel, event: SyncEvent): TaskModel => {
  if (event.tenantId !== model.tenantId || event.domain !== "tasks") return model;

  switch (event.type) {
    case "task.created": {
      const payload = Schema.decodeUnknownSync(TaskCreatedPayload)(event.payload);
      const existing = model.tasks.some((task) => task.id === payload.task.id);
      return {
        ...model,
        tasks: existing
          ? model.tasks.map((task) => (task.id === payload.task.id ? payload.task : task))
          : [...model.tasks, payload.task],
        lastAppliedSeq: Math.max(model.lastAppliedSeq, event.seq),
      };
    }
    case "task.status.updated": {
      const payload = Schema.decodeUnknownSync(TaskStatusUpdatedPayload)(event.payload);
      return {
        ...model,
        tasks: model.tasks.map((task) =>
          task.id === payload.taskId ? { ...task, status: payload.status, updatedAt: payload.updatedAt } : task,
        ),
        lastAppliedSeq: Math.max(model.lastAppliedSeq, event.seq),
      };
    }
    default:
      return model;
  }
};
