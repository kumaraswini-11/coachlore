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
  eslint-config/core.js            base + no framework, DOM or storage imports
  typescript-config/core.json      base without the DOM libraries
  dex/                             @workspace/dex
    package.json                   exports ".", "./files", "./type-chart"; sideEffects false; dev deps for the import only
    sources.json                   the pins (below)
    overrides/
      overrides.json               hand fixes: path, value, reason, link
      excluded-forms.json          forms left out (Totem forms…), each with a reason
      showdown-exceptions.json     Showdown species, move and ability IDs that don't match by rule, each with a reason
      exclusives.json              version exclusives per game, each with a link (the source has none)
    src/
      types.ts                     the data model (below)
      index.ts                     synchronous: forms, types, chart, moves, abilities, games, battle names
      files.ts                     asynchronous, Node only: a Pokémon's detail, a form's learnset, usage
      type-chart.ts                multiplier(chart, attacking, defending[]); spec 004 adds defensiveMatchups
      *.test.ts
    data/                          generated, committed; in .prettierignore
      forms.json                   the form list (≤ 150 KB gzip)
      types.json  moves.json  abilities.json  games.json  locations.json
      showdown.json  usage.json  credits.json
      pokemon/<pokemon>.json       one per Pokémon: its forms' details and encounters, evolution, entries, names
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
`@workspace/dex/type-chart` is the arithmetic alone, with no JSON, for a
Client Component that is given the chart; `"sideEffects": false` lets the
bundler drop what a page doesn't use. `bundle.test.ts` fails if importing
`multiplier` pulls in `forms.json`.

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
  artwork: string | null // "/dex-images/artwork/rotom-wash.webp": the Dex's cards and the form's page
}

type PokemonDetail = {
  key: PokemonKey
  number: number
  name: string
  category: string // "Plasma Pokémon"
  generation: number
  forms: (FormSummary & {
    height: number
    weight: number
    encounters: Record<string, Encounter[]> // version → encounters, this form's own; only covered versions
  })[]
  evolution: EvolutionStep[] // the whole chain, flattened with parents; the first species with from: null
  entries: { version: string; text: string }[] // English
  names: Record<string, string> // PokéAPI language → name (no "hi": the source has none); shown on the Pokémon page, never used for search
}

type EvolutionStep = {
  from: PokemonKey | null
  to: PokemonKey
  trigger: string | null // PokéAPI's: "level-up", "use-item", "trade" …
  conditions: Record<string, string | number | boolean | string[]> // the fields set, links as keys; a hidden roll as chance, else expression
}

type Encounter = {
  location: string // a location area's key; its English name in locations.json
  method: string
  minLevel: number
  maxLevel: number
  chance: number // 0–100
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
  generation: number
  effect?: string // the English short effect, else the newest English game text; absent when the source has neither
  effectChance?: number // 0–100
}

type Ability = {
  key: string
  name: string
  generation: number
  effect?: string // as a move's
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
  pokedexes: {
    key: string // "kitakami"
    name: string
    entries: { form: FormKey; regionalNumber: number; onlyIn?: string }[] // in regional order; onlyIn is a version key for a version exclusive
  }[] // in the game's order: Paldea, Kitakami, Blueberry
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
     with the system `tar`; its files are
     `data/api/v2/<endpoint>/<id>/index.json`, keyed by ID, not name;
   - Smogon's chaos files for the pinned month: `gen9ou-1500.json` and
     `gen9doublesou-1500.json` (both exist for 2026-09).
2. **Types and the chart** from `type/<id>`'s current `damage_relations`,
   for the eighteen battle types only: the source also lists `stellar`
   (Terastal), `unknown` and `shadow` (Colosseum), which no form has.
3. **Pokémon and forms** from `pokemon-species/<id>` (its `varieties`, one
   `is_default`) and `pokemon/<id>` (types, stats, abilities, height,
   weight), with `is_battle_only` from the `pokemon-form` that
   `pokemon/<id>`'s `forms[0].url` names (the IDs differ: `pokemon/10009`
   is Rotom-Wash, `pokemon-form/10009` is Unown J); minus
   `excluded-forms.json`. A `pokemon-form` that isn't a `pokemon` of its
   own is cosmetic and adds nothing. Each form's `kind` comes from
   `is_default` and its `pokemon-form`'s `is_mega` and form name (a regional
   name such as `alola`, `galar`, `hisui` or `paldea`, or `gmax`); anything
   else is `other`. `sprite` is set when the image step wrote one.
