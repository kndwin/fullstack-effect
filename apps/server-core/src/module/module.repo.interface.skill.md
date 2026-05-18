---
name: repo-interface
description: House rules for server repository interface files (*.repo.interface.ts). Use when defining a persistence capability/tag.
license: Apache-2.0
metadata:
  scope: apps/server-core
  prefix: ".repo.interface.ts"
---

# `*.repo.interface.ts` - Repository Contract

A repo interface file defines the Effect capability tag and persistence method shape.

## Canonical Shape

```ts
import { Context, Effect } from "effect";
import type { widgets } from "./widget.table";

export type WidgetRow = typeof widgets.$inferSelect;

export type WidgetRepositoryShape = {
  readonly create: (input: { readonly id: string; readonly name: string }) => Effect.Effect<WidgetRow, unknown>;
};

export class WidgetRepository extends Context.Service<WidgetRepository, WidgetRepositoryShape>()("WidgetRepository", {
  make: Effect.succeed({} as WidgetRepositoryShape),
}) {}
```

## Do

- Export row types only when services need them locally.
- Export a `<Name>RepositoryShape` type.
- Export a `<Name>Repository` class using `Context.Service`.
- Keep the method surface as small as the service needs.

## Don't

- Don't put DB queries, layers, or live implementation code here.
- Don't import `DB`, `PgLive`, or implementation files.
- Don't use type-only repo `.interface.ts` files; `.interface.ts` capability files must export `Context.Service`.
