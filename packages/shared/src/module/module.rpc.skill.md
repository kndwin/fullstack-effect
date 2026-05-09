---
name: shared-rpc
description: House rules for shared module RPC contract files in packages/shared. Use when adding or changing Rpc.make entries, RpcGroup modules, or aggregate app RPC wiring.
license: Apache-2.0
metadata:
  scope: packages/shared
  prefix: "src/module/<feature>/<feature>.rpc.ts"
---

# Shared `*.rpc.ts`

Shared RPC files define the wire contract between `apps/server-core` and `apps/client-web`. Server implementations bind these contracts in `apps/server-core/src/module/<feature>/<feature>.rpc.impl.ts`.

## Canonical Shape

```ts
import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/unstable/rpc";
import { ErrorWidgetInvalidName, WidgetSchema } from "./widget.schema";

export const WidgetRpcs = RpcGroup.make(
  Rpc.make("WidgetList", { success: WidgetSchema }),
  Rpc.make("WidgetCreate", {
    payload: { name: Schema.String },
    success: WidgetSchema,
    error: ErrorWidgetInvalidName,
  }),
);
```

## Do

- Place RPC contracts at `packages/shared/src/module/<feature>/<feature>.rpc.ts`.
- Import schemas and tagged errors from the sibling `<feature>.schema.ts` file.
- Use PascalCase endpoint names: `TodoList`, `ProjectCreate`, `OrgCreate`.
- Declare `payload`, `success`, and `error` schemas explicitly when applicable.
- Add each module RPC group to `packages/shared/src/platform/rpc.ts`.
- Keep RPC contracts transport-focused and stable for client/server compatibility.

## Don't

- Don't import server implementation code, Drizzle tables, services, repos, or client modules.
- Don't declare infrastructure errors in RPC contracts.
- Don't re-declare schema shapes inline when a shared schema already exists.
- Don't export derived domain type aliases from RPC files.
- Don't create class-per-RPC declarations unless the project style changes consistently.

## Error Contract

The `error` arm should include only client-handleable tagged domain errors from shared schema files. Server RPC implementations should catch infrastructure failures like `EffectDrizzleQueryError` and convert them to defects with `Effect.die`.
