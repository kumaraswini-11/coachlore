# 005: Team check

| Status  | Owner             | Written    |
| ------- | ----------------- | ---------- |
| Written | Aswini Kumar Sahu | 2026-10-21 |

## Goal

Put up to six forms together and see at a glance what the team is weak to
and what it can't hit, instantly, with nothing to sign in to, and share it
as a link.

## Where this comes from

The [project doc](../../project-doc.md): "What it is" ("Build a team of six
and see at a glance what it's weak to and what it can't hit"), "Scope" (a
team checker), and "The interface" ("Filters, the type chart and the team
checker are arithmetic over data already loaded"). The screen is in
[spec 001](../001-interface/spec.md): Team check.

## Requirements

1. **The team:** up to six members. A member is a form, optionally with up
   to four moves and an ability. A form can appear more than once; the team
   check doesn't enforce any format's rules.
2. **Adding a member:** "+" opens a search over every form (the same
   matching as the search palette); choosing one fills the next empty
   slot. A member can be removed, and its moves and ability changed, from
   its slot.
3. **Moves:** chosen from the moves the form learns in any game in the data.
   An ability: chosen from the form's abilities.
4. **Weaknesses:** for each of the 18 attacking types, what each member
   takes from it by its types (×4, ×2, ×1, ½, ¼, ×0), how many members are
   weak to it and how many resist it or are immune.
5. **Coverage:** for each of the 18 types as a single defending type,
   whether any member hits it super-effectively. A member's damaging moves
   count; a member with no moves chosen counts its own types instead, and
   the coverage says so ("by type, as no moves are chosen").
6. **The link holds the team** (`/team-check?team=…`), so a team is shared
   by copying the address; "Share" copies it and says "Link copied".
   A league roster opens here the same way: a coach's roster page (spec 008)
   links to `/team-check?team=…` built from its forms. With more than six
   forms in the link, the first six are checked and the rest are listed as
   "Also on the roster", each a button that swaps it in.
7. **Import:** paste a team in Showdown's export format; members, moves and
   abilities are read from it. **Export:** the team as Showdown text, to
   copy.
8. **Instant:** every change recomputes in the browser, with no request.
9. Works offline once visited (spec 003's service worker covers the
   route); a member's move list is available offline only if it was loaded
   before, and the editor says so when it wasn't.
10. **Title** `Team check`; **description** "See what a team of up to six
    Pokémon is weak to and what it can't hit, and share it as a link." Both
    from the dictionaries, in the page's language.
11. **Languages** ([ADR 0007](../../adr/0007-languages-and-right-to-left.md)):
    the page exists at `/en/team-check` and `/hi/team-check`; labels, the
    matrix's headings, counts and messages come from the dictionaries;
    Pokémon, move and ability names stay English. **The link is
    language-neutral:** `?team=…` uses the same English keys in both
    languages, so a link shared from one opens the same team in the other.
    Showdown's import and export text is always English, as Showdown
    writes it.

## Rules and edge cases

- **Shared weakness:** a type that two or more members take ×2 or more
  from. **Uncovered:** a shared weakness that no member resists or is
  immune to. Both are words in the interface, with the warning colour
  beside them, never colour alone.
- **Weaknesses use types only,** like the Dex's filters. A member whose
  ability changes a matchup gets that ability's note (spec 004's list)
  under the matrix; the numbers don't change.
- **Coverage counts damaging moves by their type.** Status moves don't
  count. Moves whose type or effectiveness changes in battle count by
  their listed type.
- **Unknown names in an import** (a Pokémon, move or ability the data
  doesn't have, or a Showdown name we can't map) are listed in an Alert,
  and the rest of the team is imported; nothing is guessed.
- **More than six** members in an import: the first six are taken and the
  Alert says so.
- **A broken link** (an unknown key, more than six members, more than four
  moves): the valid parts load, and the rest are listed, as for an import.
- Items, natures, levels, EVs, Tera types and nicknames in an import are
  ignored; export doesn't write them.

## Screens

Spec 001's Team check wireframes, with these details:

- Slots: three by two on a phone, six in a row on desktop; an empty slot is
  a "+" button labelled "Add a Pokémon"; a filled slot shows the sprite,
  name and type badges, and opens a sheet (phone) or popover (desktop) for
  moves, ability and "Remove".
- The weakness matrix: on a phone, one row per attacking type with the
  counts and a "show members" disclosure; on desktop, a table with a column
  per member.
- Import is a dialog with a text area; export is a dialog with the text and
  "Copy".

## Acceptance criteria

1. For five fixed teams, the weakness matrix, shared and uncovered
   weaknesses, and coverage match values computed in a test from the type
   chart, including a team with no moves and one with only status moves.
2. A team's link, opened in a new tab, shows the same members, moves and
   abilities.
3. Importing three Showdown exports (singles, doubles, and one with forms
   such as Rotom-Wash, Urshifu-Rapid-Strike and a regional form) gives the
   expected team; exporting it and importing again gives the same team.
4. An import with an unknown Pokémon and an unknown move imports the rest
   and lists both unknown names.
5. Changing the team makes no network request.
6. The page passes axe with no WCAG 2.2 AA violations at 360 px and
   1280 px in both themes; adding, editing and removing members works by
   keyboard, and each change to the result is announced politely once.
7. Opening a team link offline, after one online visit to the page, shows
   the team.
8. A link with ten forms checks the first six and lists the other four as
   "Also on the roster"; swapping one in changes the result and the link.
9. The same `?team=` opens the same team on `/en/team-check` and
   `/hi/team-check`; the Hindi page's interface text is Hindi and its
   names English.

## Out of scope

- "Explain my team" and suggested fixes (spec 012).
- Saving teams to an account.
- Legality checks for a format.
- Damage calculation (later: `/calc`).

## Changes

- 2026-10-21: written.
- 2026-10-21: audit. A roster link with more than six forms.
- 2026-10-21: languages (ADR 0007): both languages; the link stays
  language-neutral.
