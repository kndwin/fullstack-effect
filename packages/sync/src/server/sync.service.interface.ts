import { Context, Effect } from "effect";
import type { ClientMutation, ClientMutationInput } from "../shared/client-mutation.schema";
import type { SyncEvent, SyncEventInput } from "../shared/sync-event.schema";
import type { TenantContext } from "../shared/tenant-context.schema";
import type { VisibilityResolverShape } from "./visibility.resolver.interface";

export type PullEventsInput = {
  readonly afterSeq: number;
  readonly limit: number;
};

export type ClientMutationResult<TResult> = {
  readonly mutation: ClientMutation;
  readonly result: TResult;
  readonly replayed: boolean;
};

export type SyncTransaction = {
  readonly appendEvent: (ctx: TenantContext, input: SyncEventInput) => Effect.Effect<SyncEvent, unknown>;
};

export type ClientMutationRun<TResult> = Effect.Effect<
  {
    readonly result: TResult;
    readonly resultEventSeq: number | null;
  },
  unknown
>;

export type SqlMutationResult<TResult> = {
  readonly mutation: ClientMutation;
  readonly result: TResult;
};

export type SqlSyncAdapter = {
  readonly appendEvent: (ctx: TenantContext, input: SyncEventInput) => Effect.Effect<SyncEvent, unknown>;
  readonly pullEvents: (ctx: TenantContext, input: PullEventsInput) => Effect.Effect<ReadonlyArray<SyncEvent>, unknown>;
  readonly findClientMutation: (
    ctx: TenantContext,
    input: ClientMutationInput,
  ) => Effect.Effect<SqlMutationResult<unknown> | null, unknown>;
  readonly withClientMutationTransaction: <TResult>(
    ctx: TenantContext,
    input: ClientMutationInput,
    run: (tx: SyncTransaction) => ClientMutationRun<TResult>,
  ) => Effect.Effect<SqlMutationResult<TResult>, unknown>;
};

export class SyncStore extends Context.Service<SyncStore>()("SyncStore", {
  make: Effect.succeed({
    appendEvent: (_ctx: TenantContext, _input: SyncEventInput): Effect.Effect<SyncEvent, unknown> =>
      Effect.die("SyncStore.appendEvent not implemented"),
    pullEvents: (
      _ctx: TenantContext,
      _input: PullEventsInput,
      _visibility?: VisibilityResolverShape,
    ): Effect.Effect<ReadonlyArray<SyncEvent>, unknown> => Effect.die("SyncStore.pullEvents not implemented"),
    withClientMutation: <TResult>(
      _ctx: TenantContext,
      _input: ClientMutationInput,
      _run: (tx: SyncTransaction) => ClientMutationRun<TResult>,
    ): Effect.Effect<ClientMutationResult<TResult>, unknown> =>
      Effect.die("SyncStore.withClientMutation not implemented"),
  }),
}) {}
