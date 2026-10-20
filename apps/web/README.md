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

| Folder        | What goes in it                                                             | Now                                                                                                                                                                                                                                                                                                                                                                |
| ------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/`        | routes: layouts, pages and other route files                                | the root layout, the starter page, the error and not-found pages, and the metadata files (icons, share image, manifest, robots, sitemap)                                                                                                                                                                                                                           |
| `components/` | components only this app uses; one feature's own in `components/<feature>/` | `theme-provider.tsx`: light and dark themes; `theme-hotkey.tsx`: the `d` key that switches them, and whether it's on, remembered per browser (WCAG 2.1.4 requires a way to turn a single-key shortcut off); `theme-toggle.tsx`: the theme menu (light, dark or system, and the `d` key on or off); `error-state.tsx`: what `error.tsx` and `global-error.tsx` show |
| `hooks/`      | hooks used only by this app                                                 | empty                                                                                                                                                                                                                                                                                                                                                              |
| `lib/`        | helpers used only by this app                                               | `site.ts`: the site's name, title, description, colours and address, the one source for metadata; `fonts.ts`: the fonts, loaded once ([font definitions file](https://nextjs.org/docs/app/api-reference/components/font#using-a-font-definitions-file))                                                                                                            |

Imports starting with `@/` resolve from this folder, for example
`@/components/theme-provider`. Shared components belong in
[`@workspace/ui`](../../packages/ui). `components.json` is the shadcn CLI's
configuration for the app. Where each kind of component goes, and why:
[ADR 0001](../../docs/adr/0001-ui-component-layout.md).

## Rendering and errors

The app uses Cache Components, Next.js 16's rendering model: data is dynamic
by default and cached where marked with `use cache`, and each page's static
shell is prerendered ([ADR 0003](../../docs/adr/0003-rendering-and-production-defaults.md)).

| File                   | Shows                                                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| `app/not-found.tsx`    | any unknown address, with a 404 status and `noindex`, and a link home                                       |
| `app/error.tsx`        | an error in a page, with Try again (`retry`, which fetches and renders the page again)                      |
| `app/global-error.tsx` | an error in the root layout itself; it replaces the layout, so it brings its own `<html>`, styles and fonts |

No `loading.tsx`: Next.js advises Suspense boundaries close to the data that
waits, not one around the whole page.

## Titles and descriptions

Every page has a title and a description, written with Next.js's
[Metadata API](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
from [`lib/site.ts`](lib/site.ts):

- **The root layout** sets the defaults: the home page's title, the title
  template `%s · Draftboard`, the description, Open Graph and the Twitter card.
  The share image is `app/opengraph-image.png` (with its alt text in
  `opengraph-image.alt.txt`); Twitter's card reuses it.
- **A static page** exports `metadata` with its own title (just the page's
  name: the template adds `· Draftboard`), a one-sentence description of what
  the page offers, unique across the site, and its own path twice: as
  `alternates.canonical`, and as `openGraph.url` in
  `openGraph: { ...OPEN_GRAPH, url }` (Open Graph requires `og:url`). Neither
  is set in the layout: Next.js merges metadata shallowly, so every page would
  inherit the layout's.
- **A page whose title depends on data** (a Pokémon, a league, a move) uses
  `generateMetadata`, with the data request wrapped in React's `cache()` so
  the page and its metadata fetch once.
- **A page behind sign-in** (a league's settings, `/me`) gets a title only, and
  `robots: { index: false }`.
- **Open Graph:** a page that sets `openGraph` replaces the layout's whole
  object, so it spreads `OPEN_GRAPH` from `lib/site.ts` back in. A page in a
  folder below `app/` also loses the share image that way, so it lists it in
  `images` too, or adds its own `opengraph-image.png`.
- **The sitemap** ([`app/sitemap.ts`](app/sitemap.ts)) lists every public
  page; Dex pages are added from the data once it exists.

| Page      | Title                                    | Description                                                                                                                    |
| --------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `/`       | `Draftboard · Pokédex and draft leagues` | A fast, mobile-first Pokédex and a home for Pokémon draft leagues: live drafts, schedules, trades, standings and match recaps. |
| not found | `Page not found · Draftboard`            | There’s no page at this address on Draftboard.                                                                                 |

Update the table when a page is added.

## Environment variables

Each one is documented in [`.env.example`](.env.example), as
[AGENTS.md](../../AGENTS.md) ("Files") requires.

| Variable               | What it is                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL` | the site's public address; defaults to `http://localhost:3000`, so a production build must set it (Next.js inlines it at build time) |

## See also

- [README](../../README.md): what Draftboard is.
- [AGENTS.md](../../AGENTS.md): how to work in this repository.
- [`@workspace/ui`](../../packages/ui): the shared components and theme.
