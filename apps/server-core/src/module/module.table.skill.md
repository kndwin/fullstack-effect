---
name: table
description: House rules for Drizzle table files (*.table.ts) in apps/server-core. Use when adding or changing Postgres table definitions.
license: Apache-2.0
metadata:
  scope: apps/server-core
  prefix: ".table.ts"
---

# `*.table.ts` - Drizzle Tables

A table file declares the Postgres storage shape for a module. Tables are persistence contracts, not domain schemas.

## Canonical Shape

```ts
import { pgTable, text } from "drizzle-orm/pg-core";

export const widgets = pgTable("widgets", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});
```

## Do

- Use `pgTable` from `drizzle-orm/pg-core`.
- Use `snake_case` SQL column names and `camelCase` TypeScript keys.
- Keep join tables with the owning module unless they clearly deserve their own module.
- Register table exports in `apps/server-core/src/platform/db.ts` through module table imports.
- Let `drizzle-kit` generate migrations from `.table.ts` files.

## Don't

- Don't import shared schemas into table files.
- Don't export inferred table row types unless there is a concrete local need.
- Don't import tables from services or RPC impls.
- Don't add constraints without planning a migration.

## Migrations

Use `bun run --cwd apps/server-core db:generate` when table definitions change and migrations are ready to be created.
