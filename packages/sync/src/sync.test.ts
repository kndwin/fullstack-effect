import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { createEventRouter } from "./client/event.router";
import { createSyncClient } from "./client/sync-client";
import type { CursorStore } from "./client/sync-cursor.store";
import { createInMemorySyncStore, SyncStoreMemoryLive } from "./server/sync.service.implement.memory";
import { SyncStore, type SyncTransaction } from "./server/sync.service.interface";
import { allowTenantEvents } from "./server/visibility.resolver.implement.allow-tenant";
import type { SyncEvent } from "./shared/sync-event.schema";
import type { TenantContext } from "./shared/tenant-context.schema";

const taskCreated = {
  tenantId: "tenant_1",
  userId: "user_1",
  seq: 1,
  domain: "tasks",
  type: "task.created",
  visibility: { type: "tenant" },
  aggregateType: "task",
  aggregateId: "task_1",
  payload: { taskId: "task_1", title: "Review sync plan" },
  createdAt: "2026-05-10T00:00:00.000Z",
} satisfies SyncEvent;

const channelMessageCreated = {
  tenantId: "tenant_1",
  userId: "user_1",
  seq: 2,
  domain: "channels",
  type: "channel.message.created",
  visibility: { type: "resource", resourceType: "channel", resourceId: "channel_1" },
  aggregateType: "message",
  aggregateId: "message_1",
  payload: {
    channelId: "channel_1",
    threadId: "thread_1",
    messageId: "message_1",
    content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hello" }] }] },
  },
  createdAt: "2026-05-10T00:00:01.000Z",
} satisfies SyncEvent;

