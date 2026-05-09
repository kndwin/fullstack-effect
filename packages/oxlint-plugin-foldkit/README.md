# oxlint-plugin-foldkit

Oxlint rules for Foldkit applications.

This package starts private inside the workspace, but is structured so it can later be published as `oxlint-plugin-foldkit`.

## Rules

- `foldkit/no-noop-message`: disallow generic `NoOp` messages.
- `foldkit/got-submodel-message-name`: require submodel wrapper messages to use `Got*Message` names.
- `foldkit/no-side-effects-in-update-view`: disallow direct side effects in `*.update.ts(x)` and `*.view.ts(x)` files.

## Usage

Build the plugin before running Oxlint:

```sh
bun run --cwd packages/oxlint-plugin-foldkit build
```

Then load the generated module from `.oxlintrc.json`:

```json
{
  "jsPlugins": [{ "name": "foldkit", "specifier": "./packages/oxlint-plugin-foldkit/dist/index.mjs" }],
  "rules": {
    "foldkit/no-noop-message": "warn",
    "foldkit/got-submodel-message-name": "warn",
    "foldkit/no-side-effects-in-update-view": "warn"
  }
}
```
