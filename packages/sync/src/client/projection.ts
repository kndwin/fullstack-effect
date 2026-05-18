import type { SyncEvent } from "../shared/sync-event.schema";

export type ProjectionAdapter<TState = unknown> = {
  readonly applyEvent: (state: TState, event: SyncEvent) => TState | Promise<TState>;
};
