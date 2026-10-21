# @workspace/ui

Coachlore's shared interface: [shadcn/ui](https://ui.shadcn.com) components
built on [Base UI](https://base-ui.com), the Tailwind CSS 4 theme
(`src/styles/globals.css`) and the `cn` class-name helper.

## Why a separate package

It owns the look of Coachlore (components, design tokens and the theme) so
every app draws on one source. It knows React, Base UI and Tailwind, and
nothing about Next.js, routes, data or any app: its components present the
data they're given and never fetch it (see [AGENTS.md](../../AGENTS.md),
"Components").

## Folders

| Folder                      | Holds                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------- |
| `src/components/shadcn-ui/` | registry components, written by the shadcn CLI                                        |
| `src/components/`           | Coachlore's own shared compositions (see [Shared compositions](#shared-compositions)) |
| `src/hooks/`                | shared hooks: `use-mobile.ts`, the registry Sidebar's                                 |
| `src/lib/`                  | helpers: `utils.ts` exports `cn`; `type-colors.ts` the 18 types and their classes     |
| `src/styles/`               | the theme: `globals.css`                                                              |

Why it's laid out this way, and how Atomic Design's levels map onto it:
[ADR 0001](../../docs/adr/0001-ui-component-layout.md).

## Use

Add it to the app's `package.json`:

```json
"dependencies": {
  "@workspace/ui": "workspace:*"
}
```

Import by subpath, as the `exports` in `package.json` define:

| Import                                      | What it is                                                       |
| ------------------------------------------- | ---------------------------------------------------------------- |
| `@workspace/ui/components/shadcn-ui/<name>` | a component added with the shadcn CLI, for example `button`      |
| `@workspace/ui/components/<name>`           | a shared component of Coachlore's own, for example `empty-state` |
| `@workspace/ui/lib/utils`                   | the `cn` helper                                                  |
| `@workspace/ui/hooks/<name>`                | a shared hook, for example `use-mobile`                          |
| `@workspace/ui/globals.css`                 | the theme; import it once, in the app's root layout              |
| `@workspace/ui/postcss.config`              | the PostCSS config; re-export it from the app's PostCSS config   |

```tsx
import "@workspace/ui/globals.css"

import { Button } from "@workspace/ui/components/shadcn-ui/button"
```

