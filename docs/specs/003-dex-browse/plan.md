# 003: Dex browse, the plan

## Builds on

- **Spec 001:** the shell, the search palette, the states, the type badge
  and its tokens.
- **Spec 002:** `packages/dex` and its committed dataset: the browser index,
  each game's Pokédex, the sprites.
- **ADR 0006:** the Dex never calls the server; its pages are built from the
  dataset; "Offline Dex" is decided here.

## Packages and files

| Path                                                 | What                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/dex/src/filter.ts`                         | `dexFilter` (a Zod schema, type `DexFilter`), `filterForms(index, filters)` and `sortForms(forms, sort)`: pure, over the browser index. Zod 4.6.5 goes into the workspace catalog (the newest release at least two weeks old); it's a validation library, not a framework or storage, so the core rule holds. Spec 012 parses the model's filters with the same schema |
| `apps/web/lib/dex.ts`                                | The web app's only reader of `packages/dex`: each read wrapped in `"use cache"`                                                                                                                                                                                                                                                                                        |
| `apps/web/lib/dex-query.ts`                          | Filters and sort to and from the query string (`parseDexQuery`, `toDexQuery`); unknown values dropped                                                                                                                                                                                                                                                                  |
| `apps/web/app/[lang]/page.tsx`                       | Home                                                                                                                                                                                                                                                                                                                                                                   |
| `apps/web/app/[lang]/dex/page.tsx`                   | Browse the Dex                                                                                                                                                                                                                                                                                                                                                         |
| `apps/web/app/[lang]/games/[game]/page.tsx`          | A game's Dex; `generateStaticParams` lists every game with a Pokédex, for each language from the layout's params; an unknown game is a 404 from the Proxy (spec 004, "Builds on")                                                                                                                                                                                      |
| `apps/web/components/dex/dex-browser.tsx`            | Client: reads the query, loads the index, filters, sorts, renders grid or list                                                                                                                                                                                                                                                                                         |
| `apps/web/components/dex/form-card.tsx`              | One card: sprite, number, name, type badges; a link                                                                                                                                                                                                                                                                                                                    |
| `apps/web/components/dex/dex-filters.tsx`            | The filter panel (desktop) and `Drawer` from the bottom (phone), and the chips; each filter's control named in "Components" below                                                                                                                                                                                                                                      |
| `apps/web/components/dex/recently-viewed.tsx`        | Client: reads and writes the recently viewed list in `localStorage` (guarded with try/catch)                                                                                                                                                                                                                                                                           |
| `apps/web/components/offline/offline-notice.tsx`     | Client: the offline Alert, from `navigator.onLine` and the `online`/`offline` events                                                                                                                                                                                                                                                                                   |
| `apps/web/components/offline/sw-register.tsx`        | Client: registers the service worker, in production only                                                                                                                                                                                                                                                                                                               |
| `apps/web/app/sw.js/route.ts`                        | The service worker, served by a static Route Handler so its cache name carries the deployment's commit                                                                                                                                                                                                                                                                 |
| `apps/web/app/manifest.ts`, `apps/web/public/icons/` | The manifest (exists) gains `icon-192.png` and `icon-512.png`, rendered from `icon.svg` at build of the icons, committed                                                                                                                                                                                                                                               |
| `apps/web/proxy.ts`                                  | The matcher also excludes `sw.js`, `dex-data/` and `icons/` (`dex-images/` already, since spec 002): Proxy runs on "assets in the `public/` folder" (bundled docs: `proxy.md`), so next-intl would redirect them to `/en/…`, a 404. `proxy.test.ts` checks each                                                                                                        |
| `turbo.json`                                         | The build's `env` gains `VERCEL_GIT_COMMIT_SHA`: in Strict Mode a task sees "only those that are specified in the `globalEnv` and `env` keys" (Turborepo's `using-environment-variables.mdx`), so without it every deployment's cache is named `dev`                                                                                                                   |

## Components

All from the shadcn registry (`packages/ui/README.md`, "Which component").
Added with the CLI into `packages/ui`: `Toggle Group` for grid or list,
`Select` for sort and the game and version pickers, `Combobox` for ability,
`Slider` for the stat ranges (the registry has no number field). Already
installed: `Drawer` for the filters on a phone, `Badge`, `Button`, `Input`
and `Alert`. A card is a `Link`.

## Data model

The browser index is spec 002's `forms.json`: one `FormSummary` per form
(002's plan, "Data model"), with no learnsets and no text. It carries what
the grid, the filters and search need: key, Pokémon, number, name, types,
stats, abilities, generation, `kind` (default, regional, Mega, Gigantamax,
other; the "Forms" filter), the games whose Pokédex lists it, and `sprite`
(`/dex-images/sprites/<form>.webp`, or null). The query string's stat keys
(`hp` … `spe`) map onto 002's stat names.

Each game's Pokédexes (spec 002): its key, name, versions, and each of its
Pokédexes in the game's order, with the ordered list of
`{ form, regionalNumber, onlyIn?: version }`, and a flag for incomplete
data. `/games/[game]` shows them on one page, a section per Pokédex with
its own numbers (Scarlet and Violet: Paldea, then Kitakami, then
Blueberry), the owner's call of 2026-10-22. "Browse by game" opens the
newest game that has a Pokédex in the data.

The query string (all optional; lists are comma-separated):

| Key                   | Example                | Meaning                                  |
| --------------------- | ---------------------- | ---------------------------------------- |
| `q`                   | `rot`                  | name contains, or number equals          |
| `type`                | `steel,fairy`          | Type                                     |
| `weak`                | `ice`                  | Weak to                                  |
| `resist`              | `fairy`                | Resists                                  |
| `game`                | `scarlet-violet`       | Game (on `/dex` only)                    |
| `gen`                 | `8,9`                  | Generation                               |
| `ability`             | `levitate`             | Ability                                  |
| `hp` … `spe`, `total` | `90-`, `-80`, `60-100` | stat ranges, inclusive                   |
| `forms`               | `all`                  | Forms; absent means default              |
| `sort`                | `spe`, `-total`        | sort key; a leading `-` means descending |
| `view`                | `list`                 | grid (absent) or list                    |
| `version`             | `scarlet`              | version picker, on `/games/[game]` only  |

## Rendering

- `/dex` and `/games/[game]` are static pages. The interactive part reads
  the query with `useSearchParams`, so it sits in a `<Suspense>` boundary,
  as Next.js requires for a prerendered page ([useSearchParams](https://nextjs.org/docs/app/api-reference/functions/use-search-params)).
  The boundary's fallback is the server-rendered first 48 default forms,
  with the same card sizes, so the first paint is real content and nothing
  shifts when the client takes over.
- The index is loaded by a dynamic `import()` of its JSON module, so it's a
  hashed chunk under `/_next/static/`, which the browser and the service
  worker cache.
- The browser holds the view in state and mirrors it in the address: a
  filter change with `window.history.pushState`, so Back undoes it; typing
  with `replaceState`. Next.js documents both as updating the address
  "without reloading the page" and integrating "with `useSearchParams`"
  (bundled docs: `04-linking-and-navigating.md`); neither makes a request
  (criterion 4). The address still wins when it changes from elsewhere
  (Back, Forward, a link to another view). Measured: reading the view from
  the address alone, a control's change waited for Next.js's transition,
  about 80 ms at 4× CPU slowdown, before it could paint.
- The changed control paints first; the results follow after the next
  frame, as a transition (`useAfterPaint` in `dex-browser.tsx`), so a
  change responds before the grid re-renders: web.dev's "Optimize INP",
  yield after the visual feedback. The grid, the list and each type
  checkbox are memoized behind stable handlers, so the control's own render
  skips them.
- The grid is virtualised: only the rows on screen and three beyond are in
  the page (see "Decisions", "A long grid"). Each card carries
  `aria-posinset` and `aria-setsize`, so a screen reader hears its place in
  the whole list. The static fallback is a plain grid with the same
  columns.
- Cards and list rows prefetch on intent: pointed at, focused or touched
  (`intent-link.tsx`; see "Decisions", "Prefetching").
- Sprites are plain `<img>` elements with width, height,
  `loading="lazy"` and `decoding="async"` (see "Decisions", "Images").
  The first row's sprites may be worth loading eagerly for LCP; task 9's
  performance pass measures it.
- Home is static; recently viewed renders on the client after hydration in
  a box of fixed height (hidden when empty, before first paint, from a
  class set by an inline check of `localStorage`, so it doesn't shift).

## The service worker

| Request                                                                                                                                                      | Strategy                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `/_next/static/*` (the form index included), `/dex-images/*`, `/dex-data/*` (spec 005's learnable moves)                                                     | Cache first (file names are hashed, or fixed for a deployment)              |
| Documents and RSC requests for `/<lang>/`, `/<lang>/dex*`, `/<lang>/games/*`, `/<lang>/types`, `/<lang>/moves*`, `/<lang>/abilities/*`, `/<lang>/team-check` | Network first, saved on success, the saved copy when offline                |
| Anything else (Leagues, `/api/*`, `/me`)                                                                                                                     | Network only                                                                |
| A document with no saved copy, offline                                                                                                                       | `/<lang>/offline`, the language taken from the request's first path segment |
| `/` (the manifest's `start_url`, which has no language), offline                                                                                             | The saved `/<lang>/` for the language `sw-register` last posted, else `en`  |

- On install it saves nothing language-specific; when a page loads,
  `sw-register` posts its language to the worker, which then saves
  `/<lang>/`, `/<lang>/dex` and `/<lang>/offline` (spec 001's page, which
  this spec only precaches and serves) for that language; everything else
  is saved as it's used, so the saved pages are the language in use. The
  data under `/dex-data/*` and the sprites are language-neutral and saved
  once.
- The cache name includes the deployment's commit (`VERCEL_GIT_COMMIT_SHA`,
  passed to the build by `turbo.json`; `dev` locally; `offline-update.spec.ts`
  sets two different values). On activate, caches from other deployments are deleted, so
  a new deploy replaces the old copy whole (spec, requirement 5.4).
- `/sw.js` is served with `Cache-Control: no-cache, no-store, must-revalidate`
  and `Content-Type: application/javascript; charset=utf-8`, as Next.js's
  PWA guide shows, and registered with `updateViaCache: "none"`.
- The site's CSP already allows it: a worker script falls under
  `script-src 'self'`. `/sw.js` also gets its own policy,
  `default-src 'self'; script-src 'self'`, as the PWA guide shows.

## API

None: the Dex never calls the server (ADR 0006).

## Events

None.

## Jobs

None.

## Decisions

| Item                         | What the docs say (quoted)                                                                                                                                                                                                                                                            | Options                                                                                                           | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Offline caching              | Next.js's PWA guide: "For full service-worker-based offline caching, one option is [Serwist]"; `useOffline` is "experimental" and covers "connectivity detection and automatic retry", not caching (bundled docs: `02-guides/progressive-web-apps.md`, `04-functions/use-offline.md`) | A small service worker of our own; Serwist; `experimental.useOffline`                                             | Our own service worker (the table above): one file, no dependency, rules we can read. Task 6 checks that client-side navigation works offline; if it can't without matching the router's requests, Serwist replaces it, recorded here                                                                                                                                                                                                                                                                                                                                                                       |
| Connectivity                 | `use-offline.md`: `navigator.onLine` "still reports `true` for a device on WiFi with no upstream internet"; `useOffline` is "experimental"                                                                                                                                            | `navigator.onLine` and its events; `useOffline`                                                                   | `navigator.onLine` and the `online`/`offline` events: stable, no experimental flag. A connected Wi-Fi with no internet shows no notice; pages still come from the saved copy when the network fails                                                                                                                                                                                                                                                                                                                                                                                                         |
| Images                       | Vercel Hobby includes "First 5,000" image transformations ([Hobby](https://vercel.com/docs/plans/hobby))                                                                                                                                                                              | `next/image` optimisation; plain images at their final size                                                       | Sprites are prepared at their display size by spec 002's import and served as they are, so the free limit never applies. Changed in task 4 from `next/image` with `unoptimized` to a plain `<img>`: with nothing to optimise, `next/image`'s client code on each new card added to a filter change (spec 003, criterion 5); the one artwork on a form's page (spec 004) keeps `next/image`                                                                                                                                                                                                                  |
| Card images, sharp on phones | –                                                                                                                                                                                                                                                                                     | The 96 px pixel sprite, scaled crisply (`image-rendering: pixelated`); the official artwork at 2× and 3× the card | The owner's call (2026-10-22): the official artwork, prepared at 192 and 288 px WebP and chosen by the browser (`srcset`), self-hosted as before. The 96 px sprite blurs on a 3× phone screen, which needs 288 pixels for the card. Hot-linking `raw.githubusercontent.com` was considered and kept out: GitHub's raw files aren't a CDN and may be throttled, it adds a connection per page, sends visitors' addresses to GitHub, breaks the offline Dex's caching and needs the CSP widened, and `master` isn't pinned (ADR 0006: "never hot-linked"). Done in task 9; about 15 MB more in the repository |
| A long grid                  | Spec 001's wireframe: "The grid renders only what's on screen"                                                                                                                                                                                                                        | Render every card with `content-visibility`; a virtualised list                                                   | Virtualised with TanStack Virtual (`@tanstack/react-virtual` 3.14.13, the newest release two weeks old; MIT), because criterion 5 failed without it. Measured at 4× CPU slowdown with every form showing: rendering all 1,339 cards, a filter change took 250 to 944 ms; hiding rather than removing them, still 216 to 696 ms, most of it the browser laying out the grid. Virtualised, with the changes below, most changes took 40 to 170 ms, with two runs at 256 and 336 ms on a machine also running a dev server. Ctrl+F finds only the cards on screen; the filter box is the Dex's search          |
| Prefetching                  | `optimizing-prefetching.md`: for "a grid of cards", "Prefetch on intent instead"; `prefetching.md`, "Hover-triggered prefetch": "Using `false` before intent disables the App Shell prefetch"                                                                                         | The default `<Link>`; prefetch on intent                                                                          | On intent: `prefetch={false}` until a card is pointed at, focused or touched, then `true`. Measured: the default `<Link>` sent one route-tree request (`_tree`) per card that scrolled in, 24 on one filter change, since each form's address is its own URL; that broke criterion 4 and slowed the change. A tap on a phone, with no hover, prefetches at the touch                                                                                                                                                                                                                                        |

## Tests

| Acceptance criterion | Test                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1, 2                 | `packages/dex/src/filter.test.ts`: counts and filter results against values computed from the dataset in the test; `packages/playwright-web/e2e/dex-filters.spec.ts` for the same values through the interface                                                                                                                                                                              |
| 3                    | `apps/web/lib/dex-query.test.ts` (round trip, unknown values dropped); `e2e/dex-filters.spec.ts` (new tab, Back)                                                                                                                                                                                                                                                                            |
| 4                    | `e2e/dex-filters.spec.ts`: no document, RSC or data request after the index has loaded while filtering (newly shown cards' sprites load, lazily)                                                                                                                                                                                                                                            |
| 5                    | `e2e/dex-performance.spec.ts`: 4× CPU slowdown through the Chrome DevTools Protocol; the Event Timing entry's duration for a filter change under 200 ms                                                                                                                                                                                                                                     |
| 6                    | `e2e/dex-performance.spec.ts`: LCP and layout shifts from `PerformanceObserver`, at 4× CPU slowdown and a slow network profile; the owner also checks with Lighthouse's mobile profile                                                                                                                                                                                                      |
| 7                    | `e2e/offline.spec.ts`: a production build, one visit, then `context.setOffline(true)`                                                                                                                                                                                                                                                                                                       |
| 8                    | `e2e/offline-update.spec.ts`: two production builds with different commits, served in turn on one port                                                                                                                                                                                                                                                                                      |
| (games)              | `e2e/game-dex.spec.ts` on a real game (Scarlet and Violet): regional order, the version picker, and the "Only in [version]" badge from `onlyIn`                                                                                                                                                                                                                                             |
| 9                    | `e2e/search-palette.spec.ts`                                                                                                                                                                                                                                                                                                                                                                |
| 10, 11               | `e2e/a11y.spec.ts` (axe, both themes, 360 and 1280 px), keyboard paths, and the live region's text                                                                                                                                                                                                                                                                                          |
| 13, 14               | `e2e/dex-languages.spec.ts`: `/en/dex` and `/hi/dex` with the same query show the same cards; Hindi labels from the dictionary, English names; `hreflang` links; the build's route table lists both languages. `e2e/offline.spec.ts` repeats criterion 7 in Hindi                                                                                                                           |
| 12                   | The icons follow Next.js's [progressive web apps guide](https://nextjs.org/docs/app/guides/progressive-web-apps) (192 × 192 and 512 × 512 in `manifest.ts`); Lighthouse's installability audit runs once on the production build. `e2e/manifest.spec.ts`: fetches `/manifest.webmanifest`, then each icon (200, `image/png`, the stated size); the owner checks Lighthouse's installability |
| 15                   | `e2e/dex-filters.spec.ts` in `hi`: the query "गारचोम्प" shows the "names are searched in English" message from the dictionary, not the plain empty state                                                                                                                                                                                                                                    |
| 16                   | Spec 004's build check                                                                                                                                                                                                                                                                                                                                                                      |

## Tasks

1. **Filtering in `packages/dex`.** `dexFilter`, `filterForms` and `sortForms` with tests.
   Done when: the tests for every filter in the spec pass.
2. **The query string.** `parseDexQuery` and `toDexQuery` with tests. Done
   when: the round trip and unknown-value tests pass.
3. **Cards and the grid with fixtures** (done, reviewed; the fixture pages
   then removed, [ADR 0010](../../adr/0010-only-real-routes.md)): the
   form card, grid and list, the filters panel and sheet, chips, sort, the
   count, every state, at 360 and 1024 px. Done when: the owner has reviewed
   it on a desktop and a phone.
4. **`/dex` on the real index.** The page, the Suspense fallback, the index
   import, filters in the address, and the images' credit ("Pokémon images
   © The Pokémon Company, from PokéAPI's sprites", from `credits`) in the
   footer and on `/legal`. Done when: acceptance criteria 1–5 pass.
5. **Home and `/games/[game]`.** Recently viewed (written by spec 004's
   pages; read here), the browse links, the game and version pickers, the
   incomplete-data notice, titles, descriptions (from the dictionaries)
   and the sitemap with both languages. Done when: both pages pass their
   e2e and axe tests in both languages.
6. **Spike: offline navigation.** A minimal service worker, a production
   build, and a check that a saved page opens offline by link and by Back.
   Done when: the result and the chosen approach are written in
   "Decisions" above.
7. **The service worker.** Caching as above (precaching spec 001's
   `/offline` page, per language), the update rule, the offline notice,
   the manifest's 192 and 512 px icons, the Proxy matcher's new exclusions
   and `VERCEL_GIT_COMMIT_SHA` in `turbo.json`. Done when: acceptance criteria
   7, 8, 12 and 14 pass.
8. **The palette's Pokémon source.** Done when: criterion 9 passes.
9. **Performance, accessibility and languages pass.** Includes the cards'
   sharp images (see "Decisions", "Card images, sharp on phones": spec
   002's image step makes the 192 and 288 px artwork, the card takes it
   with `srcset`) and whether the first row's images load eagerly for LCP.
   Done when: criteria 5, 6, 10, 11, 13 and 15 pass, `rtl.spec.ts` (spec 001) passes for these
   pages, and the owner's `/interface-review` passes.
