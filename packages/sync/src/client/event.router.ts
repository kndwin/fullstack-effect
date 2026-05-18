import type { SyncEvent } from "../shared/sync-event.schema";

export type EventHandler = (event: SyncEvent) => void | Promise<void>;

export type EventRouter = {
  readonly register: (domain: string, handler: EventHandler) => EventRouter;
  readonly dispatch: (event: SyncEvent) => Promise<void>;
};

export const createEventRouter = (): EventRouter => createEventRouterFrom(new Map());

const createEventRouterFrom = (handlers: ReadonlyMap<string, EventHandler>): EventRouter => ({
  register: (domain, handler) => {
    const next = new Map(handlers);
    next.set(domain, handler);
    return createEventRouterFrom(next);
  },
  dispatch: async (event) => {
    const handler = handlers.get(event.domain);
    if (handler) {
      await handler(event);
    }
  },
});
