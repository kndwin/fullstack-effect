---
name: service-interface
description: House rules for server service interface files (*.service.interface.ts). Use when defining a module domain service capability/tag.
license: Apache-2.0
metadata:
  scope: apps/server-core
  prefix: ".service.interface.ts"
---

# `*.service.interface.ts` - Service Contract

A service interface file defines the Effect capability tag and method shape for module business logic.

## Canonical Shape

```ts
import { Context, Effect } from "effect";

export type WidgetServiceShape = {
  readonly create: (input: { readonly name: string }) => Effect.Effect<Widget, ErrorWidgetInvalidName>;
};

export class WidgetService extends Context.Service<WidgetService, WidgetServiceShape>()("WidgetService", {
  make: Effect.succeed({} as WidgetServiceShape),
}) {}
```

## Do

- Export a `<Name>ServiceShape` type.
- Export a `<Name>Service` class using `Context.Service`.
- Keep method inputs object-shaped when a method has more than one input.
- Use schema-derived input types from `<feature>.service.schema.ts` when inputs are externally meaningful.
- Reference shared tagged errors from schema files in method error types when useful.

## Don't

- Don't put live implementations, layers, repo access, or business logic here.
- Don't import Drizzle tables, `DB`, or implementation files.
- Don't use type-only service `.interface.ts` files; `.interface.ts` capability files must export `Context.Service`.
