# 002: Pokémon data

| Status  | Owner             | Written    |
| ------- | ----------------- | ---------- |
| Written | Aswini Kumar Sahu | 2026-10-21 |

## Goal

Our own Pokémon dataset: every Pokémon and form, with types, stats,
abilities, moves, evolutions, games and where to find each one, imported
from public sources into the repository, correct for forms from the start,
refreshable when a source updates, and usable without a network or a
server by the Dex, the leagues and the battle-log parser.

No routes. Specs 003, 004 and 005 show this data; 007 to 009 price, draft
and read it.

## Where this comes from

The project doc: "Pokémon data is ours once it's imported", "A Pokémon and
a form are different things", "Data for a new game", "What has to be true
before this ships" (ten Pokémon checked by hand), the Assumptions on public
data; ADR 0006, "Pokémon data"; the glossary's Pokémon data terms.

## Requirements

### What the dataset holds

1. **Pokémon:** every Pokémon in the source, with its National Dex number,
   name, generation, category ("Plasma Pokémon"), whether it's legendary or
   mythical, its forms (one marked default), its evolution chain, its names
   in the source's languages, and its Pokédex entries by version (English).
2. **Forms:** every form with its own types, base stats (HP, Attack,
   Defense, Special Attack, Special Defense, Speed, and their total),
   abilities (up to two, plus a hidden one), height and weight, whether
   it's the default form, whether it exists only in battle (Mega Evolution,
   Gigantamax and similar), the generation it was introduced in, whether
   it can be used in Generation 9 battles, and its Showdown tags
   (Restricted Legendary, Sub-Legendary, Mythical and the like), which
   leagues use to price and ban forms (spec 007).
3. **Cosmetic differences are not forms.** A difference only in looks
   (Vivillon's patterns, Shellos's East Sea) belongs to the form it
   decorates, not a form of its own. Forms that can't be played (Totem
   forms and similar) are left out, each listed with its reason.
4. **Types:** the eighteen types and the current type chart: the
   multiplier for every attacking type against every defending type.
5. **Moves:** every move with its type, category (physical, special,
   status), power, accuracy, PP, priority and a short English effect.
6. **Abilities:** every ability with a short English effect and the forms
   that have it, normally or as a hidden ability.
7. **Learnsets:** for each form, the moves it learns in each game, and how
   (level with the level, machine, egg, tutor, other).
8. **Games:** each game, its versions, the generation, and its regional
   Pokédex with each Pokémon's regional number.
9. **Where to find each Pokémon,** by version, for the games the source
   covers. Games the source doesn't cover are marked as not covered, never
   shown as "nowhere".
10. **Usage statistics:** for Generation 9 singles and doubles, each form's
    usage share, and its most common moves, items, abilities and partners,
    from one named month.
11. **Battle names:** a table from every name a Showdown battle log can
    give a Pokémon to our form (Rotom-Wash → `rotom-wash`, Urshifu →
    `urshifu-single-strike`), covering every Pokémon and form legal in
    Generation 9.
12. **Images:** for each form, a small sprite (search) and one artwork
    (the Dex's cards and the form's page), from a source that allows reuse with credit, stored and
    served by us, never loaded from the source's servers.
13. **Provenance:** the dataset records which source, at which version,
    each part came from, and the date it was imported. Credits for every
    source are part of the dataset, for `/about` and `/legal`.

### How it's made

14. **Imported, never fetched live.** A script turns pinned copies of the
    sources into the dataset; the app never calls a source while it runs.
15. **The same inputs give the same output,** byte for byte, so a refresh
    shows exactly what changed.
16. **Refreshing** is changing a pinned source version and running the
    import; the result is reviewed and committed like any other change,
    with a summary of what changed (Pokémon, forms, moves added, removed or
    altered).
17. **Hand fixes:** a gap or error in a source (a new game's data, a wrong
    value) is fixed in a small file of overrides, each with a reason and a
    link, applied after the import, so a refresh never loses it.
18. **Small enough for a phone:** the Dex's list of every form (enough for
    the grid, search and filters) is a single file of at most 150 KB
    compressed; everything else is split so a page loads only what it
    shows.
