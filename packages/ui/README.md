# @workspace/ui

Coachlore's shared interface: [shadcn/ui](https://ui.shadcn.com) components
built on [Base UI](https://base-ui.com), the Tailwind CSS 4 theme
(`src/styles/globals.css`) and the `cn` class-name helper. Today it holds three
registry components: `Button`, `DropdownMenu` and `Empty`.

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
| `src/hooks/`                | shared hooks (none yet)                                                               |
| `src/lib/`                  | helpers: `utils.ts` exports `cn`                                                      |
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
| `@workspace/ui/hooks/<name>`                | a shared hook (none yet)                                         |
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
writing a component. Add one with the CLI, from the repository root, at
the version pinned in this package's `package.json` (4.21.3 today), not
`@latest` (AGENTS.md, "Versions"):

```bash
bunx --bun shadcn@4.21.3 add <component> -c apps/web
```

Two things the CLI does that aren't obvious (seen with 4.21.3):

- **`--dry-run` still changes files:** it deleted `.gitkeep` files in the
  target folders. Check `git status` after any CLI run, and restore with
  `git restore --source=HEAD --staged --worktree -- <path>`.
- **Registry components assume the icon library is installed:** they import
  `lucide-react` (the `iconLibrary` in `components.json`), but the CLI
  doesn't add it as a dependency. Keep `lucide-react` in `apps/web` and
  here, even before anything imports it.

`-c apps/web` runs the CLI in the app's folder, as
[shadcn's monorepo guide](https://ui.shadcn.com/docs/monorepo) asks.
Components such as `button` land in `packages/ui/src/components/shadcn-ui`,
because the `ui` alias in both `components.json` files points there; blocks
built from them, such as `login-01`, land in `apps/web/components`. Both
`components.json` files keep the same `ui` alias, `style`, `iconLibrary` and
`baseColor`.

How to change an added component, and when a composition becomes shared:
[AGENTS.md](../../AGENTS.md), "Interface" and "Components".

## Shared compositions

Coachlore's own components, in `src/components/`, built from the registry
ones. Each became shared on its third use; each presents what it's given and
knows nothing about Next.js or routes, so actions (a link, a button) come in
as `children`.

| Composition  | For                                                                                                                                                                                                                                                                                                                                | Used by                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `EmptyState` | anything with nothing to show: an empty list, no results, a page that isn't there, an error. A title (its heading level set by `titleAs`, `h2` by default, `h1` when it is the whole page), a description, an optional `media` icon, and the actions as `children`; built on `Empty`. Pass `role="alert"` when it reports an error | `apps/web`: `not-found.tsx`, and `error.tsx` and `global-error.tsx` (through `ErrorState`) |

## Status

Internal and private (`"private": true`): never published. Nothing to build;
`bun run lint` and `bun run typecheck` cover it.
