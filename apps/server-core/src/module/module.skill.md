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
  <feature>.rpc.impl.ts  # RpcGroup.toLayer handlers, transport only
  <feature>.service.ts   # Context.Service domain layer
  <feature>.repo.ts      # Context.Service persistence layer, if DB-backed
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
- Use one `Context.Service` per service and repo, with `make` in the class declaration.
- Export one `<Name>ServiceLive` / `<Name>RepositoryLive` layer from the same file as the service/repo.
- Merge RPC handler layers in `apps/server-core/index.ts`.
- Add shared RPC groups to `packages/shared/src/platform/rpc.ts`.

## Don't

- Don't add `.contract.ts` / `.impl.ts` splits for services or repos.
- Don't import another module's repo from a repo. Cross-module coordination belongs in a service.
- Don't expose Drizzle rows or table types from services unless they already match the shared schema shape.
- Don't throw for domain failures. Use shared `Schema.TaggedErrorClass` errors.
- Don't surface infrastructure errors through RPC contracts; defect them at the RPC boundary.

## Naming

- Server service: `<Name>Service`, `<Name>ServiceLive`.
- Server repo: `<Name>Repository`, `<Name>RepositoryLive`.
- RPC handler layer: `<Name>RpcLive`.
- Shared schemas: `*Schema` values, with local `typeof XSchema.Type` type derivation where needed.