4. **Abilities and moves** with their English short effects, and a move's
   `effect_chance` as its own field (the text no longer carries it): main-series abilities only
   (`is_main_series`), and no Shadow moves (type `shadow`, Colosseum and
   XD). A move with no English effect (most of Generation 9's, such as Tera
   Blast and Dire Claw) takes its newest English flavour text;
   `no-effect.test.ts` lists those moves, so an override can replace one.
5. **Evolutions** from `evolution-chain/<id>`, each step with its trigger
   and conditions as data, not text. The source gives a step's method per
   game; the import keeps those it marks `is_default` (Generation 9's: Kubfu
   uses a scroll, not a tower), one step per form a Pokémon can become.
6. **Entries and names** from `pokemon-species/<id>` (English entries,
   whitespace and form feeds normalised; names in every language).
7. **Learnsets** from `pokemon/<id>`'s `moves`, grouped by version group.
8. **Games** from `version-group`, `version` and `pokedex`; encounters from
   `pokemon/<id>/encounters`; a game is `encountersCovered` if any of its
   versions has encounter data. A version group can list several Pokédexes
   (Scarlet and Violet: Paldea, Kitakami, Blueberry), and a Pokédex lists
   species, not forms: a species becomes its form native to that region
   (Paldea's Tauros is `tauros-paldea-combat-breed`), by the region's name
   in the form's key, else its default form. The source has no version
   exclusives, so `onlyIn` comes from `overrides/exclusives.json`, entered
   by hand with a link for each game.
9. **Battle names** from `@pkmn/dex` and `@pkmn/data` (pinned, dev
   dependencies only): every species and forme of Generation 9, matched to
   our forms by their IDs with non-letters removed (`rotomwash` ↔
   `rotom-wash`), then `showdown-exceptions.json` (`Urshifu` →
   `urshifu-single-strike`), with cosmetic formes mapped to their base form.
   The same match fills each form's `gen9` (Generation 9's species has no
   `isNonstandard`) and `tags` (the species' tags); a form with no
   Showdown species gets `gen9: false` and no tags. The rules beyond the
   ID: a base name is its Pokémon's form named by its base forme (Maushold
   is its Family of Three), a Totem its form without "Totem", a shortened
   forme the one form its ID begins, and a forme with no form of its own
   (Vivillon's patterns, Arceus's plates, Ogerpon's Tera forms) the form it
   changes from. A match by name must have the form's types and base stats,
   and an unmapped or mismatched name fails the import. The step also maps
   Showdown's move and ability IDs to ours (`uturn` → `u-turn`), for usage
   and spec 005's team import; `showdown.json` holds all three maps.
10. **Usage** from the chaos files, names mapped through step 9, each
    list cut to its top six, each share its weighted count over the
    Pokémon's total, rounded to four places. Smogon's empty slots (`""`,
    `nothing`, `empty`) are dropped; items keep `@pkmn/dex`'s English name,
    since the dataset has no items.
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

The first pins (checked 2026-10-22): `api-data` at `cdf597a50f27`
(2026-10-07), `sprites` at `d72f64eb7491` (2026-10-07), Smogon's 2026-09
files (2026-10 isn't published yet), `@pkmn/dex` and `@pkmn/data` 0.10.11
(2026-06-18, the latest). The sprites repository is about 25 GB, so its
images are downloaded one file at a time, never as a tarball.

`@pkmn/dex` and `@pkmn/data` are pinned in `package.json` like any
dependency. `imported` is the day the import last ran against that pin,
written by the import itself. A pin is the newest commit or release at least two weeks old
when it's changed (AGENTS.md, "Versions").

## Images

`apps/web/scripts/import-images.ts` reads each form's `sourceId` from
`@workspace/dex` (default and non-default forms alike; never the output
`sprite` path), downloads from the pinned `sprites` commit (four at a
time, cached in `.cache/`), and writes:

| File                                                   | From                                                    | Made into                                                                                                                                                      |
| ------------------------------------------------------ | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/dex-images/sprites/<form>.webp`                | `sprites/pokemon/<id>.png` (96 × 96)                    | WebP, lossless, 96 × 96                                                                                                                                        |
| `public/dex-images/artwork/<form>.webp`                | `sprites/pokemon/other/official-artwork/<id>.png` (475) | WebP, quality 80, 256 × 256                                                                                                                                    |
| `public/dex-images/cards/<form>-192.webp`, `-288.webp` | the official artwork                                    | WebP at 192 and 288 px, for the cards on sharp screens; the 475 px artwork added beside the 256 (spec 003's task 9 and spec 004; the owner's call, 2026-10-22) |

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
| 1                    | `hand-checked.test.ts`: the forms' values, recorded from the games or a named reference, each with where it was checked; spec 004's ten share the file                              |
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

| Item                    | The repository now              | What the sources say (quoted)                                                                                                                                                                                           | Decision                                                                                                                                                  |
| ----------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Getting the data        | none                            | PokéAPI: "Locally cache resources whenever you request them" ([docs](https://pokeapi.co/docs/v2)); `api-data` is "a static copy of the JSON data produced by PokeAPI" ([api-data](https://github.com/PokeAPI/api-data)) | One tarball of a pinned `api-data` commit per refresh; the live API is never called                                                                       |
| Where the dataset lives | none                            | –                                                                                                                                                                                                                       | Committed JSON in `packages/dex/data/`, so builds need no network and refreshes are reviewable diffs                                                      |
| Images                  | none                            | PokéAPI's sprites: "All image contents within are Copyright The Pokémon Company" ([licence](https://github.com/PokeAPI/sprites/blob/master/LICENCE.txt))                                                                | Committed WebP in `apps/web/public/dex-images/`, credited; never hot-linked                                                                               |
| Core packages           | the follow-ups plan's open item | –                                                                                                                                                                                                                       | `@workspace/eslint-config/core` and `@workspace/typescript-config/core.json`, used by every core package                                                  |
| Newer games' data       | –                               | The pinned `api-data` has the `legends-za`, `mega-dimension` and `champions` version groups, and Legends Z-A's new Megas                                                                                                | The owner's call (2026-10-22): included, like everything in the pin; the new Megas are battle-only, and `gen9` comes from `@pkmn/dex` as for any form     |
| Who checks by hand      | –                               | –                                                                                                                                                                                                                       | The owner's call (2026-10-22): Claude records each form from Bulbapedia, a source independent of PokéAPI, noted in `where`; the owner reviews the records |

## Tasks

1. **Core conventions.** Done: `core.js`, `core.json`, the empty
   `@workspace/dex` with Vitest, wired into Turborepo's `lint`, `typecheck`
   and `test`.
2. **The model.** Done: `types.ts` and `type-chart.ts` with its tests.
3. **The hand-checked forms** (recorded by Claude, reviewed by the owner;
   see "Decisions"). The file is committed with a blank
   record for each form in this spec's criterion 1 and spec 004's criterion
   2 (19 records: Charizard's two Megas and Urshifu's two styles are their
   own records). Each record holds types, base stats, abilities and the
   evolution step into it, from the games or a named reference; an unchecked
   one is a todo. Done when every record is checked.
4. **Fetch and pins.** Done: `sources.json`, `fetch.ts`, `.cache/` gitignored.
   Done when the pinned sources download once and are reused.
5. **Import: Pokémon, forms, types, abilities, moves.** Done: steps 2 to 4, 11
   and 12, with the test sample. Done when criteria 3, 4 and 5 pass on the
   sample.
6. **Import: evolutions, entries, names, learnsets, games, encounters.**
   Done: steps 5 to 8. Done when the sample's output has every field.
7. **Battle names.** Done: step 9 and `showdown.test.ts`. Done when criterion 2
   passes.
8. **Usage.** Done: step 10. Done when the sample month's top forms appear with
   their lists.
9. **The first full import.** Done: 1,339 forms, `forms.json` 87 KB
   gzipped. Run it, review the summary and the size,
   commit the data. Done when criteria 1, 3, 6, 7 and 9 pass on the full
   dataset.
10. **Images.** Done: 1,330 sprites and 1,335 artworks, 16.6 MB.
    `import-images.ts`, the committed images, `images.test.ts`.
    Done when criterion 8 passes.
11. **Documents.** `packages/dex/README.md` (the model, the entry points,
    how to refresh), AGENTS.md's Stack list (the data sources), the
    follow-ups plan's core-package item marked done. Done when the owner
    has audited them.
