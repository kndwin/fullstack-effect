import { Context, Effect } from "effect";
import type { SyncEvent } from "../shared/sync-event.schema";
import type { TenantContext } from "../shared/tenant-context.schema";

export type VisibilityResolverShape = {
  readonly canReadEvent: (ctx: TenantContext, event: SyncEvent) => boolean | Promise<boolean>;
};

export class VisibilityResolver extends Context.Service<VisibilityResolver, VisibilityResolverShape>()(
  "VisibilityResolver",
  {
    make: Effect.succeed({
      canReadEvent: (_ctx: TenantContext, _event: SyncEvent) => false,
    } satisfies VisibilityResolverShape),
  },
) {}
