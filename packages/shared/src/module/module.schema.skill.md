---
name: shared-schema
description: House rules for shared module schema files in packages/shared. Use when defining Effect schemas, tagged domain errors, or shared wire/domain shapes consumed by client and server.
license: Apache-2.0
metadata:
  scope: packages/shared
  prefix: "src/module/<feature>/<feature>.schema.ts"
---

# Shared `*.schema.ts`

Shared schema files are the source of truth for module wire/domain shapes. They are consumed by RPC contracts, server services/repos, and client modules.

## Canonical Shape

```ts
import { Schema } from "effect";

export const WidgetSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
});

export class ErrorWidgetInvalidName extends Schema.TaggedErrorClass<ErrorWidgetInvalidName>()(
  "ErrorWidgetInvalidName",
  { message: Schema.String },
) {}
```

## Do

- Place schemas at `packages/shared/src/module/<feature>/<feature>.schema.ts`.
- Name runtime schema values with a `Schema` suffix: `TodoSchema`, `ProjectSchema`, `OrgSchema`.
- Define client-handleable domain errors with `Schema.TaggedErrorClass`.
- Keep tagged error class names and tag strings identical.
- Keep schemas small and flat unless nesting is part of the wire contract.
- Derive types locally where needed with `typeof XSchema.Type`.

## Don't

- Don't export derived domain type aliases from shared schema files.
- Don't duplicate schemas with TypeScript interfaces.
- Don't put business logic in shared schemas.
- Don't use `Schema.Class` for plain shared domain shapes.
- Don't create barrels in `packages/shared/src`; import direct module paths.
- Don't include internal-only failure details in tagged error payloads.

## Errors

Only errors the client can reasonably handle should be shared tagged errors. Infrastructure failures such as database, network, or serialization failures stay in server/platform code and are defected at RPC boundaries.