describe("sync contract", () => {
  test("represents simple task and complex channel events without domain-specific core types", () => {
    expect(taskCreated.domain).toBe("tasks");
    expect(channelMessageCreated.domain).toBe("channels");
    expect(channelMessageCreated.visibility).toEqual({
      type: "resource",
      resourceType: "channel",
      resourceId: "channel_1",
    });
  });

  test("filters tenant events by tenant context", () => {
    expect(allowTenantEvents.canReadEvent({ tenantId: "tenant_1", userId: "user_2" }, taskCreated)).toBe(true);
    expect(allowTenantEvents.canReadEvent({ tenantId: "tenant_2", userId: "user_2" }, taskCreated)).toBe(false);
  });

  test("routes events by domain and advances cursor after successful dispatch", async () => {
    const applied: Array<string> = [];
    const cursors = new Map<string, number>();
    const cursorStore: CursorStore = {
      getCursor: async (tenantId) => {
        const lastSeq = cursors.get(tenantId);
        return lastSeq === undefined ? null : { tenantId, lastSeq };
      },
      setCursor: async (cursor) => {
        cursors.set(cursor.tenantId, cursor.lastSeq);
      },
    };
    const router = createEventRouter()
      .register("tasks", async (event) => {
        applied.push(event.type);
      })
      .register("channels", async (event) => {
        applied.push(event.type);
      });
    const client = createSyncClient({
      cursorStore,
      router,
      pullEvents: async ({ afterSeq }) => [taskCreated, channelMessageCreated].filter((event) => event.seq > afterSeq),
    });

    await client.applyPulledEvents("tenant_1");
    await client.applyPulledEvents("tenant_1");

    expect(applied).toEqual(["task.created", "channel.message.created"]);
    expect(cursors.get("tenant_1")).toBe(2);
  });

  test("allocates tenant-local sequences and pulls only the requested tenant", async () => {
    const store = createInMemorySyncStore();

    const firstTenantEvent = await Effect.runPromise(
      store.appendEvent(
        { tenantId: "tenant_1", userId: "user_1" },
        {
          domain: "tasks",
          type: "task.created",
          visibility: { type: "tenant" },
          aggregateType: "task",
          aggregateId: "task_1",
          payload: { taskId: "task_1" },
        },
      ),
    );
    const secondTenantEvent = await Effect.runPromise(
      store.appendEvent(
        { tenantId: "tenant_2", userId: "user_2" },
        {
          domain: "tasks",
          type: "task.created",
          visibility: { type: "tenant" },
          aggregateType: "task",
          aggregateId: "task_2",
          payload: { taskId: "task_2" },
        },
      ),
    );

    expect(firstTenantEvent.seq).toBe(1);
    expect(secondTenantEvent.seq).toBe(1);
    expect(
      await Effect.runPromise(store.pullEvents({ tenantId: "tenant_1", userId: "user_1" }, { afterSeq: 0, limit: 10 })),
    ).toEqual([firstTenantEvent]);
  });

  test("applies visibility filtering during pull", async () => {
    const store = createInMemorySyncStore();
    const ctx = { tenantId: "tenant_1", userId: "user_1" };
    const privateEvent = await Effect.runPromise(
      store.appendEvent(ctx, {
        domain: "channels",
        type: "channel.draft.updated",
        visibility: { type: "user", userId: "user_1" },
        aggregateType: "draft",
        aggregateId: "channel_1:thread_1:user_1",
        payload: { body: "private draft" },
      }),
    );

    const ownerEvents = await Effect.runPromise(
      store.pullEvents(
        ctx,
        { afterSeq: 0, limit: 10 },
        {
          canReadEvent: (reader: TenantContext, event: SyncEvent) =>
            event.visibility.type === "user" && event.visibility.userId === reader.userId,
        },
      ),
    );
    const otherUserEvents = await Effect.runPromise(
      store.pullEvents(
        { tenantId: "tenant_1", userId: "user_2" },
        { afterSeq: 0, limit: 10 },
        {
          canReadEvent: (reader: TenantContext, event: SyncEvent) =>
            event.visibility.type === "user" && event.visibility.userId === reader.userId,
        },
      ),
    );

    expect(ownerEvents).toEqual([privateEvent]);
    expect(otherUserEvents).toEqual([]);
  });

  test("replays completed client mutations without running the command twice", async () => {
    const store = createInMemorySyncStore();
    const ctx = { tenantId: "tenant_1", userId: "user_1" };
    let runCount = 0;
    const run = (tx: SyncTransaction) =>
      Effect.gen(function* () {
        runCount += 1;
        const event = yield* tx.appendEvent(ctx, {
          domain: "tasks",
          type: "task.created",
          visibility: { type: "tenant" },
          aggregateType: "task",
          aggregateId: "task_1",
          payload: { taskId: "task_1" },
        });

        return { result: event, resultEventSeq: event.seq };
      });
    const first = await Effect.runPromise(
      store.withClientMutation(
        ctx,
        { clientMutationId: "mutation_1", domain: "tasks", commandType: "createTask" },
        run,
      ),
    );
    const replay = await Effect.runPromise(
      store.withClientMutation(
        ctx,
        { clientMutationId: "mutation_1", domain: "tasks", commandType: "createTask" },
        run,
      ),
    );

    expect(runCount).toBe(1);
    expect(first.replayed).toBe(false);
    expect(replay.replayed).toBe(true);
    expect(replay.result).toEqual(first.result);
    expect(store.listEvents("tenant_1")).toHaveLength(1);
  });

  test("provides sync store as an Effect service layer", async () => {
    const event = await Effect.runPromise(
      Effect.gen(function* () {
        const store = yield* SyncStore;
        return yield* store.appendEvent(
          { tenantId: "tenant_1", userId: "user_1" },
          {
            domain: "tasks",
            type: "task.created",
            visibility: { type: "tenant" },
            aggregateType: "task",
            aggregateId: "task_1",
            payload: { taskId: "task_1" },
          },
        );
      }).pipe(Effect.provide(SyncStoreMemoryLive)),
    );

    expect(event.seq).toBe(1);
  });
});
