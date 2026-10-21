# @workspace/dex

Coachlore's Pokémon dataset, and the code that reads it: every form, its
types, stats and abilities, the type chart, moves, abilities, games and
their Pokédexes, evolutions, where each form is found, what it learns,
Showdown's names for all of it, and a month of competitive usage. The
dataset is imported from pinned sources and committed in `data/`, so a
build needs no network and a refresh is a diff to review
([spec 002](../../docs/specs/002-pokemon-data/spec.md), and its
[plan](../../docs/specs/002-pokemon-data/plan.md) for every rule below).

## Why a separate package

It owns the Pokémon data and nothing else, and it's a core package: no
framework, interface or storage code (AGENTS.md, "The core is
framework-agnostic"), which `@workspace/eslint-config/core` enforces. The
web app, the league rules and the battle-log parser read the same data from
here.

## Use

Add it to a package's `dependencies` as `"@workspace/dex": "workspace:*"`.
It has three entry points:

| Import                      | What it gives                                                                                                    | Where it runs                                         |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `@workspace/dex`            | The data model's types; `forms`, `typeChart`, `moves`, `abilities`, `games`, `showdown`, `credits`; `multiplier` | Anywhere, the browser included                        |
| `@workspace/dex/files`      | `readPokemon(key)`, `readLearnset(form)`, `readUsage()`, `readLocations()`: the large files, on demand           | Node only: Server Components, scripts                 |
| `@workspace/dex/type-chart` | `multiplier(chart, attacking, defending)` alone, with no data                                                    | Anywhere; for a component given a chart               |
| `@workspace/dex/filter`     | `dexFilter`, `filterForms`, `sortForms`, with no data                                                            | Anywhere; for a component that loads the forms itself |
| `@workspace/dex/types`      | The model's types and key lists (`TYPE_KEYS`, `STAT_KEYS`), with no data                                         | Anywhere                                              |
| `@workspace/dex/forms.json` | The form list alone, for a dynamic `import()` that keeps it out of a page's own JavaScript                       | The browser                                           |

```ts
import { forms, multiplier, typeChart } from "@workspace/dex"

const garchomp = forms.find((form) => form.key === "garchomp")
multiplier(typeChart, "ice", garchomp?.types ?? []) // 4
```

`files` readers take a key, never a path: anything but lowercase letters,
digits and hyphens reads nothing. Each also takes the data folder, for a
caller whose bundler moves the package's files.

The types are in [`src/types.ts`](src/types.ts). Keys are PokéAPI's names:
a Pokémon by its species (`rotom`), a form by its Pokémon (`rotom-wash`).

## What's in `data/`

| File                     | Holds                                                                     |
| ------------------------ | ------------------------------------------------------------------------- |
| `forms.json`             | Every form, for the grid, search and filters (at most 150 KB gzipped)     |
| `types.json`             | The type chart: each multiplier that isn't 1                              |
| `moves.json`             | Every move but the Shadow moves                                           |
| `abilities.json`         | The main series' abilities                                                |
| `games.json`             | Each game, its versions and Pokédexes                                     |
| `showdown.json`          | Showdown's IDs for forms, moves and abilities, and each form's name       |
| `usage.json`             | Smogon's usage for the pinned month and formats                           |
| `locations.json`         | Each place a form is found, by its English name                           |
| `credits.json`           | Each source, its licence and the version imported                         |
| `pokemon/<pokemon>.json` | A Pokémon's forms with their encounters, its evolution, entries and names |
| `learnsets/<form>.json`  | A form's moves, by game                                                   |

Never edit them by hand: a fix goes in `overrides/`, and the import writes
it.

## The hand-kept files

In `overrides/`, each entry with its reason:

- `overrides.json`: a fix to one field, with a link to where the right
  value is shown. One whose path stops matching fails the import.
- `excluded-forms.json`: forms left out, such as the Totem forms.
- `exclusives.json`: version exclusives per game, with a link; PokéAPI has
  none.
- `showdown-exceptions.json`: Showdown IDs that don't match ours by rule.

## Refreshing the data

The sources are pinned in [`sources.json`](sources.json). A new pin is the
newest commit or month at least two weeks old (AGENTS.md, "Versions").
Every month on the 16th, the "Data freshness" workflow looks for newer pins
and opens an issue when there are some; it never commits
([ADR 0009](../../docs/adr/0009-pokemon-data-imported-and-refreshed.md)).
On a branch, from the repository's root:

```sh
bun run data:refresh   # new pins, then the import (prints what changed), then the images
```

That runs, in turn, `update-pins` and `import` here and `import-images` in
`apps/web`; each also runs alone with `bun run --filter …`.
`bun packages/dex/scripts/update-pins.ts --check`, what the monthly workflow
runs, only reports.

Downloads go to `.cache/` (gitignored) and are reused. Review the change
summary and the diff, run the checks in AGENTS.md (the hand-checked forms,
integrity and size are in `bun run test`), then commit `data/`,
`sources.json` and the images together. When the import starts reading a new field or endpoint,
`bun run --filter @workspace/dex make-fixture` rebuilds the test sample in
`test/fixtures/` from the cache.

## Credits

Data from [PokéAPI](https://github.com/PokeAPI/api-data) (BSD-3-Clause),
images from [PokéAPI's sprites](https://github.com/PokeAPI/sprites)
(© The Pokémon Company), usage from
[Smogon University](https://www.smogon.com/stats/), and battle names from
[`@pkmn/dex`](https://github.com/pkmn/ps) (MIT). `credits.json` lists each
with its version. The footer and `/legal` credit the data (spec 001); the
images' credit joins them with the first page that shows an image (spec
003's plan, task 4).