The package ships TypeScript source with no build step: a
[Just-in-Time package](https://turborepo.dev/docs/core-concepts/internal-packages),
compiled by the app that imports it. The theme's `@source` lines tell Tailwind
to scan the apps and this package for class names.

## Adding components

Check the [shadcn/ui registry](https://ui.shadcn.com/docs/components) before
writing a component. Add one with the CLI at the version pinned in this
package's `package.json` (4.21.3 today), not `@latest` (AGENTS.md,
"Versions"). Run from this folder, `bunx shadcn` resolves this package's own
copy, which is that version, wherever Bun installed it
(`bunx --bun shadcn@4.21.3` fails on Windows with Bun 1.3.8: "Cannot find
package 'prompts'"):

```bash
cd packages/ui
bunx shadcn add <component> -c ../../apps/web
```

Four things the CLI does that aren't obvious (seen with 4.21.3):

- **`--dry-run` still changes files:** it deleted `.gitkeep` files in the
  target folders. Check `git status` after any CLI run, and restore with
  `git restore --source=HEAD --staged --worktree -- <path>`.
- **Registry components assume the icon library is installed:** they import
  `lucide-react` (the `iconLibrary` in `components.json`), but the CLI
  doesn't add it as a dependency. Keep `lucide-react` in `apps/web` and
  here, even before anything imports it.
- **Dependencies land in the app:** the CLI adds a component's packages
  (`cmdk`, say) to `apps/web/package.json`, though the component lives
  here. Move them to this package's `package.json`.
- **Hooks land in the app:** a hook a component needs (`use-mobile`) goes
  to `apps/web/hooks/`, the app's `hooks` alias, and the component imports
  it as `@/hooks/…`. Move it to `src/hooks/` and import it as
  `@workspace/ui/hooks/…`, so this package never reaches into an app.

`-c apps/web` runs the CLI in the app's folder, as
[shadcn's monorepo guide](https://ui.shadcn.com/docs/monorepo) asks.
Components such as `button` land in `packages/ui/src/components/shadcn-ui`,
because the `ui` alias in both `components.json` files points there; blocks
built from them, such as `login-01`, land in `apps/web/components`. Both
`components.json` files keep the same `ui` alias, `style`, `iconLibrary` and
`baseColor`.

How to change an added component, and when a composition becomes shared:
[AGENTS.md](../../AGENTS.md), "Interface" and "Components".

## Which component

Before writing markup, match each element to the registry. A raw
`<button>`, a bordered `<div>` or a styled `<span>` where one of these fits
is a defect.

| Element                         | Component                                                       |
| ------------------------------- | --------------------------------------------------------------- |
| A button                        | `Button`                                                        |
| A link that looks like a button | `Button` with its `render` prop (Base UI has no `asChild`)      |
| A list or a row                 | `Item`                                                          |
| A count, a status, a type       | `Badge`; a Pokémon type is `TypeBadge`                          |
| A container                     | `Card`                                                          |
| Nothing to show, an error       | `EmptyState` (on `Empty`), with `role="alert"` for an error     |
| Loading                         | `Skeleton`, the size and shape of the content                   |
| A message                       | `Alert`                                                         |
| A link in a menu                | `DropdownMenuLinkItem` (Base UI's `Menu.LinkItem`, added here)  |
| A menu                          | `DropdownMenu`                                                  |
| A panel                         | `Sheet` (from the side), `Drawer` (from the bottom), `Dialog`   |
| A key                           | `Kbd`                                                           |
| A short notice that goes away   | `Toast` (Base UI's), never for something the person must act on |

Check what the registry has with the CLI's `search` and `docs` commands, and every component's states in
[spec 001](../../docs/specs/001-interface/spec.md) ("States every view has").

Three rules keep compositions honest
([DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) for knowledge,
[AHA](https://kentcdodds.com/blog/aha-programming) for look-alike code):

- A composition is thin: a few props, children or slots for the rest,
  compound components and explicit variants rather than boolean props.
- A component is never wrapped only to rename it.
- Code that only looks alike waits for its third use.

## What the theme and components expect

- **Fonts:** the theme's `--font-sans` and `--font-mono` are built from
  variables the app sets: `--font-interface` (Latin), `--font-code`
  (monospace) and, for a language Latin can't write, `--font-script`. A
  Devanagari page also gets more line height and no tightened tracking
  (`globals.css`, `:lang(hi)`).
- **Direction:** the app wraps the page in `DirectionProvider` (from
  `shadcn-ui/direction`) with the page's direction; Base UI reads it from
  there, not from `<html dir>`.
- **Labels:** no component writes interface text. A close button's name
  (`closeLabel` on `DialogContent`, `SheetContent`, `Toaster`), the
  Sidebar's names (`labels` on `SidebarProvider`), `CommandDialog`'s
  `title` and `description`, `Spinner`'s `label`, `Breadcrumb`'s
  `aria-label`, `Slider`'s `thumbLabels`, `ComboboxInput`'s `triggerLabel`
  (and `clearLabel` with `showClear`) and `ComboboxChip`'s `removeLabel` are
  required props, given in the page's language. ESLint
  rejects a written accessible name (`@workspace/eslint-config`,
  `interface-text.js`).

## Registry files edited

Where the design or the rules need it (AGENTS.md, "Interface"), each with a
comment at the change:

- The labels above, made props.
- `command.tsx`: `CommandDialog`'s title and description inside the popup,
  as Base UI's Dialog anatomy places them.
- `sheet.tsx`, `sidebar.tsx`, `drawer.tsx`: a physical `side` or
  `swipeDirection` (`left`, `right`) gets physical edges, so right-to-left
  pages don't put the border or the slide on the wrong side; the Sidebar's
  tooltip opens at `inline-end`.
- `toast.tsx`: swiped towards the nearer edge in either direction.
- `button.tsx`: transitions named, at `--duration-fast`, and the press
  nudge only without reduced motion.
- `dialog.tsx`, `label.tsx`: `DialogTitle` and `Label` at `leading-snug`,
  so Devanagari isn't clipped.
- `dropdown-menu.tsx`: `DropdownMenuLinkItem` added.
- `breadcrumb.tsx`: the ellipsis's hidden "More" removed (its wrapper is
  `aria-hidden`).
- `slider.tsx`: each thumb gets its `index` (Base UI needs it to
  server-render a range slider) and its name from `thumbLabels`.
- `combobox.tsx`: the trigger, clear and chip-remove buttons get their
  names from the label props above; the registry's had none.
- `input-group.tsx`, `scroll-area.tsx`, `hooks/use-mobile.ts`: lint fixes;
  `label.tsx`: `label-has-associated-control` off for its one line, since
  the control comes from where it's used.

## Shared compositions

Coachlore's own components, in `src/components/`, built from the registry
ones. Each became shared on its third use; each presents what it's given and
knows nothing about Next.js or routes, so actions (a link, a button) come in
as `children`.

| Composition  | For                                                                                                                                                                                                                                                                                                                                | Used by                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `TypeBadge`  | a Pokémon type: its name (`children`, in the page's language) on its colour, from `type-colors.ts`. Shared from the start, since nearly every screen after spec 001 shows types (spec 001's plan)                                                                                                                                  | `apps/web`: the fixture pages                                                              |
| `EmptyState` | anything with nothing to show: an empty list, no results, a page that isn't there, an error. A title (its heading level set by `titleAs`, `h2` by default, `h1` when it is the whole page), a description, an optional `media` icon, and the actions as `children`; built on `Empty`. Pass `role="alert"` when it reports an error | `apps/web`: `not-found.tsx`, and `error.tsx` and `global-error.tsx` (through `ErrorState`) |

## Status

Internal and private (`"private": true`): never published. Nothing to build;
`bun run lint`, `bun run typecheck` and `bun run test` cover it. The test,
`src/lib/contrast.test.ts`, recomputes every colour pair in `globals.css`
and fails below WCAG's contrast minimums.
