# 003: Dex browse

| Status  | Owner             | Written    |
| ------- | ----------------- | ---------- |
| Written | Aswini Kumar Sahu | 2026-10-21 |

## Goal

Anyone, on a phone, finds any Pokémon in a few seconds: by name, number,
type, weakness, game, generation, ability or stats, online or off, without
an account.

## Where this comes from

The [project doc](../../project-doc.md): "What it is" (the Dex), "Scope"
(browse and filter; offline Dex and mobile first), "The interface"
("Anything the browser can work out is instant"), and "What has to be true
before this ships" (Core Web Vitals on a mid-range phone). The screens are
in [spec 001](../001-interface/spec.md): Home, Browse the Dex, A game's Dex,
the search palette and the offline page.

## Requirements

### 1. Home `/`

1. A search box that opens the search palette.
2. **Recently viewed:** the last 12 forms whose pages the person opened, most
   recent first, kept in their browser only. Hidden when there are none.
3. **Browse:** links to the Dex, browsing by type (the Dex with the type
   filter open), browsing by game (the newest game's Dex), the type chart and
   the team check.
4. The league blocks (a live draft, the person's leagues) are added by specs
   007 and 008; until then, home shows the Dex blocks only (spec 001, rule
   4: no dead controls). From spec 007, signed out, one card says what a
   draft league is ("Friends draft Pokémon with a points budget, then play
   a season on Showdown; Coachlore keeps the score."), with "How leagues
   work" (a section of `/about`) and "Sign in with Discord".

### 2. Browse the Dex `/dex`

1. Every form in the data, as a grid of cards (sprite, national number, name,
   type badges) or a list (a table with the base stats and total).
2. **Default forms only** at first; a "Forms" filter shows other forms
   (regional, Mega, Gigantamax, other).
3. **Filters**, combinable:

   | Filter     | Meaning                                                           | Values                                                           |
   | ---------- | ----------------------------------------------------------------- | ---------------------------------------------------------------- |
   | Name or #  | Name contains the text, or the national number equals it          | free text                                                        |
   | Type       | Has every chosen type                                             | up to two of the 18 types                                        |
   | Weak to    | Takes ×2 or more from every chosen type, by its types alone       | up to two types                                                  |
   | Resists    | Takes ½ or less (or nothing) from every chosen type, by its types | up to two types                                                  |
   | Game       | Is in that game's Pokédex                                         | one game                                                         |
   | Generation | Was introduced in that generation                                 | one or more of I to IX                                           |
   | Ability    | Can have that ability, hidden or not                              | one ability                                                      |
   | Stats      | Each chosen base stat within its range                            | HP, Attack, Defense, Sp. Atk, Sp. Def, Speed, Total; min and max |
   | Forms      | Which forms show                                                  | default, all, regional, Mega, Gigantamax, other                  |

4. **Sort** by number (default), name, or any base stat or the total;
   ascending or descending.
5. **The address holds the view**: every filter, the sort and grid or list
   are in the query string, so a view can be shared, bookmarked and reached
   with Back. An unknown value in the address is ignored, not an error.
6. **Instant:** filtering and sorting happen in the browser over data already
   loaded: no request, no spinner.
7. The result count is shown and announced politely when it changes.
8. Each card is one link to the form's page (spec 004).

### 3. A game's Dex `/games/[game]`

1. One page per game in the data that has its own Pokédex, numbered by that
   game's regional Pokédex.
2. A game picker switches games; a version picker (All and each version)
   marks version exclusives with an "Only in [version]" badge, where the
   data has them.
3. The same filters and sort as `/dex`, scoped to the game.
4. A game whose data is incomplete (where to find each Pokémon, version
   exclusives) says so above the grid: "Data for this game is still being
   added".
5. "Browse by game" from Home opens the newest game.

### 4. The search palette: Pokémon and forms

The palette (spec 001) gets its first source: every form, matched by name
(prefix first, then anywhere in the name) and by national number, at most
eight results, each with its sprite, number and type badges. Enter opens the
form's page. In both languages it matches the English name (the data has
no Hindi names; ADR 0007), so "rotom" finds Rotom on a Hindi page too. A
query written in Devanagari that finds nothing says why, in the page's
language: names are searched in English (a dictionary string, with an
example), rather than only "No results".

### 5. The offline Dex

1. After a first visit online, the Dex keeps working without a connection:
   Home, `/dex` and `/games/[game]` with all their filters, the search
   palette's Pokémon results, and every Dex page the person has opened
   (spec 004's pages, the type chart and the team check included).
2. A page that isn't saved shows the offline page (spec 001).
3. While offline, a quiet notice says "You're offline. The Dex still works."
4. When a new version of the site is deployed, the saved copy updates on the
   next visit online; a person never gets a mix of old and new pages.
5. Nothing from Leagues is saved for offline use.
6. **Installable:** the web app manifest lists 192 × 192 and 512 × 512
   icons beside the existing ones, so a phone can add the Dex to its home
   screen. No install prompt of our own.
7. **One language at a time:** the pages saved for offline use are those of
   the language in use (`/en/…` or `/hi/…`), plus the language-neutral
   data (the form list, sprites); an unsaved page offline shows that
   language's offline page.

### 6. Images

Each card shows the form's small sprite, at a fixed size, so nothing shifts
as images load. Images are served from our own site, never linked from
another's (the project doc: "as few official images as possible"; ADR 0006,
"Images"). A form without a sprite shows a neutral placeholder with its
name.

### 7. Titles, descriptions and the sitemap

| Page            | Title          | Description                                                                              |
| --------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `/`             | (the site's)   | (the site's)                                                                             |
| `/dex`          | `Dex`          | Every Pokémon and form, filtered by type, weakness, game, generation, ability and stats. |
| `/games/[game]` | `[Game]'s Dex` | The Pokémon in Pokémon [Game], in its own Pokédex order, with version exclusives marked. |

Titles and descriptions come from the dictionaries, in the page's
language; the table gives the English. Each page sets its canonical address
and names its other-language version (spec 001, "Languages").

The sitemap lists `/dex` and every `/games/[game]`, in both languages.

### 8. Languages

Every page in this spec exists at `/en/…` and `/hi/…`, built as static
pages for both ([ADR 0007](../../adr/0007-languages-and-right-to-left.md)).
Filter labels, sort options, counts ("12 Pokémon"), notices and empty
states come from the dictionaries; Pokémon, form, ability and game names
stay English; numbers use the page's language's formatting. The address's
query (`?type=steel`) uses the same English keys in both languages, so a
filtered view's link works in either.

## Rules and edge cases

- **Weak to and Resists use types only.** Abilities that change matchups
  (Levitate, for example) are noted on the form's page (spec 004), not used
  by the filter, so the filter's answer is always the type chart's.
- **Type with two values** means both types; a single-type form never
  matches two chosen types.
- **Stats ranges** are inclusive; an empty end is open.
- **Forms with the same number** (Rotom and its forms) sort together, the
  default form first.
- **Names** are English in v1; names in other languages appear on a form's
  page (spec 004), not in search.
- **Recently viewed** stores form keys only, in the browser; it's never sent
  anywhere.
- **No data for a game** that has no regional Pokédex in the data: that game
  has no page, and the picker doesn't list it.

## Screens

Spec 001's wireframes for Home, Browse the Dex and A game's Dex, with these
details:

- Filters: on a phone, "+ Filter" opens the filters in a bottom sheet with
  "Show N Pokémon" at the bottom; each active filter is a removable chip
  above the results. On desktop, the filters are a panel on the left and the
  chips sit above the grid. "Clear all" removes every filter.
- Grid columns: 3 at 360 px, 4 from 600 px, 6 from 1024 px, 8 from 1440 px.
- List view on a phone: number, name, types and total, with the six stats on
  a second line; on desktop, one column per stat, each sortable.
- The offline notice is an Alert under the top bar, dismissible.

## Acceptance criteria

1. Every form in the data has a card in `/dex` with "Forms: all", and the
   count matches the dataset's.
2. Each filter returns exactly the forms a test computes from the dataset for
   at least three values, including two-type Type, Weak to and Resists.
3. A view's address, opened in a new tab, shows the same filters, sort and
   layout; Back restores the previous view.
4. Filtering and sorting make no network request (checked by the test).
5. At 4× CPU slowdown, changing a filter on `/dex` with all forms showing
   responds within 200 ms (the interaction's duration, measured in the
   browser).
6. On a mid-range phone profile, `/dex` and `/` have LCP under 2.5 s and CLS
   under 0.1.
7. Offline after one online visit: `/dex` filters work, the palette finds
   Pokémon, a visited form's page opens, an unvisited one shows the offline
   page.
8. After a new deploy, a visit online replaces the saved copy; the old pages
   aren't served once the new ones are.
9. The palette finds "rotom", "479" and "wash" (Rotom-Wash) and opens the
   right page.
10. Every page in this spec passes axe with no WCAG 2.2 AA violations at
    360 px and 1280 px in both themes, and every control works by keyboard.
11. The result count is announced in a polite live region when filters
    change.
12. The manifest lists 192 × 192 and 512 × 512 PNG icons that exist and
    load, and an installability check reports no errors for the site.
13. Every page in this spec is built for `en` and `hi` (the build's route
    table lists both), shows its interface text in the page's language and
    Pokémon names in English, and names its other-language version.
14. Offline after one online visit in Hindi, `/hi/dex` works and an unsaved
    page shows `/hi/offline`; the same query string gives the same results
    on `/en/dex` and `/hi/dex`.
15. A Devanagari query with no results (such as "गारचोम्प") shows the
    message that names are searched in English, not the plain empty state.
16. The build's size and time are within spec 004's budget (spec 004
    measures the whole Dex build, both languages).

## Out of scope

- Plain-language search (spec 012).
- Search in other languages.
- Saving filters or favourites to an account.
- Compare and the damage calculator (later).

## Changes

- 2026-10-21: written.
- 2026-10-21: audit. Home shows no league card before spec 007; the
  signed-out league card's copy; the manifest's 192 and 512 px icons.
- 2026-10-21: languages (ADR 0007): both languages, English names in
  search, offline per language.