19. **Plain code.** The data model and the dataset are a package with no
    framework, interface or storage code (AGENTS.md, "The core is
    framework-agnostic"), usable from a plain script, the web app, the
    server and the battle-log parser.

## Rules and edge cases

- **Default forms.** A Pokémon's default form is the one the source marks
  default. Its address is the Pokémon's (`/dex/urshifu`), even when the
  form's key differs (`urshifu-single-strike`); the form's own address
  redirects there.
- **Forms with the same types and stats** (Toxtricity's Amped and Low
  Key, which differ in abilities and moves) are still separate forms if
  the source makes them separate.
- **Gender differences** that change stats or abilities (Indeedee,
  Meowstic, Basculegion, Oinkologne) are forms; those that change only
  looks aren't.
- **Battle-only forms** (Megas, Gigantamax, and any other form the source
  marks as existing only in battle) are in the dataset, marked battle-only.
  Whether a league can draft them is the league's tier list's business
  (spec 007).
- **A name in a battle log we can't map is an error,** never a guess: the
  mapping is checked by a test, and the parser (spec 009) reports an
  unknown name instead of skipping it.
- **Missing data says so.** A field the source doesn't have (a new game's
  locations, a form's Pokédex entry) is absent, and the dataset marks the
  game as not covered, so the interface can say "not in our data yet".
- **Usage statistics are optional:** a form with none has none; the month
  shown is always named.
- **The chart is the current one.** Older generations' type charts are out
  of scope for v1.
- **Names and languages** ([ADR 0007](../../adr/0007-languages-and-right-to-left.md)).
  Every name the dataset holds for a Pokémon, form, move, ability, type or
  game is its English name; that's the name the interface shows in every
  language and the one search matches. The source has no Hindi names, so a
  Hindi page shows the English ones. A Pokémon's names in the source's other
  languages are kept, keyed by language, for the Pokémon page (spec 004).
  Effects and Pokédex entries are English only. Types' names are translated
  by the interface's dictionaries, not by the dataset.

## Screens

None. The credits this spec records appear on `/about` and `/legal` (spec 001) and in the footer.

## Acceptance criteria

1. **Ten checked by hand.** For these ten, the dataset's types, base
   stats, abilities (hidden marked) and evolution steps match the values
   the owner checks in the games' data and records in a test: Rotom-Wash,
   Urshifu (Rapid Strike), Lycanroc (Dusk), Toxtricity (Low Key), Indeedee
   (Female), Tauros (Paldea Aqua Breed), Ogerpon (Wellspring Mask),
   Ninetales (Alola), Charizard (with its Mega forms marked battle-only)
   and Vivillon (one form, its patterns not forms).
2. **Battle names.** Every Pokémon and form legal in Generation 9, by the
   battle simulator's own data, maps to exactly one of our forms; a test
   fails on any that doesn't. The same test checks the Generation 9 flag
   and tags on three forms: Koraidon (usable, Restricted Legendary), Mew
   (Mythical) and Mega Charizard X (not usable in Generation 9).
3. **No dangling keys.** Every form, move, ability, type, game and
   evolution step the dataset refers to exists in it (a test).
4. **Repeatable.** Running the import twice on the same pinned inputs gives
   identical files (a test in CI on a small sample, and once in full by
   hand when the dataset is first made).
5. **Overrides survive.** An override changes the value it names, and the
   import fails if an override names something that doesn't exist.
6. **Size.** The form list is at most 150 KB gzip-compressed (a test).
7. **Plain code.** The package imports no framework, interface or storage
   code (a lint rule), and a plain script can load a form and its type
   matchups.
8. **Images.** Every form that has a sprite and an artwork in the source
   has both, served from our own address, each within its size limit (a
   test lists any missing).
9. **Credits and provenance** list every source with its licence, the
   pinned version used, and the date it was imported.
10. **A game's Pokédex** keeps the game's own order and numbers, and marks
    each version exclusive with its version.
11. **Every form's images** are found by its own source identifier, for
    default and non-default forms alike.

## Out of scope

- Items, natures, locations as pages, and older type charts.
- Languages other than English for effects and Pokédex entries (names in
  other languages are in). Hindi names: the source has none.
- Damage calculation (later, `/calc`).

## Changes

- 2026-10-21: written.
- 2026-10-21: names and languages (ADR 0007): English names everywhere,
  other languages' names kept for the Pokémon page.
- 2026-10-22: the artwork is in the form list too, for spec 003's cards.
