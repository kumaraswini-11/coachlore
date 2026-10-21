# 002: Pokémon data, the plan

## Builds on

- ADR 0006, "Pokémon data" (PokéAPI's `api-data` at a pinned commit;
  `@pkmn/dex` for Showdown's names; Smogon's monthly usage files; PokéAPI's
  sprites, self-hosted) and "Tests" (Vitest).
- Spec 000 (Vitest in the workspace; this spec adds it to packages).
- The scaffold follow-ups plan, "Core packages' conventions": its DOM-free
  preset and core lint config are made here, for `packages/dex` first and
  `packages/league` and `packages/battle-log` after.

## Packages and files

```text
packages/
  eslint-config/core.js            new: base + no framework, DOM or storage imports
  typescript-config/core.json      new: base without the DOM libraries
  dex/                             new: @workspace/dex
    package.json                   exports ".", "./files"; dev deps for the import only
    sources.json                   the pins (below)
    overrides/
      overrides.json               hand fixes: path, value, reason, link
      excluded-forms.json          forms left out (Totem forms…), each with a reason
      showdown-exceptions.json     Showdown names that don't match by rule
    src/
      types.ts                     the data model (below)
      index.ts                     synchronous: forms, types, chart, moves, abilities, games, battle names
      files.ts                     asynchronous, Node only: a Pokémon's detail, a form's learnset, usage
      type-chart.ts                effectiveness(attacking, defending[])
      *.test.ts
    data/                          generated, committed; in .prettierignore
      forms.json                   the form list (≤ 150 KB gzip)
      types.json  moves.json  abilities.json  games.json
      showdown.json  usage.json  credits.json
      pokemon/<pokemon>.json       one per Pokémon: its forms' details, evolution, entries, names, encounters
      learnsets/<form>.json        one per form
    scripts/
      import.ts                    runs the steps below; prints a change summary
      fetch.ts                     downloads the pinned sources into .cache/ (gitignored)
apps/web/
  scripts/import-images.ts         sprites and artwork → public/dex-images/ (below)
  public/dex-images/sprites/<form>.webp
  public/dex-images/artwork/<form>.webp
```

**Two entry points.** `@workspace/dex` is small and synchronous, for
anywhere, the browser included (the grid, search, filters, the type chart
and the team check need only it). `@workspace/dex/files` reads the large
per-Pokémon and per-form files with `node:fs`, for Server Components at
build time, the server and scripts; the browser never loads it.

## Data model

```ts
type PokemonKey = string // "rotom"
type FormKey = string // "rotom-wash"
type TypeKey = "normal" | "fire" | "water" | /* … */ "fairy"
type StatKey =
  "hp" | "attack" | "defense" | "special-attack" | "special-defense" | "speed"

type FormSummary = {
  // one row of forms.json
  key: FormKey
  pokemon: PokemonKey
  number: number // National Dex
  sourceId: number // PokéAPI's pokemon ID, for every form (default or not): where its images come from
  name: string // "Rotom-Wash", English, in every interface language; the default form carries the Pokémon's name
  formName?: string // "Wash Rotom", for the form switcher
  isDefault: boolean
  isBattleOnly: boolean
  types: [TypeKey] | [TypeKey, TypeKey]
  stats: Record<StatKey, number>
  statTotal: number // the six base stats summed, for spec 003's filters and sort
  abilities: { key: string; hidden: boolean }[]
  generation: number
  legendary?: true // PokéAPI's is_legendary
  mythical?: true // PokéAPI's is_mythical
  gen9: boolean // usable in Generation 9: @pkmn/dex's Gen 9 species has no isNonstandard
  tags: string[] // @pkmn/dex's species tags: "Restricted Legendary", "Sub-Legendary", "Mythical", …
  games: string[] // games whose regional Pokédex includes it
  kind: "default" | "regional" | "mega" | "gigantamax" | "other" // spec 003's "Forms" filter
  sprite: string | null // "/dex-images/sprites/rotom-wash.webp"
}

type PokemonDetail = {
  key: PokemonKey
  number: number
  name: string
  category: string // "Plasma Pokémon"
  generation: number
  forms: (FormSummary & { height: number; weight: number })[]
  evolution: EvolutionStep[] // the whole chain, flattened with parents
  entries: { version: string; text: string }[] // English
  names: Record<string, string> // PokéAPI language → name (no "hi": the source has none); shown on the Pokémon page, never used for search
  encounters: Record<string, Encounter[]> // version → encounters; only covered versions
}

type Move = {
  key: string
  name: string
  type: TypeKey
  category: "physical" | "special" | "status"
  power: number | null
  accuracy: number | null
  pp: number
  priority: number
  effect: string
}

type LearnMethod = "level" | "machine" | "egg" | "tutor" | "other" // PokéAPI's other methods kept as "other", never dropped
type Learnset = Record<
  string,
  [move: string, method: LearnMethod, level?: number][]
> // game → moves

type Game = {
  key: string // "scarlet-violet"
  name: string
  generation: number
  versions: { key: string; name: string }[]
  pokedex: { form: FormKey; regionalNumber: number; onlyIn?: string }[] // in regional order; onlyIn is a version key for a version exclusive
  encountersCovered: boolean
}

type Usage = {
  month: string // "2026-09"
  formats: Record<
    string,
    Record<
      FormKey,
      {
        share: number // 0–1
        moves: [string, number][]
        items: [string, number][]
        abilities: [string, number][]
        partners: [FormKey, number][]
      }
    >
  >
}
```

