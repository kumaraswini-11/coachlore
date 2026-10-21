# 004: Pokémon pages, the plan

## Builds on

- **Spec 001:** the shell, the palette, the states, type badges.
- **Unknown keys 404 in the Proxy** ([ADR 0008](../../adr/0008-translation-library.md),
  "Consequences"): a `notFound()` inside a page renders only in the browser
  under Cache Components, so `proxy.ts` checks a Pokémon, form, move or
  ability key against the dataset's key lists and rewrites an unknown one to
  an address that matches nothing, which gets `global-not-found` with a 404
  (Next.js's loading docs, "Status codes": "check the slug in Proxy, then
  rewrite it to a not-found route").
- **Spec 002:** `packages/dex` and its dataset: forms, Pokémon, moves,
  abilities, types, games, learnsets, evolutions, encounters, usage
  statistics, artwork.
- **Spec 003:** `apps/web/lib/dex.ts`, recently viewed, the service worker
  (which already covers these routes).

## Packages and files

| Path                                                                                                                                           | What                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/dex/src/type-chart.ts`                                                                                                               | Spec 002's `multiplier(chart, attacking, defending)`, plus `defensiveMatchups(chart, types)` (grouped ×4 … ×0); shared with spec 005                                                                                                             |
| `packages/dex/src/ability-notes.ts`                                                                                                            | The short, hand-kept list of abilities that change a matchup, each with a note key (`immune.ground`) and its values; the web app's dictionaries hold the words ("No damage from Ground")                                                         |
| `packages/dex/src/move-filter.ts`                                                                                                              | `moveFilter` (a Zod schema, type `MoveFilter`) and `filterMoves(index, filter)` for `/moves`; spec 012 parses the model's move filters with it                                                                                                   |
| `packages/dex/src/evolution.ts`                                                                                                                | `evolutionMethod(details)`: the method as data (`{ kind: "level", level: 48 }`, `{ kind: "trade", item: "metal-coat" }`), or `null` for "Special condition"; the web app turns it into words from the dictionary, so it reads in either language |
| `apps/web/app/[lang]/dex/[pokemon]/page.tsx`                                                                                                   | A Pokémon's default form                                                                                                                                                                                                                         |
| `apps/web/app/[lang]/dex/[pokemon]/[form]/page.tsx`                                                                                            | Another form                                                                                                                                                                                                                                     |
| `apps/web/components/dex/form-page.tsx`                                                                                                        | The page body both routes render                                                                                                                                                                                                                 |
| `apps/web/components/dex/form-header.tsx`, `stat-bars.tsx`, `matchups.tsx`, `evolution-chain.tsx`, `where.tsx`, `competitive.tsx`, `about.tsx` | Server Components, one per section                                                                                                                                                                                                               |
| `apps/web/components/dex/form-sections.tsx`                                                                                                    | Client: tabs on a phone, the section menu on desktop                                                                                                                                                                                             |
| `apps/web/components/dex/moves-by-game.tsx`                                                                                                    | Client: the game picker and the sortable moves table                                                                                                                                                                                             |
| `apps/web/components/dex/prev-next.tsx`                                                                                                        | Client: previous and next links, and the swipe                                                                                                                                                                                                   |
| `apps/web/app/[lang]/types/page.tsx`, `components/types/type-chart.tsx`, `type-picker.tsx`                                                     | The type chart; the picker is a client component reading the address                                                                                                                                                                             |
| `apps/web/app/[lang]/moves/page.tsx`, `components/moves/moves-browser.tsx`                                                                     | The moves list, built like `/dex` (spec 003) over a moves index                                                                                                                                                                                  |
| `apps/web/app/[lang]/moves/[move]/page.tsx`                                                                                                    | A move                                                                                                                                                                                                                                           |
| `apps/web/app/[lang]/abilities/[ability]/page.tsx`                                                                                             | An ability                                                                                                                                                                                                                                       |

All page routes export `generateStaticParams` listing every key in the
data, for each language the `[lang]` layout lists, so every page is built
ahead in both languages ([generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)).
None exports `dynamicParams`: under Cache Components "exporting
`dynamicParams` fails the build" (bundled docs:
`02-guides/migrating-to-cache-components.md`). Any other address is a 404
from the Proxy ("Builds on"): `proxy.ts` composes next-intl's middleware
with the key check and the alias redirect below, reading the key lists
from `@workspace/dex` (small sets, since Proxy checks should stay fast,
`loading.md`), and `proxy.test.ts` covers the three paths.
Data reads go through `apps/web/lib/dex.ts`, whose functions use `"use
cache"`, so the page and `generateMetadata` read once.

**Components,** from the shadcn registry. Added with the CLI into
`packages/ui`: `Table` for the moves; `Select` (from spec 003) for the
moves' game and the type picker. Already installed: `Tabs` for the sections
on a phone, `Badge`, `Button` and `Card`. The form switcher moves between pages, so
it's a row of `Link`s with `aria-current="page"` on the current form, not a
`Toggle Group` ("a series of toggle buttons", Base UI's `toggle-group.md`).

## Data model

Assembled per page by `apps/web/lib/dex.ts` from spec 002's per-form and
per-Pokémon files (`PokemonDetail`, `Learnset`, `Move`, read with
`@workspace/dex/files`; never shipped whole to the browser). Where a name
below differs from 002's types, 002's is the stored one and this is the
page's view of it:

```ts
type FormDetail = {
  form: string
  pokemon: string
  name: string
  number: number
  isDefault: boolean
  types: Type[]
  stats: Stats
  abilities: { ability: string; hidden: boolean }[]
  heightDm: number
  weightHg: number
  artwork: string | null // "/dex-images/artwork/rotom-wash.webp", 256 × 256 (spec 002)
  learnset: {
    game: string
    moves: {
      move: string
      method: "level" | "machine" | "egg" | "tutor" | "other" // spec 002's LearnMethod; "other" shown as "Other"
      level?: number
    }[]
  }[]
  encounters: { game: string; version: string; locations: string[] }[] | null // null: not in the data
  usage: {
    month: string
    format: string
    share: number
    moves: string[]
    items: string[]
    abilities: string[]
    teammates: string[]
  }[]
}

type PokemonDetail = {
  pokemon: string
  forms: string[] // the default first
  category: string
  pokedexEntries: { games: string[]; text: string }[] // identical texts merged
  names: { language: string; name: string }[]
  evolutionChain: EvolutionNode // each node: form, method details, children
}
```

The moves index (for `/moves` and the palette): key, name, type,
category, power, accuracy, PP. A move's page also reads its priority,
generation, effect text and learners by game.

## Rendering

- Every page here is static and a Server Component; client components are
  only the section tabs, the moves table, the type picker and the swipe.
- The artwork is the LCP element: `next/image` with `fetchPriority="high"`,
  `unoptimized` (prepared at size by spec 002), fixed width and height.
  "In most cases, you should use `loading="eager"` or `fetchPriority="high"`
  instead of `preload`" (bundled docs: `02-components/image.md`). With
  `unoptimized` there's no srcset, so the owner checks the 256 px artwork on
  a 3× phone screen.
- The accent: the page sets `--accent-type` to its first type's token; the
  header tint and stat bars use it.
- The type picker and the moves filters read the address with
  `useSearchParams` inside `<Suspense>`, with the default view as the
  fallback (as in spec 003).

## API

None: the Dex never calls the server (ADR 0006).

## Events

None.

## Jobs

None.

## Form addresses

`/dex/[pokemon]/[form]`'s `[form]` is the form key without its Pokémon's
key and hyphen: `/dex/rotom/wash` → `rotom-wash`. `formFromSlug(pokemon,
slug)` in `packages/dex` builds the key, then checks that the form exists
and belongs to that Pokémon; `generateStaticParams` lists exactly the
non-default forms' pairs, and the Proxy answers 404 for an unknown slug
(`/dex/rotom/wet`) or a form under the wrong Pokémon.

A default form's own slug redirects to the Pokémon's page with a 308, in
the Proxy: `/dex/rotom/rotom` → `/dex/rotom`, and
`/dex/urshifu/single-strike` → `/dex/urshifu` (a default form's key needn't
be its Pokémon's). A `redirect()` in the page can't do it: "in a streaming
context, this will insert a meta tag" with status 200 (bundled docs:
`redirect.md`). So these addresses aren't pages, and `count-pages.ts`
doesn't count them.

## Decisions

| Item         | Options                                                                                                   | Decision                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build budget | Vercel: "The maximum duration of the Build Step is 45 minutes" ([limits](https://vercel.com/docs/limits)) | 15 minutes, a third of the limit. Every Dex route stays static; a build over 15 minutes fails criterion 10 and stops the spec. The way out, if it ever happens, is a new recorded decision, not a silent switch: render moves and abilities on first request and cache them, as Vercel's limits page suggests ("pre-render a subset of the total number of pages at build time"), with criterion 1 changed to match |

Everything else follows ADR 0006 and specs 002 and 003.

## Tests

| Acceptance criterion | Test                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1                    | `packages/playwright-web/e2e/dex-pages.spec.ts`: a sample of form, move and ability pages load; an unknown key returns 404; `/dex/rotom/wash` shows Rotom-Wash, `/dex/rotom/rotom` and `/dex/urshifu/single-strike` redirect (308) to the Pokémon's page, `/dex/rotom/wet` and `/dex/pikachu/wash` return 404. `packages/dex/src/form-slug.test.ts` covers `formFromSlug`. `scripts/count-pages.ts` checks, for each language, that the generated pages equal: one per Pokémon (its default form) + one per non-default form + one per move + one per ability + one per game + the fixed pages (`/dex`, `/types`, `/moves`, `/team-check`), and that both languages have the same count |
| 2                    | `packages/dex/src/hand-checked.test.ts` (spec 002's, one file for both specs' forms): the expected values, typed in from the games' published data, compared with the dataset                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 3                    | `packages/dex/src/type-chart.test.ts`: the chart against a fixed table; dual types as products                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 4                    | `packages/playwright-web/e2e/dex-pages.spec.ts` with a fixture form missing encounters, usage and an evolution method                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 5                    | `e2e/dex-performance.spec.ts` (spec 003's), extended to a form's page; LCP element is the artwork                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 6                    | `e2e/a11y.spec.ts`, extended to these pages; keyboard paths for tabs, switcher, prev/next, sorting                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 7                    | `e2e/search-palette.spec.ts`, extended                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 8                    | `e2e/offline.spec.ts`, extended to a visited form and move page                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 9                    | `e2e/dex-pages.spec.ts` in `hi`: Hindi labels and evolution methods, English names, `lang="en"` on entries and effects; `packages/dex/src/evolution.test.ts` returns data, and `apps/web/lib/i18n/evolution.test.ts` words every method kind in both dictionaries                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 10                   | The production build on Vercel, timed from its log; `scripts/count-pages.ts` counts the generated pages per language and sums the output size; both recorded in the pull request. Fails the task if the build takes more than 15 minutes                                                                                                                                                                                                                                                                                                                                                                                                                                                |

## Tasks

1. **Matchups and ability notes in `packages/dex`.** Done when: criterion 3
   passes and the notes list covers the abilities in its test.
2. **Evolution methods as data, worded by the dictionaries.** Done when:
   every chain in the dataset maps to a method or `null`, a test lists the
   `null` cases, and every method kind has words in both dictionaries.
3. **The ten hand-checked forms,** recorded in spec 002's file alongside
   its own. Done when: criterion 2 passes (a failure
   here is fixed in spec 002's import, not hidden).
4. **The form page with fixtures** (screen process, step 2): every section
   and its "not in our data" text, tabs and section menu, the switcher,
   prev/next, at 360 and 1024 px. Done when: the owner has reviewed it.
5. **Form pages on real data.** Both routes, `generateStaticParams` for
   both languages, metadata from the dictionaries with `hreflang`,
   recently viewed. Done when: criteria 1, 4, 5 and 9 pass.
6. **The type chart.** Done when: the picker and full chart pass their e2e
   and axe tests.
7. **Moves, a move and an ability.** Done when: their e2e and axe tests pass.
8. **The palette's moves, abilities and types; the sitemap.** Done when:
   criterion 7 passes and the sitemap lists every page.
9. **Offline, performance, accessibility and languages pass.** Done when:
   criteria 5, 6, 8 and 9 pass, `rtl.spec.ts` (spec 001) passes for these
   pages, and the owner's `/interface-review` passes.
10. **The build budget.** Measure the full Dex build in both languages on
    Vercel and record the page count and output size. Done when: criterion
    10 passes. If the build takes more than 15 minutes, stop and record a
    decision (see Decisions) before changing any route; nothing switches to
    on-demand rendering silently.
