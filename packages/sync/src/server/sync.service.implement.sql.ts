import type { ClientMutationInput } from "../shared/client-mutation.schema";
import type { SyncEvent, SyncEventInput } from "../shared/sync-event.schema";
import type { TenantContext } from "../shared/tenant-context.schema";
import { Effect, Layer } from "effect";
import {
  SyncStore,
  type ClientMutationRun,
  type PullEventsInput,
  type SqlSyncAdapter,
  type SyncTransaction,
} from "./sync.service.interface";
import type { VisibilityResolverShape } from "./visibility.resolver.interface";

export const createSqlSyncStore = (adapter: SqlSyncAdapter): typeof SyncStore.Service => ({
  appendEvent: adapter.appendEvent,
  pullEvents: (ctx: TenantContext, input: PullEventsInput, visibility?: VisibilityResolverShape) =>
    Effect.gen(function* () {
      const events = yield* adapter.pullEvents(ctx, input);
      if (!visibility) return events;

      const visibleEvents: Array<SyncEvent> = [];
      for (const event of events) {
        if (yield* Effect.promise(() => Promise.resolve(visibility.canReadEvent(ctx, event)))) {
          visibleEvents.push(event);
        }
      }

      return visibleEvents;
    }),
  withClientMutation: <TResult>(
    ctx: TenantContext,
    input: ClientMutationInput,
    run: (tx: SyncTransaction) => ClientMutationRun<TResult>,
  ) =>
    Effect.gen(function* () {
      const existing = yield* adapter.findClientMutation(ctx, input);
      if (existing) {
        return { mutation: existing.mutation, result: existing.result as TResult, replayed: true };
      }

      const stored = yield* adapter.withClientMutationTransaction(ctx, input, (tx) => runWithTransaction(tx, run));
      return { mutation: stored.mutation, result: stored.result, replayed: false };
    }),
});

const runWithTransaction = <TResult>(tx: SyncTransaction, run: (tx: SyncTransaction) => ClientMutationRun<TResult>) =>
  run(tx);

export const makeSqlSyncStoreLayer = (adapter: SqlSyncAdapter) =>
  Layer.succeed(SyncStore, SyncStore.of(createSqlSyncStore(adapter)));
