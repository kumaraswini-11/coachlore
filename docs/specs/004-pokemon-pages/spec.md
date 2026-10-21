# 004: Pokémon pages

| Status  | Owner             | Written    |
| ------- | ----------------- | ---------- |
| Written | Aswini Kumar Sahu | 2026-10-21 |

## Goal

Everything someone looks up about one Pokémon, form, type, move or ability,
on one calm page each, correct to the data and fast on a phone.

## Where this comes from

The [project doc](../../project-doc.md): "What it is" (stats, weaknesses,
evolutions, where to catch it, moves, competitive use), "Scope" (a page for
each, moves and abilities, a type chart), "A Pokémon and a form are
different things", "Data for a new game" ("say what it doesn't know"), and
"What has to be true before this ships" (ten Pokémon checked by hand). The
screens are in [spec 001](../001-interface/spec.md): A Pokémon, Type chart,
Moves, A move, An ability.

## Requirements

### 1. A form's page: `/dex/[pokemon]` and `/dex/[pokemon]/[form]`

1. `/dex/rotom` is Rotom's default form; `/dex/rotom/wash` is Rotom-Wash.
   Every form in the data has a page; any other address is not found.
2. **Header:** the form's artwork (fixed size), national number, name, type
   badges, and the form switcher listing the Pokémon's forms (not shown when
   there's one). Previous and next go by national number, default forms
   only; on a phone a swipe does the same.
3. **Sections**, in this order:

   | Section     | Holds                                                                                                                                                                                                                      |
   | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | About       | Category ("Plasma Pokémon"), height and weight (metric, imperial in brackets), abilities (hidden one marked, each a link), Pokédex entries by game, names in other languages                                               |
   | Stats       | The six base stats as numbers and bars, and the total                                                                                                                                                                      |
   | Matchups    | Damage taken from each attacking type, by its types, grouped ×4, ×2, ½, ¼, ×0; with a note for each of its abilities that changes a matchup                                                                                |
   | Evolution   | The Pokémon's whole chain, each step a link, with its method in words ("Level 16", "Trade holding Metal Coat")                                                                                                             |
   | Moves       | The moves it learns in a chosen game (newest first by default), by method: level (with the level), machine, egg, tutor; sortable by name, type, power                                                                      |
   | Where       | Where to find it, by game and version, where the data has it; otherwise "Where to find it in [game] isn't in our data yet"                                                                                                 |
   | Competitive | From the latest monthly usage statistics, in each format we import: usage share, top four moves, items, abilities and teammates, with the month and Smogon credited. Hidden, with a line saying so, when the form has none |

4. **Accent:** the page's header and stat bars take the first type's colour,
   as decoration; numbers and names carry the meaning.
5. Opening the page adds the form to recently viewed (spec 003).
6. **Title:** the form's name; **description:** "[Name]: [types] type.
   Base stats, matchups, evolutions, moves and where to find it."

### 2. Type chart `/types`

1. Pick one or two defending types; the page shows what they take ×4, ×2,
   ½, ¼ and ×0 from, each attacking type named.
2. The full 18 × 18 chart, attacking down the side and defending across the
   top, with "×2", "½", "×0" or "×1" in each cell.
3. The choice is in the address (`/types?defending=steel,fairy`); the
   phone's "full chart" view is `/types?view=chart`.
4. Instant: arithmetic in the browser.

### 3. Moves `/moves` and a move `/moves/[move]`

1. `/moves`: every move in the data, filterable by name, type and category
   (physical, special, status), sortable by name, type, power, accuracy and
   PP; the address holds the view, as on `/dex`.
2. `/moves/[move]`: its type, category, power, accuracy, PP, priority (when
   not zero), the generation it came in, its effect in plain words, and
   "Learned by": the forms that learn it in a chosen game, as cards.
