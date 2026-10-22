# 1. UI component layout

- Status: Accepted
- Date: 2026-10-20

## Context

The shadcn CLI writes each component into the folder that the `ui` alias in
`components.json` names. shadcn's monorepo guide places them directly in the
shared package: "the CLI will install the button component under
`packages/ui`" ([shadcn/ui, Monorepo](https://ui.shadcn.com/docs/monorepo)).

Coachlore needs three kinds of component code: registry output from the CLI,
its own compositions shared across features, and compositions only one
feature uses. Two rules constrain where they go: shared UI components never
fetch data or know routes, and a composition becomes shared on its third use
([AGENTS.md](../../AGENTS.md), "Components").

The owner considered Atomic Design (atoms, molecules, organisms, templates,
pages) as the folder structure.

## Decision

Folders say where code comes from and who uses it:

| Folder                                  | Holds                                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------------- |
| `packages/ui/src/components/shadcn-ui/` | registry output, written by the CLI (the `ui` alias in both `components.json` files)  |
| `packages/ui/src/components/`           | Coachlore's own shared compositions                                                   |
| `apps/web/components/<feature>/`        | compositions only that feature uses                                                   |
| `apps/web/components/` (its root)       | the app's own compositions used across its features (the page container, error state) |
| `apps/web/app/`                         | layouts and pages (Next.js)                                                           |

Atomic Design is the vocabulary, not the folders. Its levels map onto them:

| Level     | Where it lives                                                                              |
| --------- | ------------------------------------------------------------------------------------------- |
| Atoms     | the theme's tokens (`globals.css`) and simple registry components (Button, Badge, Input)    |
| Molecules | registry composites (Item, Field, Card) and small shared compositions                       |
| Organisms | feature compositions in `apps/web/components/<feature>/`; shared ones after their third use |
| Templates | Next.js layouts (`layout.tsx`)                                                              |
| Pages     | Next.js pages (`page.tsx`): Server Components with the real data                            |

## Alternatives considered

- **shadcn's default: registry output directly in
  `packages/ui/src/components/`.** Generated and hand-written components
  would share one folder, with nothing to show which files the CLI may
  overwrite.
- **Atomic Design as folders (`atoms/`, `molecules/`, `organisms/`,
  `templates/`).** Rejected:
  - the CLI writes every component to one folder, so registry files would be
    sorted by hand after each install;
  - templates and pages are Next.js layouts and pages, which belong to the
    app; `packages/ui` can't hold them;
  - Next.js already uses "template" for something else: a
    [`template.js`](https://nextjs.org/docs/app/api-reference/file-conventions/template)
    file resets its children's state on navigation;
  - reclassifying a component (molecule or organism?) changes its import path.

  Atomic Design's author describes it as "a mental model" and "not rigid
  dogma", and encourages "extending atomic design to fit the language and
  mental models of your team"
  ([Atomic Design, chapter 2](https://atomicdesign.bradfrost.com/chapter-2/);
  [Extending atomic design](https://bradfrost.com/blog/post/extending-atomic-design/)).

- **Feature folders only, with no shared components.** Each feature would
  rebuild the same look, and the theme would lose its single source.

## Consequences

- Registry components are imported from
  `@workspace/ui/components/shadcn-ui/<name>`, Coachlore's own shared ones
  from `@workspace/ui/components/<name>`.
- Both `components.json` files keep the same `ui` alias. A dry run
  (`shadcn add card --dry-run`) confirmed new components land in
  `shadcn-ui/`.
- This departs from the layout in shadcn's monorepo guide; this record is the
  reason.
- Whether registry files are edited after install is a separate decision,
  open in [the interface standards plan](../plans/interface-standards.md).
- Reviews and docs may use the atomic levels as names ("the type badge is an
  atom") without moving files.

## Sources

- [shadcn/ui, Monorepo](https://ui.shadcn.com/docs/monorepo)
- [Atomic Design, chapter 2](https://atomicdesign.bradfrost.com/chapter-2/)
- [Extending atomic design](https://bradfrost.com/blog/post/extending-atomic-design/)
- [Next.js, `template.js`](https://nextjs.org/docs/app/api-reference/file-conventions/template)
- [AGENTS.md](../../AGENTS.md), "Components"
