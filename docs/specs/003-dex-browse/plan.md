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
| `apps/web/proxy.ts`                                  | The matcher also excludes `sw.js`, `dex-images/`, `dex-data/` and `icons/`: Proxy runs on "assets in the `public/` folder" (bundled docs: `proxy.md`), so next-intl would redirect them to `/en/…`, a 404. `proxy.test.ts` checks each                                                                                                                                 |
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

Each game's Pokédex (spec 002): its key, name, versions, and the ordered
list of `{ form, regionalNumber, onlyIn?: version }`, with a flag for
incomplete data.

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
- Filtering runs inside `startTransition`, and the text box uses
  `useDeferredValue`, so typing stays responsive.
- A filter change writes the address with `window.history.pushState`, so
  Back undoes it; typing in the text box uses `replaceState`. Next.js
  documents both as updating the address "without reloading the page" and
  integrating "with `useSearchParams`" (bundled docs:
  `04-linking-and-navigating.md`); neither makes a request (criterion 4).
- Cards prefetch on intent (hover or focus), not when they scroll into view:
  "As each `<Link>` enters the viewport, Next.js prefetches", and for "a
  grid of cards … Prefetch on intent instead" (bundled docs:
  `prefetching.md`, `optimizing-prefetching.md`). So filtering the grid
  sends no prefetches.
- Cards use `content-visibility: auto` with a fixed intrinsic size, and
  sprites `loading="lazy"` with width and height set.
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

| Item            | What the docs say (quoted)                                                                                                                                                                                                                                                            | Options                                                               | Decision                                                                                                                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Offline caching | Next.js's PWA guide: "For full service-worker-based offline caching, one option is [Serwist]"; `useOffline` is "experimental" and covers "connectivity detection and automatic retry", not caching (bundled docs: `02-guides/progressive-web-apps.md`, `04-functions/use-offline.md`) | A small service worker of our own; Serwist; `experimental.useOffline` | Our own service worker (the table above): one file, no dependency, rules we can read. Task 6 checks that client-side navigation works offline; if it can't without matching the router's requests, Serwist replaces it, recorded here |
| Connectivity    | `use-offline.md`: `navigator.onLine` "still reports `true` for a device on WiFi with no upstream internet"; `useOffline` is "experimental"                                                                                                                                            | `navigator.onLine` and its events; `useOffline`                       | `navigator.onLine` and the `online`/`offline` events: stable, no experimental flag. A connected Wi-Fi with no internet shows no notice; pages still come from the saved copy when the network fails                                   |
| Images          | Vercel Hobby includes "First 5,000" image transformations ([Hobby](https://vercel.com/docs/plans/hobby))                                                                                                                                                                              | `next/image` optimisation; plain images at their final size           | Sprites are prepared at their display size by spec 002's import and served as they are (`next/image` with `unoptimized`), so the free limit never applies                                                                             |
| A long grid     | –                                                                                                                                                                                                                                                                                     | Render every card with `content-visibility`; a virtualised list       | `content-visibility` first; a virtualised list (TanStack Virtual) only if acceptance criterion 5 fails, recorded here                                                                                                                 |

## Tests

| Acceptance criterion | Test                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1, 2                 | `packages/dex/src/filter.test.ts`: counts and filter results against values computed from the dataset in the test; `packages/playwright-web/e2e/dex-filters.spec.ts` for the same values through the interface                                                                                                                                                                              |
| 3                    | `apps/web/lib/dex-query.test.ts` (round trip, unknown values dropped); `e2e/dex-filters.spec.ts` (new tab, Back)                                                                                                                                                                                                                                                                            |
| 4                    | `e2e/dex-filters.spec.ts`: no request after the index has loaded while filtering                                                                                                                                                                                                                                                                                                            |
| 5                    | `e2e/dex-performance.spec.ts`: 4× CPU slowdown through the Chrome DevTools Protocol; the Event Timing entry's duration for a filter change under 200 ms                                                                                                                                                                                                                                     |
| 6                    | `e2e/dex-performance.spec.ts`: LCP and layout shifts from `PerformanceObserver`, at 4× CPU slowdown and a slow network profile; the owner also checks with Lighthouse's mobile profile                                                                                                                                                                                                      |
| 7                    | `e2e/offline.spec.ts`: a production build, one visit, then `context.setOffline(true)`                                                                                                                                                                                                                                                                                                       |
| 8                    | `e2e/offline-update.spec.ts`: two production builds with different commits, served in turn on one port                                                                                                                                                                                                                                                                                      |
| (games)              | `e2e/game-dex.spec.ts` with the 002 fixture game: regional order, the version picker, and the "Only in [version]" badge from `onlyIn`                                                                                                                                                                                                                                                       |
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
3. **Cards and the grid with fixtures** (the screen process, step 2): the
   form card, grid and list, the filters panel and sheet, chips, sort, the
   count, every state, at 360 and 1024 px. Done when: the owner has reviewed
   it on a desktop and a phone.
4. **`/dex` on the real index.** The page, the Suspense fallback, the index
   import, filters in the address. Done when: acceptance criteria 1–5 pass.
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
9. **Performance, accessibility and languages pass.** Done when: criteria
   5, 6, 10, 11, 13 and 15 pass, `rtl.spec.ts` (spec 001) passes for these
   pages, and the owner's `/interface-review` passes.
