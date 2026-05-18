---
name: service-implement
description: House rules for server service implementation files (*.service.implement.ts). Use when implementing a module domain service live layer.
license: Apache-2.0
metadata:
  scope: apps/server-core
  prefix: ".service.implement.ts"
---

# `*.service.implement.ts` - Service Live Layer

A service implementation file binds a service interface to repositories and domain rules.

## Canonical Shape

```ts
import { Effect, Layer } from "effect";
import { WidgetRepository } from "./widget.repo.interface";
import { WidgetRepositoryLive } from "./widget.repo.implement";
import { WidgetService } from "./widget.service.interface";

export const WidgetServiceLive = Layer.effect(
  WidgetService,
  Effect.gen(function* () {
    const repo = yield* WidgetRepository;

    return WidgetService.of({
      create: Effect.fn("WidgetService.create")(function* ({ name }) {
        const trimmed = name.trim();
        return yield* repo.create({ id: `wgt_${crypto.randomUUID()}`, name: trimmed });
      }),
    });
  }),
).pipe(Layer.provide(WidgetRepositoryLive));
```

## Do

- Export `<Name>ServiceLive`.
- Depend on repo/service interfaces, not implementation internals.
- Pull dependencies once near the top of `Effect.gen`.
- Wrap non-trivial methods with `Effect.fn("<Name>Service.<method>")`.
- Normalize inputs and enforce business rules here.

## Don't

- Don't import Drizzle tables or `DB` directly.
- Don't define the `Context.Service` tag here.
- Don't throw domain errors; use shared tagged errors.
