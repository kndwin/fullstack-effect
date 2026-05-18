---
name: repo
description: House rules for split repository files (*.repo.interface.ts and *.repo.implement.ts) in apps/server-core. Use when persisting feature data, wrapping Drizzle Effect queries, or deciding repo vs service responsibilities.
license: Apache-2.0
metadata:
  scope: apps/server-core
  prefix: ".repo"
---

# `*.repo.interface.ts` / `*.repo.implement.ts` - Persistence

A repo is the persistence layer. It wraps Drizzle Effect operations so services do not touch SQL, tables, or DB wiring directly. Repo contracts and live implementations are split.

## Canonical Shape

```ts
// widget.repo.interface.ts
import { Context, Effect } from "effect";

export type WidgetRepositoryShape = {
  readonly findMany: () => Effect.Effect<ReadonlyArray<WidgetRow>, unknown>;
  readonly create: (input: { readonly id: string; readonly name: string }) => Effect.Effect<WidgetRow, unknown>;
};

export class WidgetRepository extends Context.Service<WidgetRepository, WidgetRepositoryShape>()("WidgetRepository", {
  make: Effect.succeed({} as WidgetRepositoryShape),
}) {}
```

```ts
// widget.repo.implement.ts
import { Effect, Layer } from "effect";
import { DB, PgLive } from "../../platform/db";
import { WidgetRepository } from "./widget.repo.interface";
import { widgets } from "./widget.table";

export const WidgetRepositoryLive = Layer.effect(
  WidgetRepository,
  Effect.gen(function* () {
    const db = yield* DB;

    return WidgetRepository.of({
      findMany: Effect.fn("WidgetRepository.findMany")(function* () {
        return yield* db.query.widgets.findMany({ orderBy: { name: "asc" } });
      }),
      create: Effect.fn("WidgetRepository.create")(function* (input: { id: string; name: string }) {
        const [widget] = yield* db.insert(widgets).values(input).returning();
        if (!widget) return yield* Effect.die("Widget insert returned no rows");
        return widget;
      }),
    });
  }),
).pipe(Layer.provide(PgLive));
```

## Do

- Put the `Context.Service` tag and shape type in `<feature>.repo.interface.ts`.
- Put the Drizzle-backed live layer in `<feature>.repo.implement.ts`.
- Pull `const db = yield* DB` once at the top of the live layer effect.
- Wrap every method with `Effect.fn("<Name>Repository.<op>")`.
- Return Drizzle-inferred rows directly when they match shared schema shapes.
- Keep the method surface tiny: one method per persistence operation the service actually uses.
- Import `<feature>.table.ts` only from the repo and platform DB registration.
- Let `EffectDrizzleQueryError` be inferred from Drizzle operations.

## Don't

- Don't put business validation in the repo unless it is inseparable from persistence integrity.
- Don't import RPC contracts or client code.
- Don't manually cast Drizzle rows to domain types.
- Don't catch infrastructure errors in the repo just to rewrap them.
- Don't import another module's repo.
- Don't put live DB implementation code in `.repo.interface.ts`.
- Don't create unsplit `<feature>.repo.ts` files for new modules.

## Domain Errors

Prefer mapping absence or invalid business states in the service. It is acceptable for a repo to return a shared not-found tagged error for a tightly scoped persistence lookup, but keep client-handleable domain errors in shared schema files.
