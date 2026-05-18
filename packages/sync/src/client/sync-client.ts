import type { SyncEvent } from "../shared/sync-event.schema";
import type { EventRouter } from "./event.router";
import type { CursorStore } from "./sync-cursor.store";

export type PullEvents = (input: {
  readonly tenantId: string;
  readonly afterSeq: number;
}) => Promise<ReadonlyArray<SyncEvent>>;

export type SyncClient = {
  readonly applyPulledEvents: (tenantId: string) => Promise<void>;
};

export const createSyncClient = (input: {
  readonly cursorStore: CursorStore;
  readonly router: EventRouter;
  readonly pullEvents: PullEvents;
}): SyncClient => ({
  applyPulledEvents: async (tenantId) => {
    const cursor = await input.cursorStore.getCursor(tenantId);
    const events = await input.pullEvents({ tenantId, afterSeq: cursor?.lastSeq ?? 0 });

    for (const event of events) {
      await input.router.dispatch(event);
      await input.cursorStore.setCursor({ tenantId, lastSeq: event.seq });
    }
  },
});
