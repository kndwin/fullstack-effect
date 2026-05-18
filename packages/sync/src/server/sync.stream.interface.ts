import { Context, Effect, Stream } from "effect";
import type { SyncEvent } from "../shared/sync-event.schema";
import type { TenantContext } from "../shared/tenant-context.schema";

export type StreamEventsInput = {
  readonly afterSeq: number;
};

export type SyncEventStreamShape = {
  readonly streamEvents: (ctx: TenantContext, input: StreamEventsInput) => Stream.Stream<SyncEvent>;
};

export class SyncEventStream extends Context.Service<SyncEventStream>()("SyncEventStream", {
  make: Effect.succeed({
    streamEvents: (_ctx: TenantContext, _input: StreamEventsInput) =>
      Stream.die("SyncEventStream.streamEvents not implemented"),
  } as SyncEventStreamShape),
}) {}
