import { Layer } from "effect";
import { VisibilityResolver, type VisibilityResolverShape } from "./visibility.resolver.interface";

export const allowTenantEvents: VisibilityResolverShape = {
  canReadEvent: (ctx, event) => event.tenantId === ctx.tenantId,
};

export const VisibilityResolverAllowTenantLive = Layer.succeed(
  VisibilityResolver,
  VisibilityResolver.of(allowTenantEvents),
);
