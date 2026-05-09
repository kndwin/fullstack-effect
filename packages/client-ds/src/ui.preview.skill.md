# Client DS Preview Patterns

Use this when creating or reviewing `*.preview.ts` files in `packages/client-ds/src`.

## Preview Shape

- Every component should have a `Preview.module({ title: "Ui/Name", previews: [...] })` export.
- Prefer preview names `States` and `Replay`.
- Use `States` to show visual/default variants side by side.
- Use `Replay` for interaction and state-machine behavior.
- Export `Message` as a Schema. Use `Schema.Never` for purely visual previews; otherwise use `Schema.Union([...])` for preview messages.

## States Preview

States should cover meaningful visual permutations, not just one happy path.

Include applicable examples:

- default
- filled/selected/open/checked
- invalid/destructive
- disabled
- horizontal/vertical orientation
- empty and populated states
- subtle and strong variants

States can use static Foldkit models like `Ui.Switch.init(...)` or visual primitives without `init/update`.

## Replay Preview

Replay should exercise the component’s real state transitions.

For Foldkit submodels:

- Provide `init` returning the Foldkit model or a small preview model wrapping it.
- Provide `update` delegating to the Foldkit primitive update, or a small reducer that delegates and records useful display state.
- Render from the current `model`, not from hardcoded control values only.
- `toParentMessage: (message) => message` is appropriate when the replay message type is the Foldkit child message.
- Controls should adjust labels, disabled/invalid flags, orientation, placeholder text, or content while the model remains the source of behavior state.

Good replay pattern:

```ts
Preview.preview({
  name: "Replay",
  controls: {
    isDisabled: Preview.boolean(false),
  },
  init: () => Ui.Switch.init({ id: "preview-switch-replay", isChecked: false }),
  update: Ui.Switch.update,
  view: (model: Ui.Switch.Model, controls: PreviewControlValues) =>
    Switch({
      model,
      toParentMessage: (message) => message,
      label: "Replay switch",
      isDisabled: Boolean(controls.isDisabled),
    }),
  scenarios: [
    Preview.scenario("Toggle once", [Ui.Switch.Message()]),
    Preview.scenario("Toggle twice", [Ui.Switch.Message(), Ui.Switch.Message()]),
  ],
});
```

Avoid replay previews where scenarios emit messages but the UI renders hardcoded values that never change.

## Deep Scenarios

Prefer deeper scenarios that demonstrate realistic interaction paths and edge cases.

Good scenarios include:

- single interaction
- repeated toggle/select path
- open then close
- keyboard-style navigation path
- select A, select B, select A
- invalid or disabled controls with attempted interactions where useful
- drag start, move, move, release for pointer primitives
- command-producing message followed by command resolution where supported

Use `Preview.step(message, { delayMs })` when timing makes the replay easier to follow.

## Commands And Resolutions

Foldkit primitives often return commands from `update`. In previews, every command that can be created by replay or direct interaction should have a configured resolution whenever a deterministic message can represent completion.

Why:

- Pending commands appear in the Commands tab.
- Without a resolution, previews get stuck with “No resolutions configured for this command.”
- Command resolution makes replay/debugging complete and teaches the primitive lifecycle.

Add `commandResolutions` to the preview keyed by command name:

```ts
commandResolutions: {
  ShowAfterDelay: [
    {
      label: "Resolve show delay",
      message: ({ model }) => Ui.Tooltip.ElapsedShowDelay({ version: model.pendingShowVersion }),
    },
  ],
}
```

Resolution rules:

- The object key must match the command name shown in the Commands tab.
- The returned `message` must be the corresponding completion message expected by the primitive update.
- Use `model` for current preview state.
- Use `sourceModel` when the completion must correspond to the model that created the command.
- Use `sourceMessage` when the completion depends on the triggering message.
- Use `command` only when the command payload is needed and safely inspectable.
- Prefer one obvious resolution. Add multiple only when the command can realistically complete in different ways.

Common examples:

- Tooltip `ShowAfterDelay` resolves to `Ui.Tooltip.ElapsedShowDelay({ version })`.
- Floating components with anchor commands should resolve to their `CompletedAnchorMount` message if exposed and deterministic.
- Focus commands should resolve to the primitive’s `CompletedFocus*` message if exposed and useful.
- Animation commands should resolve through the primitive’s animation completion message only when the required message shape is clear.

## Color And Theme Checks

- Previews should render inside the preview shell’s theme scope. Do not add one-off hardcoded light/dark classes inside preview examples.
- Use DS components and semantic tokens in example markup.
- If a preview needs custom layout, use neutral layout classes for spacing/sizing only; keep colors semantic.
- Test both light and dark modes visually for new previews.

## Review Checklist

- Does the module have `States` and `Replay` where the component is interactive?
- Do scenarios actually change the rendered UI?
- Are scenarios deep enough to exercise real behavior?
- Are all commands produced by expected interactions resolvable?
- Does `Message` include all preview messages?
- Does `bun run --cwd packages/client-ds typecheck` pass?
