---
name: repo-implement
description: House rules for server repository implementation files (*.repo.implement.ts). Use when implementing Drizzle-backed repository live layers.
license: Apache-2.0
metadata:
  scope: apps/server-core
  prefix: ".repo.implement.ts"
---

# `*.repo.implement.ts` - Repository Live Layer

A repo implementation file binds a repository interface to Drizzle and Postgres.

## Canonical Shape

```ts
import { Effect, Layer } from "effect";
import { DB, PgLive } from "../../platform/db";
import { WidgetRepository } from "./widget.repo.interface";
import { widgets } from "./widget.table";

export const WidgetRepositoryLive = Layer.effect(
  WidgetRepository,
  Effect.gen(function* () {
    const db = yield* DB;

    return WidgetRepository.of({
      create: Effect.fn("WidgetRepository.create")(function* (input) {
        const [widget] = yield* db.insert(widgets).values(input).returning();
        if (!widget) return yield* Effect.die("Widget insert returned no rows");
        return widget;
      }),
    });
  }),
).pipe(Layer.provide(PgLive));
```

## Do

- Export `<Name>RepositoryLive`.
- Import `DB`/`PgLive` only in implementation files.
- Import tables only in implementation files and platform DB registration.
- Wrap every method with `Effect.fn("<Name>Repository.<op>")`.
- Let Drizzle infrastructure errors remain inferred.

## Don't

- Don't put business validation here unless persistence integrity requires it.
- Don't import RPC contracts or client code.
- Don't catch infrastructure errors just to rewrap them.