3. A missing number (a status move's power) shows "—", read as "no power".

### 4. An ability `/abilities/[ability]`

Its effect in plain words, and the forms that have it, in two groups:
normally and as a hidden ability.

### 5. The search palette: moves, abilities and types

The palette gets three more sources, after Pokémon: moves and abilities by
name (each opens its page), and types (opens `/types` with that type
chosen). At most eight results in total, grouped by kind. Moves and
abilities match their English names in both languages; types match their
English name and the name in the page's language.

### 6. Titles, descriptions and the sitemap

| Page                   | Title        | Description                                                                      |
| ---------------------- | ------------ | -------------------------------------------------------------------------------- |
| a form                 | `[Name]`     | as in 1.6                                                                        |
| `/types`               | `Type chart` | What each type is strong and weak against, for one type or two.                  |
| `/moves`               | `Moves`      | Every move, filtered by type and category, sorted by power, accuracy or PP.      |
| `/moves/[move]`        | `[Move]`     | [Move]: a [type] [category] move. Its effect, power, accuracy and who learns it. |
| `/abilities/[ability]` | `[Ability]`  | [Ability]: what it does, and which Pokémon have it.                              |

Titles and descriptions come from the dictionaries, in the page's
language (the table gives the English); names inside them stay English.
Each page sets its canonical address and names its other-language version.

The sitemap lists every form, move and ability page and `/types`, in both
languages.

### 7. Languages

Every page here exists at `/en/…` and `/hi/…`, built as static pages for
both ([ADR 0007](../../adr/0007-languages-and-right-to-left.md)):

1. Section names, labels, stat names, the matchup groups, evolution methods
   ("Level 48", "Trade holding Metal Coat") and ability notes come from the
   dictionaries, so they read in the page's language.
2. Pokémon, form, move, ability and game names stay English; Pokédex
   entries and move and ability effects are English only (the data has no
   others), marked `lang="en"` on a Hindi page so screen readers switch
   voice.
3. "Names in other languages" lists the data's languages, each name marked
   with its own `lang`.
4. Numbers (height, weight, stats, percentages) use the page's language's
   formatting.
5. Previous and next arrows follow the reading direction.

## Rules and edge cases

- **Matchups are the type chart's.** An ability that changes a matchup is
  a note under the groups ("With Levitate: no damage from Ground"), from a
  short list kept in the data, never a change to the numbers shown.
- **Forms differ:** each form's page shows its own types, stats, abilities,
  moves and artwork. The Pokémon's shared facts (category, Pokédex
  entries, evolution chain, names in other languages) come from the
  Pokémon and are the same on each of its forms' pages.
- **Cosmetic forms** (different look only) aren't separate pages.
- **Evolution methods** come from the data, written in words by code;
  a method the code can't describe shows "Special condition" and is
  logged as a gap to fill.
- **Moves by game:** the game picker lists only games the form appears in.
  A form with no moves in the data for any game says so.
- **Pokédex entries:** identical texts in several games are shown once,
  with the games listed together.
- **Usage statistics** are a month old at best; the month is always shown.
  No usage for a form is normal, not an error.
- **Missing data is said, never guessed:** a blank field shows "Not in our
  data yet", never a zero or an empty box.

## Screens

Spec 001's wireframes for A Pokémon, Type chart, Moves, A move and An
ability, with these details:

- On a phone, the form's sections are tabs that stay at the top while
  scrolling; on desktop, one scroll with a section menu, the artwork and key
  facts in a sticky column.
- The form switcher is a Toggle Group on a phone (scrolling sideways when
  long) and a Select on desktop.
- Moves: on a phone, one row per move (name, type badge, power, method
  detail); on desktop, a table.
- The full type chart on a phone scrolls both ways with the first row and
  column pinned.

## Acceptance criteria

1. Every form, move and ability in the data has a page, built at build
   time; an unknown address shows not found with status 404.
2. **Ten forms checked by hand** against the games' published data (types,
   base stats, abilities, evolution): Pikachu, Charizard, Rotom, Rotom-Wash,
   Urshifu (both styles), Galarian Meowth, Paldean Tauros (Combat Breed),
   Garchomp and Eevee; recorded as a test of fixed expected values.
3. The type chart's 324 multipliers match a fixed table in a test, and a
   dual type's result is the product of its two types' multipliers.
4. A form whose data lacks a section shows that section's "not in our
   data" text, never an empty block (tested with a fixture form).
5. On a mid-range phone profile, a form's page has LCP under 2.5 s and CLS
   under 0.1, with its artwork as the LCP element.
6. Every page in this spec passes axe with no WCAG 2.2 AA violations at
   360 px and 1280 px in both themes; tabs, the form switcher, the swipe's
   buttons and sortable headers work by keyboard, and sort state is
   announced.
7. The palette finds "thunderbolt", "levitate" and "steel", and opens the
   right page.
8. Visited pages open offline (spec 003's service worker covers these
   routes).
9. Every page here is built for `en` and `hi`; on a Hindi page the labels,
   section names, evolution methods and ability notes are Hindi, the names
   English, and English-only text carries `lang="en"`.
10. **The build stays within budget.** With every Dex page in both
    languages (about 7,000), the production build on Vercel finishes in 15
    minutes or less, a third of Vercel's limit ("The maximum duration of the
    Build Step is 45 minutes", [Vercel limits](https://vercel.com/docs/limits)),
    and the page count and output size are recorded in the pull request. If
    it doesn't, moves and abilities are no longer built ahead: they render
    on their first request and are then cached, while Pokémon and form pages
    stay built at build time; Vercel's limits page recommends the same
    ("pre-render a subset of the total number of pages at build time").

## Out of scope

- Shiny artwork, cries, sprites galleries (spec 001, "Where this comes
  from").
- Stats at level 50 or 100, natures, EVs and damage (later: `/calc`).
- Items and locations as pages of their own.
- Comparing Pokémon (later: `/compare`).

## Changes

- 2026-10-21: written.
- 2026-10-21: languages (ADR 0007): both languages; evolution methods and
  ability notes from the dictionaries; English text marked `lang="en"`.
