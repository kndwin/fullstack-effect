---
name: client-module-view
description: House rules for app module view and preview files in apps/client-web. Use when creating or reviewing Foldkit UI for product modules.
license: Apache-2.0
metadata:
  scope: apps/client-web
  prefix: "src/module/"
---

# Client Module Views

App module views compose client-ds components and semantic design tokens. They should not define a parallel visual system.

## Do

- Use `@qaveai/client-ds/*` components for common controls: `Button`, `Input`, `Card`, `Fieldset`, `Listbox`, `Dialog`, etc.
- Use spacing tokens from `packages/client-ds/src/theme.css`: `gap-[var(--space-3)]`, `p-[var(--space-card)]`, `px-[var(--space-control-x)]`.
- Use font sizes through client-ds typography defaults or themed text tokens. Preview scaling must affect both component size and text size.
- Use semantic color tokens: `bg-card`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-primary-foreground`.
- Keep app view classes focused on layout and composition.

## Don't

- Don't use raw Tailwind spacing utilities in app views/previews: `gap-4`, `p-5`, `px-3`, `py-2`, `m-0`, etc.
- Don't hand-roll buttons, inputs, cards, or panels when a client-ds component exists.
- Don't use raw color scales like `slate-*`, `blue-*`, `red-*`, `white`, or `black`.
