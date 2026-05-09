---
name: util
description: House rules for pure utility files (*.util.ts) in apps/server-core modules. Use when extracting deterministic business helpers.
license: Apache-2.0
metadata:
  scope: apps/server-core
  prefix: ".util.ts"
---

# `*.util.ts` - Pure Utilities

A util file contains only pure, synchronous, deterministic helpers for one module.

## Do

- Export only named functions.
- Prefer one object parameter for exported functions when the function has more than one input.
- Keep functions deterministic: same input, same output.
- Add `<feature>.util.test.ts` when util behavior is non-trivial.

## Don't

- Don't import services, repos, RPC handlers, platform modules, tables, filesystem, network, timers, or database APIs.
- Don't use `Effect` in util files.
- Don't mutate external state.
- Don't throw for expected outcomes; return explicit values and let services model failure.
- Don't export constants, classes, schemas, default exports, or service layers from util files.