## The import

`bun run --filter @workspace/dex import` runs, in order:

1. **Fetch** (`fetch.ts`) into `packages/dex/.cache/`, only what's missing:
   - `api-data` as a tarball of the pinned commit
     (`codeload.github.com/PokeAPI/api-data/tar.gz/<commit>`), extracted
     with the system `tar`;
   - Smogon's chaos files for the pinned month: `gen9ou-1500.json` and
     `gen9doublesou-1500.json` (both exist for 2026-09).
2. **Types and the chart** from `type/<id>`'s current `damage_relations`.
3. **Pokémon and forms** from `pokemon-species/<id>` (its `varieties`, one
   `is_default`) and `pokemon/<id>` (types, stats, abilities, height,
   weight), with `pokemon-form/<id>`'s `is_battle_only`; minus
   `excluded-forms.json`. A `pokemon-form` that isn't a `pokemon` of its
   own is cosmetic and adds nothing. Each form's `kind` comes from
   `is_default` and its `pokemon-form`'s `is_mega` and form name (a regional
   name such as `alola`, `galar`, `hisui` or `paldea`, or `gmax`); anything
   else is `other`. `sprite` is set when the image step wrote one.
4. **Abilities and moves** with their English short effects
   (`effect_chance` substituted).
5. **Evolutions** from `evolution-chain/<id>`, each step with its trigger
   and conditions as data, not text.
6. **Entries and names** from `pokemon-species/<id>` (English entries,
   whitespace and form feeds normalised; names in every language).
7. **Learnsets** from `pokemon/<id>`'s `moves`, grouped by version group.
8. **Games** from `version-group`, `version` and `pokedex`; encounters from
   `pokemon/<id>/encounters`; a game is `encountersCovered` if any of its
   versions has encounter data.
