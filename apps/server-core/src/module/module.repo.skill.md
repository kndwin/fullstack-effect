---
name: repo
description: House rules for Drizzle-backed repository files (*.repo.ts) in apps/server-core. Use when persisting feature data, wrapping Drizzle Effect queries, or deciding repo vs service responsibilities.
license: Apache-2.0
metadata:
  scope: apps/server-core
  prefix: ".repo.ts"
---

# `*.repo.ts` - Persistence

A repo is the persistence layer. It wraps Drizzle Effect operations so services do not touch SQL, tables, or DB wiring directly.

## Canonical Shape

```ts
import { Context, Effect, Layer } from "effect";
import { DB, PgLive } from "../../platform/db";
import { widgets } from "./widget.table";

export class WidgetRepository extends Context.Service<WidgetRepository>()("WidgetRepository", {
  make: Effect.gen(function* () {
    const db = yield* DB;

    return {
      findMany: Effect.fn("WidgetRepository.findMany")(function* () {
        return yield* db.query.widgets.findMany({ orderBy: { name: "asc" } });
      }),
      create: Effect.fn("WidgetRepository.create")(function* (input: { id: string; name: string }) {
        const [widget] = yield* db.insert(widgets).values(input).returning();
        if (!widget) return yield* Effect.die(new Error("Widget insert returned no rows"));
        return widget;
      }),
    };
  }),
}) {}

export const WidgetRepositoryLive = Layer.effect(WidgetRepository)(WidgetRepository.make).pipe(Layer.provide(PgLive));
```

## Do

- Pull `const db = yield* DB` once at the top of `make`.
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

## Domain Errors

Prefer mapping absence or invalid business states in the service. It is acceptable for a repo to return a shared not-found tagged error for a tightly scoped persistence lookup, but keep client-handleable domain errors in shared schema files.
