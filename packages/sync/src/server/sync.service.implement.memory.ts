import type { ClientMutation, ClientMutationInput } from "../shared/client-mutation.schema";
import type { SyncEvent, SyncEventInput } from "../shared/sync-event.schema";
import type { TenantContext } from "../shared/tenant-context.schema";
import { Effect, Layer } from "effect";
import {
  SyncStore,
  type ClientMutationRun,
  type PullEventsInput,
  type SyncTransaction,
} from "./sync.service.interface";
import type { VisibilityResolverShape } from "./visibility.resolver.interface";

type StoredMutation<TResult = unknown> = {
  readonly mutation: ClientMutation;
  readonly result: TResult;
};

export type InMemorySyncStore = typeof SyncStore.Service & {
  readonly listEvents: (tenantId: string) => ReadonlyArray<SyncEvent>;
};

const mutationKey = (ctx: TenantContext, input: ClientMutationInput) =>
  `${ctx.tenantId}:${ctx.userId}:${input.clientMutationId}`;

export const createInMemorySyncStore = (): InMemorySyncStore => {
  const eventsByTenant = new Map<string, Array<SyncEvent>>();
  const mutations = new Map<string, StoredMutation>();

  const listEvents = (tenantId: string) => eventsByTenant.get(tenantId) ?? [];

  return {
    appendEvent: (ctx: TenantContext, input: SyncEventInput) => appendInMemoryEvent(eventsByTenant, ctx, input),
    pullEvents: (ctx: TenantContext, input: PullEventsInput, visibility?: VisibilityResolverShape) =>
      Effect.gen(function* () {
        const visibleEvents: Array<SyncEvent> = [];

        for (const event of listEvents(ctx.tenantId)) {
          if (event.seq <= input.afterSeq) continue;
          if (visibility && !(yield* Effect.promise(() => Promise.resolve(visibility.canReadEvent(ctx, event)))))
            continue;

          visibleEvents.push(event);
          if (visibleEvents.length >= input.limit) break;
        }

        return visibleEvents;
      }),
    withClientMutation: <TResult>(
      ctx: TenantContext,
      input: ClientMutationInput,
      run: (tx: SyncTransaction) => ClientMutationRun<TResult>,
    ) =>
      Effect.gen(function* () {
        const key = mutationKey(ctx, input);
        const existing = mutations.get(key);
        if (existing) {
          return { mutation: existing.mutation, result: existing.result as TResult, replayed: true };
        }

        const output = yield* run({
          appendEvent: (txCtx, eventInput) => appendInMemoryEvent(eventsByTenant, txCtx, eventInput),
        });
        const mutation = {
          ...ctx,
          ...input,
          resultEventSeq: output.resultEventSeq,
          status: "completed",
          createdAt: new Date().toISOString(),
        } satisfies ClientMutation;
        const stored = { mutation, result: output.result };
        mutations.set(key, stored);

        return { ...stored, replayed: false };
      }),
    listEvents,
  };
};

const appendInMemoryEvent = (
  eventsByTenant: Map<string, Array<SyncEvent>>,
  ctx: TenantContext,
  input: SyncEventInput,
) =>
  Effect.sync(() => {
    const events = eventsByTenant.get(ctx.tenantId) ?? [];
    const event = {
      ...ctx,
      ...input,
      seq: events.length + 1,
      createdAt: new Date().toISOString(),
    } satisfies SyncEvent;
    eventsByTenant.set(ctx.tenantId, [...events, event]);
    return event;
  });

export const SyncStoreMemoryLive = Layer.succeed(SyncStore, SyncStore.of(createInMemorySyncStore()));
