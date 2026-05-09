---
name: rpc
description: House rules for server RPC implementation files (*.rpc.impl.ts). Use when binding shared RPC contracts to server services.
license: Apache-2.0
metadata:
  scope: apps/server-core
  prefix: ".rpc.impl.ts"
---

# `*.rpc.impl.ts` - RPC Handlers

RPC impl files are transport bindings. The shared contract lives in `packages/shared/src/module/<feature>/<feature>.rpc.ts`; the server impl binds that contract to the module service.

## Canonical Shape

```ts
import { WidgetRpcs } from "@qaveai/shared/module/widget/widget.rpc";
import { Effect, Layer, Stream } from "effect";
import { WidgetService, WidgetServiceLive } from "./widget.service";

export const WidgetRpcLive = WidgetRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* WidgetService;

    return WidgetRpcs.of({
      WidgetList: () => Stream.fromIterableEffect(service.findMany).pipe(Stream.orDie),
      WidgetCreate: ({ name }) => service.create(name).pipe(Effect.catchTag("EffectDrizzleQueryError", Effect.die)),
    });
  }),
).pipe(Layer.provide(WidgetServiceLive));
```

## Do

- Import shared RPC groups from `@qaveai/shared/module/<feature>/<feature>.rpc`.
- Depend on `<Name>Service`, not repos or tables.
- Surface only declared domain errors from the shared RPC contract.
- Defect infrastructure errors such as `EffectDrizzleQueryError` with `Effect.die`.
- Use `Stream.fromIterableEffect(...).pipe(Stream.orDie)` for list streams that can only fail with infrastructure errors.

## Don't

- Don't put business logic or input validation in RPC impls.
- Don't import `DB`, Drizzle tables, or repositories.
- Don't widen shared RPC error contracts for infrastructure failures.

## Wiring

Add each module's `<Name>RpcLive` to the `Layer.mergeAll(...)` in `apps/server-core/index.ts`. Add the shared RPC group to `packages/shared/src/platform/rpc.ts`.
