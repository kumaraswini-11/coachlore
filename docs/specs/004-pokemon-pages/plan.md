# 004: Pokémon pages, the plan

## Builds on

- **Spec 001:** the shell, the palette, the states, type badges.
- **Spec 002:** `packages/dex` and its dataset: forms, Pokémon, moves,
  abilities, types, games, learnsets, evolutions, encounters, usage
  statistics, artwork.
- **Spec 003:** `apps/web/lib/dex.ts`, recently viewed, the service worker
  (which already covers these routes).

## Packages and files

| Path                                                                                                                                           | What                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/dex/src/matchups.ts`                                                                                                                 | `multiplier(attacking, defending)`, `defensiveMatchups(types)` (grouped ×4 … ×0), the 18 × 18 chart; shared with spec 005                                                                                                                        |
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
data, for each language the `[lang]` layout lists, and `dynamicParams =
false`, so every page is built ahead in both languages and any other
address is a 404 ([generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)).
Data reads go through `apps/web/lib/dex.ts`, whose functions use `"use
cache"`, so the page and `generateMetadata` read once.

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
      method: "level" | "machine" | "egg" | "tutor"
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
- The artwork is the LCP element: `next/image` with `preload`, `unoptimized`
  (prepared at size by spec 002), fixed width and height. Next.js 16
  replaced `priority` with `preload` (bundled docs: `02-components/image.md`).
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

## Decisions

None new: everything here follows ADR 0006 and specs 002 and 003.

## Tests

| Acceptance criterion | Test                                                                                                                                                                                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1                    | `apps/web/e2e/dex-pages.spec.ts`: a sample of form, move and ability pages load; an unknown key returns 404. A build check counts generated pages against the dataset                                                                                             |
| 2                    | `packages/dex/src/hand-checked.test.ts`: the ten forms' expected values, typed in from the games' published data, compared with the dataset                                                                                                                       |
| 3                    | `packages/dex/src/matchups.test.ts`: the chart against a fixed table; dual types as products                                                                                                                                                                      |
| 4                    | `apps/web/e2e/dex-pages.spec.ts` with a fixture form missing encounters, usage and an evolution method                                                                                                                                                            |
| 5                    | `e2e/dex-performance.spec.ts` (spec 003's), extended to a form's page; LCP element is the artwork                                                                                                                                                                 |
| 6                    | `e2e/a11y.spec.ts`, extended to these pages; keyboard paths for tabs, switcher, prev/next, sorting                                                                                                                                                                |
| 7                    | `e2e/search-palette.spec.ts`, extended                                                                                                                                                                                                                            |
| 9                    | `e2e/dex-pages.spec.ts` in `hi`: Hindi labels and evolution methods, English names, `lang="en"` on entries and effects; `packages/dex/src/evolution.test.ts` returns data, and `apps/web/lib/i18n/evolution.test.ts` words every method kind in both dictionaries |
| 8                    | `e2e/offline.spec.ts`, extended to a visited form and move page                                                                                                                                                                                                   |
| 10                   | The production build on Vercel, timed from its log; `scripts/count-pages.ts` counts the generated pages per language and sums the output size; both recorded in the pull request. Fails the task if the build takes more than 15 minutes                          |

## Tasks

1. **Matchups and ability notes in `packages/dex`.** Done when: criterion 3
   passes and the notes list covers the abilities in its test.
2. **Evolution methods as data, worded by the dictionaries.** Done when:
   every chain in the dataset maps to a method or `null`, a test lists the
   `null` cases, and every method kind has words in both dictionaries.
3. **The ten hand-checked forms.** Done when: criterion 2 passes (a failure
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
    Vercel. If it takes more than 15 minutes, switch moves and abilities to
    render on first request and cache (`use cache`, without
    `dynamicParams = false` for those two routes), keeping Pokémon and form
    pages built ahead. Done when: criterion 10 passes.
