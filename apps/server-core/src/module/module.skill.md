---
name: module
description: House rules for backend feature modules under apps/server-core/src/module. Use when creating or refactoring a server module, wiring RPC handlers, services, repos, tables, or reviewing module boundaries.
license: Apache-2.0
metadata:
  scope: apps/server-core
  prefix: "src/module/<feature>/"
---

# `module/<feature>/` - Server Modules

A server module is the backend implementation slice for a feature. Shared wire/domain contracts live in `packages/shared`; server modules own transport handlers, domain services, persistence, and database tables.

## Anatomy

```text
apps/server-core/src/module/<feature>/
  <feature>.rpc.implement.ts  # RpcGroup.toLayer handlers, transport only
  <feature>.service.interface.ts  # Context.Service contract/tag for domain logic
  <feature>.service.implement.ts  # Live domain service layer
  <feature>.repo.interface.ts     # Context.Service contract/tag for persistence
  <feature>.repo.implement.ts     # Live persistence layer, if DB-backed
  <feature>.table.ts     # Drizzle pgTable definitions, if persisted
  <feature>.util.ts      # pure deterministic helpers, if useful
```

Shared contracts live outside server-core:

```text
packages/shared/src/module/<feature>/
  <feature>.schema.ts    # Effect schemas and tagged domain errors
  <feature>.rpc.ts       # Rpc.make entries and RpcGroup
```

## Do

- Keep RPC impls thin: bind shared RPC endpoints to service methods.
- Keep business rules in `<feature>.service.ts`.
- Keep Drizzle imports and table imports confined to `<feature>.repo.ts` and platform DB registration.
- Use one service/repo interface file and one implementation file.
- Interface files own the exported service/repo `Context.Service` class. In Effect v4, use `Context.Service` as the capability tag.
- Implementation files own the exported `<Name>ServiceLive` / `<Name>RepositoryLive` layer.
- Merge RPC handler layers in `apps/server-core/index.ts`.
- Add shared RPC groups to `packages/shared/src/platform/rpc.ts`.

## Don't

- Don't put live service/repo implementations in `.interface.ts` files.
- Don't use type-only service/repo `.interface.ts` files; export a `Context.Service` tag from them.
- Don't create unsplit `<feature>.service.ts` or `<feature>.repo.ts` files.
- Don't import another module's repo from a repo. Cross-module coordination belongs in a service.
- Don't expose Drizzle rows or table types from services unless they already match the shared schema shape.
- Don't throw for domain failures. Use shared `Schema.TaggedErrorClass` errors.
- Don't surface infrastructure errors through RPC contracts; defect them at the RPC boundary.

## Naming

- Server service: `<Name>Service`, `<Name>ServiceLive`.
- Server repo: `<Name>Repository`, `<Name>RepositoryLive`.
- RPC handler layer: `<Name>RpcLive`.
- Shared schemas: `*Schema` values, with local `typeof XSchema.Type` type derivation where needed.
