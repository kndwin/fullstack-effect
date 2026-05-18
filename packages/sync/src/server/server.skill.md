---
name: sync-server
description: House rules for sync server capabilities under packages/sync/src/server. Use when adding sync services, resolvers, streams, or implementations.
license: Apache-2.0
metadata:
  scope: packages/sync
  prefix: "src/server/"
---

# Sync Server Capabilities

Server sync capabilities use Effect services and explicit implementation variants.

## Do

- Put capability contracts in `<capability>.interface.ts` files.
- Export a `Context.Service` class from every capability `.interface.ts` file. In Effect v4, `Context.Service` is the tag/service-key API.
- Name implementation variants `<capability>.implement.<variant>.ts`, for example `sync.service.implement.memory.ts`.
- Keep live layers and concrete constructors in `.implement.*.ts` files.
- Use Effect `Stream.Stream` for streaming capabilities, not raw `AsyncIterable`, unless adapting an external boundary.

## Don't

- Don't create type-only capability `.interface.ts` files.
- Don't put memory, SQL, or other live implementations in `.interface.ts` files.
- Don't add barrel exports; keep `packages/sync/package.json` exports explicit.
