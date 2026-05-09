---
name: service
description: House rules for service files (*.service.ts) in apps/server-core. Use when adding domain behavior between RPC handlers and repositories.
license: Apache-2.0
metadata:
  scope: apps/server-core
  prefix: ".service.ts"
---

# `*.service.ts` - Domain Service

A service owns module business rules. It sits between RPC handlers and repos, translating payload-level intent into repository calls and tagged domain errors.

## Canonical Shape

```ts
import { Context, Effect, Layer } from "effect";
import { WidgetRepository, WidgetRepositoryLive } from "./widget.repo";

export class WidgetService extends Context.Service<WidgetService>()("WidgetService", {
  make: Effect.gen(function* () {
    const repo = yield* WidgetRepository;

    return {
      create: Effect.fn("WidgetService.create")(function* (name: string) {
        const trimmed = name.trim();
        // return yield* new ErrorWidgetInvalidName(...) for domain validation failures
        return yield* repo.create({ id: `wgt_${crypto.randomUUID()}`, name: trimmed });
      }),
    };
  }),
}) {}

export const WidgetServiceLive = Layer.effect(WidgetService)(WidgetService.make).pipe(
  Layer.provide(WidgetRepositoryLive),
);
```

## Do

- Pull the repo once at the top of `make`.
- Keep input normalization and business validation here.
- Use shared tagged errors from `packages/shared/src/module/<feature>/<feature>.schema.ts` for client-handleable failures.
- Wrap non-trivial methods with `Effect.fn("<Name>Service.<method>")`.
- Keep service method names aligned with RPC endpoint names where practical.

## Don't

- Don't import Drizzle tables or `DB` directly.
- Don't throw domain errors.
- Don't create generic `Error` failures for conditions the client should handle.
- Don't add a service contract/impl split unless there are multiple real implementations.

## Layering

Services should provide their repository live layer when they are the module's public server dependency. RPC impls should depend on services, not repos.
