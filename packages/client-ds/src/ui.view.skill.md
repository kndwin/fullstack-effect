# Client DS View Patterns

Use this when creating or reviewing `*.view.ts` files in `packages/client-ds/src`.

## Architecture

- Wrap Foldkit headless primitives from `Ui.*`; do not replace them with React/Radix primitives.
- Keep wrappers small and typed. The view wrapper should provide styling, ergonomic props, and a `toView` callback when the Foldkit primitive is renderless.
- Export Foldkit helpers beside the wrapper when useful: `initX`, `updateX`, `XModel`, `XMessage`.
- Prefer direct package exports to implementation files unless a component already has an established `index.ts`.
- Keep component state owned by Foldkit submodels. Do not add parallel local state in the DS wrapper.

## Color Tokens

Use semantic Tailwind tokens from `theme.css`, not raw Radix variables or hardcoded color utilities in component views.

Radix scale intent:

- Step `1`: app background.
- Step `2`: subtle background and canvas/card alternatives.
- Step `3`: normal UI element background.
- Step `4`: hovered UI element background.
- Step `5`: active or selected UI element background.
- Step `6`: subtle borders/separators for non-interactive surfaces.
- Step `7`: interactive component borders and focus rings.
- Step `8`: hovered/stronger interactive borders.
- Step `9`: solid/accent backgrounds.
- Step `10`: hover state for solid/accent backgrounds.
- Step `11`: low-contrast text.
- Step `12`: high-contrast text.

Semantic mapping expectations:

- App/page shell: `bg-background text-foreground`.
- Cards/popovers/panels: `bg-card text-card-foreground border-border` or `bg-popover text-popover-foreground border-border`.
- Normal subtle controls: `bg-surface`, `bg-secondary`, or `bg-muted`.
- Hover on subtle controls: `hover:bg-accent`, `hover:bg-surface-hover`, or `hover:bg-surface-active` depending on component semantics.
- Active/selected subtle states: prefer `bg-accent text-accent-foreground` or `bg-surface-active`; avoid solid primary unless selection is meant to be a strong committed action.
- Interactive borders: `border-input`; hover borders use `hover:border-input-hover`.
- Non-interactive borders/separators: `border-border` or `bg-border`.
- Primary action: `bg-primary text-primary-foreground hover:bg-primary-hover`.
- Destructive action: `bg-destructive text-destructive-foreground hover:bg-danger-hover`.
- Destructive surfaces: `border-danger-border bg-danger-surface text-danger`.
- Low-contrast copy: `text-muted-foreground`.
- High-contrast copy: `text-foreground` or component foreground token.
- Focus: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`.

Avoid these in DS views:

- Raw `slate-*`, `blue-*`, `red-*`, `gray-*`, `neutral-*`, `white`, or `black` Tailwind classes, except rare one-off glyphs where semantic tokens do not apply.
- Solid `bg-primary` for selected listbox/menu rows by default. Use subtle selected states (`bg-accent`) unless the component is an action button or strong selected card.
- Non-semantic dark mode classes in component views. Theme switching should come from semantic tokens and preview/app theme scopes.

## Class Patterns

Base interactive control shape:

```ts
"inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-disabled:pointer-events-none data-disabled:opacity-50";
```

Floating panel shape:

```ts
"z-50 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg outline-none";
```

Subtle selectable row shape:

```ts
"rounded-sm px-2 py-1.5 text-sm outline-none data-active:bg-accent data-active:text-accent-foreground data-selected:bg-accent data-selected:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50";
```

Card/surface shape:

```ts
"rounded-lg border border-border bg-card text-card-foreground shadow-sm";
```

## Foldkit Integration

- Spread Foldkit-provided attributes first, then consumer attributes, then `Class(...)` unless a primitive expects className fields.
- Preserve ARIA relationships by rendering all provided attribute groups. If optional description content is absent, still render an empty element or otherwise preserve the description attribute group when the primitive expects it.
- Use data attributes provided by Foldkit for state styling: `data-open`, `data-checked`, `data-active`, `data-selected`, `data-disabled`, `data-invalid`, `data-dragging`.
- Use `onSelected`, `onToggled`, or similar domain callbacks only when the wrapper intentionally supports domain-message usage; otherwise delegate submodel messages with `toParentMessage`.
- For generic primitives that require string item/tab/radio values, map ergonomic item objects to string values internally and keep lookup maps local to the view function.

## Review Checklist

- Does the wrapper use `Ui.*` and preserve all accessibility attributes?
- Are all colors semantic tokens aligned to Radix scale intent?
- Are selected/active states appropriately subtle unless they are actions?
- Are disabled, invalid, focus-visible, hover, and active states styled?
- Does the wrapper expose only the smallest useful prop surface?
- Does the package export point to the right implementation path?
