---
name: service
description: House rules for split service files (*.service.interface.ts and *.service.implement.ts) in apps/server-core. Use when adding domain behavior between RPC handlers and repositories.
license: Apache-2.0
metadata:
  scope: apps/server-core
  prefix: ".service"
---

# `*.service.interface.ts` / `*.service.implement.ts` - Domain Service

A service owns module business rules. It sits between RPC handlers and repos, translating payload-level intent into repository calls and tagged domain errors. Service contracts and live implementations are split.

## Canonical Shape

```ts
// widget.service.interface.ts
import { Context, Effect } from "effect";

export type WidgetServiceShape = {
  readonly create: (input: { readonly name: string }) => Effect.Effect<Widget, ErrorWidgetInvalidName>;
};

export class WidgetService extends Context.Service<WidgetService, WidgetServiceShape>()("WidgetService", {
  make: Effect.succeed({} as WidgetServiceShape),
}) {}
```

```ts
// widget.service.implement.ts
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
        // return yield* new ErrorWidgetInvalidName(...) for domain validation failures
        return yield* repo.create({ id: `wgt_${crypto.randomUUID()}`, name: trimmed });
      }),
    });
  }),
).pipe(Layer.provide(WidgetRepositoryLive));
```

## Do

- Put the `Context.Service` tag and shape type in `<feature>.service.interface.ts`.
- Put the live layer in `<feature>.service.implement.ts`.
- Pull the repo once at the top of the live layer effect.
- Keep input normalization and business validation here.
- Use shared tagged errors from `packages/shared/src/module/<feature>/<feature>.schema.ts` for client-handleable failures.
- Wrap non-trivial methods with `Effect.fn("<Name>Service.<method>")`.
- Keep service method names aligned with RPC endpoint names where practical.

## Don't

- Don't import Drizzle tables or `DB` directly.
- Don't throw domain errors.
- Don't create generic `Error` failures for conditions the client should handle.
- Don't put live implementation code in `.service.interface.ts`.
- Don't create unsplit `<feature>.service.ts` files for new modules.

## Layering

Services should provide their repository live layer when they are the module's public server dependency. RPC impls should depend on services, not repos.
