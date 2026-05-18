import type { PendingMutation } from "../shared/pending-mutation.schema";

export type OutboxStore = {
  readonly enqueue: (mutation: PendingMutation) => Promise<void>;
  readonly listPending: (tenantId: string) => Promise<ReadonlyArray<PendingMutation>>;
  readonly update: (mutation: PendingMutation) => Promise<void>;
};
