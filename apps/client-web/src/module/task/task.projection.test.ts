import { describe, expect, test } from "bun:test";
import type { TaskCreatedPayload, TaskStatusUpdatedPayload } from "@qaveai/shared/module/task/task.schema";
import type { SyncEvent } from "@qaveai/sync/shared/sync-event.schema";
import { emptyTaskModel } from "./task.model";
import { applyTaskEvent } from "./task.projection";
import { createLocalStorageTaskProjectionStore } from "./task.projection.store";

const createdEvent = {
  tenantId: "tenant_1",
  userId: "user_1",
  seq: 1,
  domain: "tasks",
  type: "task.created",
  visibility: { type: "tenant" },
  aggregateType: "task",
  aggregateId: "task_1",
  payload: {
    task: {
      tenantId: "tenant_1",
      id: "task_1",
      title: "Verify task projection",
      status: "todo",
      createdByUserId: "user_1",
      createdAt: "2026-05-10T00:00:00.000Z",
      updatedAt: "2026-05-10T00:00:00.000Z",
    },
  },
  createdAt: "2026-05-10T00:00:00.000Z",
} satisfies SyncEvent;

describe("task projection", () => {
  test("applies task.created idempotently", () => {
    const model = emptyTaskModel("tenant_1");
    const once = applyTaskEvent(model, createdEvent);
    const twice = applyTaskEvent(once, createdEvent);

    expect(twice.tasks).toHaveLength(1);
    expect(twice.tasks[0]?.title).toBe("Verify task projection");
    expect(twice.lastAppliedSeq).toBe(1);
  });

  test("applies task.status.updated", () => {
    const created = applyTaskEvent(emptyTaskModel("tenant_1"), createdEvent);
    const statusUpdated = {
      ...createdEvent,
      seq: 2,
      type: "task.status.updated",
      payload: {
        taskId: "task_1",
        status: "done",
        updatedAt: "2026-05-10T00:01:00.000Z",
      },
    } satisfies SyncEvent;

    const updated = applyTaskEvent(created, statusUpdated);

    expect(updated.tasks[0]?.status).toBe("done");
    expect(updated.lastAppliedSeq).toBe(2);
  });

  test("ignores events for other tenants", () => {
    const updated = applyTaskEvent(emptyTaskModel("tenant_2"), createdEvent);

    expect(updated.tasks).toEqual([]);
    expect(updated.lastAppliedSeq).toBe(0);
  });

  test("rehydrates tenant-local projection from durable storage", async () => {
    const storage = createMemoryStorage();
    const store = createLocalStorageTaskProjectionStore({ storage });
    const tenantOne = applyTaskEvent(emptyTaskModel("tenant_1"), createdEvent);

    await store.setModel(tenantOne);

    expect(await store.getModel("tenant_1")).toEqual(tenantOne);
    expect(await store.getModel("tenant_2")).toEqual(emptyTaskModel("tenant_2"));
  });
});

const createMemoryStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  } satisfies Pick<Storage, "getItem" | "setItem" | "removeItem">;
};