9. **Battle names** from `@pkmn/dex` and `@pkmn/data` (pinned, dev
   dependencies only): every species and forme of Generation 9, matched to
   our forms by their IDs with non-letters removed (`rotomwash` ↔
   `rotom-wash`), then `showdown-exceptions.json` (`Urshifu` →
   `urshifu-single-strike`), with cosmetic formes mapped to their base form.
   The same match fills each form's `gen9` (Generation 9's species has no
   `isNonstandard`) and `tags` (the species' tags); a form with no
   Showdown species gets `gen9: false` and no tags.
10. **Usage** from the chaos files, names mapped through step 9, each
    list cut to its top six.
11. **Overrides** applied; an override whose path doesn't exist fails the
    import.
12. **Write** every file sorted (by number, then key), with stable key
    order, and `credits.json` with each source, its licence and its pinned
    version; then print the change summary against the committed files.

## Sources and pins

`packages/dex/sources.json`:

```json
{
  "api-data": {
    "commit": "<sha>",
    "date": "<commit date>",
    "imported": "<YYYY-MM-DD>"
  },
  "sprites": {
    "commit": "<sha>",
    "date": "<commit date>",
    "imported": "<YYYY-MM-DD>"
  },
  "smogon-usage": {
    "month": "2026-09",
    "cutoff": 1500,
    "formats": ["gen9ou", "gen9doublesou"],
    "imported": "<YYYY-MM-DD>"
  }
}
```

`@pkmn/dex` and `@pkmn/data` are pinned in `package.json` like any
dependency. `imported` is the day the import last ran against that pin,
written by the import itself. A pin is the newest commit or release at least two weeks old
when it's changed (AGENTS.md, "Versions").

## Images

`apps/web/scripts/import-images.ts` reads each form's `sourceId` from
`@workspace/dex` (default and non-default forms alike; never the output
`sprite` path), downloads from the pinned `sprites` commit (four at a
time, cached in `.cache/`), and writes:

| File                                    | From                                                    | Made into                   |
| --------------------------------------- | ------------------------------------------------------- | --------------------------- |
| `public/dex-images/sprites/<form>.webp` | `sprites/pokemon/<id>.png` (96 × 96)                    | WebP, lossless, 96 × 96     |
| `public/dex-images/artwork/<form>.webp` | `sprites/pokemon/other/official-artwork/<id>.png` (475) | WebP, quality 80, 256 × 256 |

- Converted with `sharp` (a dev dependency of `apps/web`; already the
  image library Next.js uses).
- Committed: about 1,300 forms at roughly 1 KB and 12 KB each is under
  20 MB, small enough for the repository, and the Dex then needs nothing
  outside it. The test fails if the folder passes 25 MB.
- Served as static files with fixed width and height, unoptimised by the
  host (`unoptimized`), because they're already sized and the free plan
  allows "First 5,000" image transformations (ADR 0006).
- Credited: "Pokémon images © The Pokémon Company, from PokéAPI's sprites"
  in `credits.json`, shown in the footer and on `/legal`.

## API

None: the dataset is read from the package, never served by the server.

## Events

None.

## Jobs

None: the import runs from a command, and its output is committed.

## Tests

| Acceptance criterion | Proved by                                                                                                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1                    | `hand-checked.test.ts`: the ten forms' values, typed in by the owner from the games, each with where it was checked                                                                 |
| 2                    | `showdown.test.ts`: every Generation 9 species and forme from `@pkmn/data` maps to exactly one form; unmapped names listed; `gen9` and `tags` on Koraidon, Mew and Mega Charizard X |
| 3                    | `integrity.test.ts`: every key referred to exists                                                                                                                                   |
| 4                    | `import.test.ts`: the import on a fixed sample of `api-data` (five Pokémon, committed under `test/fixtures/`) run twice gives identical bytes; one full run by hand                 |
| 5                    | `overrides.test.ts`: an override applies; a bad path fails                                                                                                                          |
| 6                    | `size.test.ts`: `forms.json` gzipped ≤ 150 KB                                                                                                                                       |
| 7                    | The `core` lint config (`no-restricted-imports` for `react`, `next`, `node:fs` outside `files.ts`, database clients) and `script.test.ts` running a plain script                    |
| 8                    | `images.test.ts` in `apps/web`: every form with source images has both files; the folder ≤ 25 MB                                                                                    |
| 10                   | `games.test.ts`: on the fixed sample, a game's Pokédex keeps regional order, and a version exclusive carries `onlyIn` (the sample includes one)                                     |
| 11                   | `sources.test.ts`: every source in `sources.json` has `commit` or `month` and an `imported` date                                                                                    |
| 8 (ids)              | `images.test.ts` also checks `sourceId` for a default form and a non-default one (Rotom, Rotom-Wash)                                                                                |
| 9                    | `credits.test.ts`: every source in `sources.json` is in `credits.json` with a licence                                                                                               |

## Decisions

| Item                    | The repository now              | What the sources say (quoted)                                                                                                                                                                                           | Decision                                                                                                 |
| ----------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Getting the data        | none                            | PokéAPI: "Locally cache resources whenever you request them" ([docs](https://pokeapi.co/docs/v2)); `api-data` is "a static copy of the JSON data produced by PokeAPI" ([api-data](https://github.com/PokeAPI/api-data)) | One tarball of a pinned `api-data` commit per refresh; the live API is never called                      |
| Where the dataset lives | none                            | –                                                                                                                                                                                                                       | Committed JSON in `packages/dex/data/`, so builds need no network and refreshes are reviewable diffs     |
| Images                  | none                            | PokéAPI's sprites: "All image contents within are Copyright The Pokémon Company" ([licence](https://github.com/PokeAPI/sprites/blob/master/LICENCE.txt))                                                                | Committed WebP in `apps/web/public/dex-images/`, credited; never hot-linked                              |
| Core packages           | the follow-ups plan's open item | –                                                                                                                                                                                                                       | `@workspace/eslint-config/core` and `@workspace/typescript-config/core.json`, used by every core package |

## Tasks

1. **Core conventions.** `core.js`, `core.json`, the empty `@workspace/dex`
   with Vitest, wired into Turborepo's `lint`, `typecheck` and the `test`
   task spec 000 added. Done when an empty test runs in CI.
2. **The model.** `types.ts` and `type-chart.ts` with its tests (the chart
   from a small fixture). Done when the types compile and the chart tests
   pass.
3. **Owner: the ten.** The owner records the ten forms' types, base stats,
   abilities and evolutions from the games in `hand-checked.test.ts`. Done
   when the file is committed (the test fails until the import exists).
4. **Fetch and pins.** `sources.json`, `fetch.ts`, `.cache/` gitignored.
   Done when the pinned sources download once and are reused.
5. **Import: Pokémon, forms, types, abilities, moves.** Steps 2 to 4, 11
   and 12, with the test sample. Done when criteria 3, 4 and 5 pass on the
   sample.
6. **Import: evolutions, entries, names, learnsets, games, encounters.**
   Steps 5 to 8. Done when the sample's output has every field.
7. **Battle names.** Step 9 and `showdown.test.ts`. Done when criterion 2
   passes.
8. **Usage.** Step 10. Done when the sample month's top forms appear with
   their lists.
9. **The first full import.** Run it, review the summary and the size,
   commit the data. Done when criteria 1, 3, 6, 7 and 9 pass on the full
   dataset.
10. **Images.** `import-images.ts`, the committed images, `images.test.ts`.
    Done when criterion 8 passes.
11. **Documents.** `packages/dex/README.md` (the model, the entry points,
    how to refresh), AGENTS.md's Stack list (the data sources), the
    follow-ups plan's core-package item marked done. Done when the owner
    has audited them.
