# web

Draftboard's web app, built with [Next.js](https://nextjs.org) 16 on the App
Router and React 19. Today it shows the scaffold's starter page; the Dex and
Leagues are planned to live here (see the [root README](../../README.md)).

## Run

From the repository root:

```bash
bun install
bun run dev
```

The app runs at <http://localhost:3000>. The checks to run before a change is
done are in [AGENTS.md](../../AGENTS.md), "Commands".

## Folders

| Folder        | What goes in it                                                                              | Now                                                     |
| ------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `app/`        | routes: layouts, pages and other route files                                                 | the root layout, the starter page and the favicon       |
| `components/` | components used only by this app; shared ones belong in [`@workspace/ui`](../../packages/ui) | `theme-provider.tsx`: light and dark themes (press `d`) |
| `hooks/`      | hooks used only by this app                                                                  | empty                                                   |
| `lib/`        | helpers used only by this app                                                                | empty                                                   |

Imports starting with `@/` resolve from this folder, for example
`@/components/theme-provider`. `components.json` is the shadcn CLI's
configuration for the app.

## Environment variables

None yet. When the app needs one, it's documented in `.env.example`, as
[AGENTS.md](../../AGENTS.md) ("Files") requires.

## See also

- [README](../../README.md): what Draftboard is.
- [AGENTS.md](../../AGENTS.md): how to work in this repository.
- [`@workspace/ui`](../../packages/ui): the shared components and theme.
