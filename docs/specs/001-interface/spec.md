# 001: Interface

| Status  | Owner             | Written    |
| ------- | ----------------- | ---------- |
| Written | Aswini Kumar Sahu | 2026-10-21 |

## Goal

One design system, one app shell and one way of showing every state, so
that each screen in the later specs is assembled from known parts rather
than designed from scratch, and every v1 screen is described here before
it's built.

This spec builds the tokens, the shell, the shared states, the two
languages (English and Hindi, ready for right-to-left ones;
[ADR 0007](../../adr/0007-languages-and-right-to-left.md)) and four pages
(`/about`, `/legal`, not found and `/offline`). The other screens are specified
here and built by the spec named in the [screen inventory](#screen-inventory).

## Where this comes from

The [project doc](../../project-doc.md) ("The interface", "Scope") and
[the screens research](../../research/pokemon-app-screens.md), a dated
snapshot. Where they differ, the project doc wins. What this leaves out of
v1, and why, is under [Out of scope](#out-of-scope).

## Requirements

### 1. Tokens

All colours, sizes and durations are tokens in the shared interface theme,
used by name. Light and dark are both full palettes; a first visit follows
the device, and a choice made with the theme button survives a reload.

**Semantic colours.** shadcn's set (background, foreground, card, popover,
primary, secondary, muted, accent, destructive, border, input, ring, and
each one's foreground), plus two this product needs:

| Token     | For                                                          | Rule                                                  |
| --------- | ------------------------------------------------------------ | ----------------------------------------------------- |
| `success` | A confirmed result, an accepted trade, a covered weakness    | Text on it, and it as text on the background, ≥ 4.5:1 |
| `warning` | A disputed result, an uncovered weakness, a timer under 10 s | Same                                                  |

Each is always paired with words or an icon with a label, never colour
alone (WCAG 1.4.1). The focus ring stays at ≥ 3:1 against the background in
both themes (already true: 3.40:1 light, 4.48:1 dark).

**Type colours.** Eighteen pairs, `--type-<name>` and
`--type-<name>-foreground`, the same in light and dark. The fills are
Bulbapedia's type colour templates (for example
[Normal](https://web.archive.org/web/20260908202715/https://bulbapedia.bulbagarden.net/wiki/Template:Normal_color),
read through the Internet Archive because Bulbapedia blocks automated
checks), with Fire darkened from `#E62829` to `#E42829`, the smallest change
that passes with white text. The text colour is whichever of `#0A0A0A` and
`#FFFFFF` contrasts more, computed with WCAG's formula on 2026-10-21:

| Type     | Fill      | Text      | Contrast |
| -------- | --------- | --------- | -------- |
| Normal   | `#9FA19F` | `#0A0A0A` | 7.61:1   |
| Fire     | `#E42829` | `#FFFFFF` | 4.53:1   |
| Water    | `#2980EF` | `#0A0A0A` | 5.12:1   |
| Electric | `#FAC000` | `#0A0A0A` | 11.88:1  |
| Grass    | `#3FA129` | `#0A0A0A` | 5.98:1   |
| Ice      | `#3DCEF3` | `#0A0A0A` | 10.67:1  |
| Fighting | `#FF8000` | `#0A0A0A` | 7.86:1   |
| Poison   | `#9141CB` | `#FFFFFF` | 5.49:1   |
| Ground   | `#915121` | `#FFFFFF` | 6.17:1   |
| Flying   | `#81B9EF` | `#0A0A0A` | 9.54:1   |
| Psychic  | `#EF4179` | `#0A0A0A` | 5.38:1   |
| Bug      | `#91A119` | `#0A0A0A` | 6.90:1   |
| Rock     | `#AFA981` | `#0A0A0A` | 8.31:1   |
| Ghost    | `#704170` | `#FFFFFF` | 7.84:1   |
| Dragon   | `#5060E1` | `#FFFFFF` | 5.12:1   |
| Dark     | `#624D4E` | `#FFFFFF` | 7.80:1   |
| Steel    | `#60A1B8` | `#0A0A0A` | 6.87:1   |
| Fairy    | `#EF70EF` | `#0A0A0A` | 7.76:1   |

Every pair passes WCAG 2.2 AA for normal text (4.5:1). A type badge always
shows the type's name in its text colour; a stat bar or a header tint in a
type colour is decoration, and the number or name beside it carries the
meaning.

**Typography.** One variable sans font and one monospace (for codes such
as an error reference); Hindi pages add a Devanagari font, loaded only for
Hindi, since the sans font has no Devanagari letters. Hindi text gets a
little more line height than Latin text, so matras aren't clipped. Numbers
that line up (stats, points, standings, the timer) use tabular figures.
Sizes: a scale from 12 px to 30 px; body text 14 px on a phone and 16 px
from 768 px; nothing smaller than 12 px.
Text resizes to 200 % without loss (WCAG 1.4.4).

**Spacing and radius.** A 4 px spacing scale; the theme's corner radius
and the sizes derived from it; nothing hard-coded. The top bar, every page
and the footer keep one side margin, 16 px on a phone and 24 px from
768 px, so their edges line up at every width.

**Motion.** Durations of 150 ms (feedback: a press, a toggle) and 250 ms
(a panel or sheet arriving), with `ease-out` for what arrives and
`ease-in-out` for what moves. Allowed: a card
growing into its page, a pick revealed to the room, a standings row moving,
a sheet sliding up. Nothing loops or moves by itself. With
`prefers-reduced-motion: reduce`, movement becomes an instant change or a
short fade, and nothing moves across the screen (WCAG 2.3.3).

**Breakpoints.** Designed at 360 px first.

| Width     | Layout                                                                        |
| --------- | ----------------------------------------------------------------------------- |
| 360–767   | One column, top bar and bottom tabs, panels as bottom sheets                  |
| 768–1023  | Two columns where a list and its detail sit together; tabs stay at the bottom |
| 1024–1439 | The sidebar replaces the bottom tabs; up to three columns                     |
| 1440 +    | Content capped at 1,280 px wide, centred; the draft room uses the full width  |

Touch targets are at least 44 × 44 px (AGENTS.md); nothing interactive is
smaller than WCAG 2.2's 24 × 24 px. Heights use dynamic viewport units and
safe-area insets, so the bottom tabs clear a phone's home indicator.

### 2. The app shell

**Phone (to 1023 px):** a top bar and bottom tabs.

```text
┌──────────────────────────────┐
│ ◆ Coachlore        🔍  文  ◐ │  logo (home), search, language, theme
├──────────────────────────────┤
│                              │
│         page content         │
│                              │
├──────────────────────────────┤
│  Dex   Team   Leagues   Me   │  icon + label, current one marked
└──────────────────────────────┘
```

**Desktop (1024 px and up):** a sidebar and a slim top bar.

```text
┌──────────────────────────────────────────────────────────────────────┐
│ ◆ Coachlore             [ Search…                Ctrl K ]  文 हिन्दी  ◐ │
├───────────────┬──────────────────────────────────────────────────────┤
│ Dex           │                                                      │
│ Types         │                                                      │
│ Moves         │                    page content                      │
│ Team check    │                                                      │
│ ───────────── │                                                      │
│ LEAGUES       │                                                      │
│ ● Kanto Cup   │                                                      │
│ ● Friday Cup  │                                                      │
│ + New league  │                                                      │
│ ───────────── │                                                      │
│ (A) Me        │                                                      │
└───────────────┴──────────────────────────────────────────────────────┘
```

- **Ask** joins the tabs and the sidebar with spec 012; until then the
  shell has four tabs.
- **Inside a league:** on a phone, a row of scrollable tabs under the top
  bar (Home · Draft · Rosters · Schedule · Trades · Stats, and Settings for
  admins); on desktop, the league's sections in the sidebar under its name.
- **The footer** of every page carries the not-affiliated notice and the
  credits, with links to `/about` and `/legal` in the page's language
  (project doc, "What has to be true before this ships"). It starts at the
  top bar's edge and runs the page's full width. The switch to the other
  language is the top bar's button alone (the owner's call, 2026-10-21).
- **Skip link:** "Skip to content" is the first focusable element on every
  page (WCAG 2.4.1).
- **Sticky bars never hide focus** (WCAG 2.4.11, Focus Not Obscured): the
  page's `scroll-padding-top` and `scroll-padding-bottom` equal the heights
  of the sticky bars in view (the top bar, the league tabs, the draft room's
  status bar, the bottom tabs and the Draft button), so a focused element
  scrolls clear of them.
- **Landmarks:** one `header`, `nav` (labelled "Main" and, in a league,
  "League"), `main` and `footer` per page; one `h1` per page.
- **The language button** (文, Lucide's `Languages` icon) opens the same
  page in the other language with one press. Its name for screen readers
  says where it goes, with the language written in itself ("Read in
  हिन्दी" on English pages, "English में पढ़ें" on Hindi ones). From
  768 px the button also shows the language's name, written in itself
  ("हिन्दी", "English"), so it can be found by someone who can't read the
  page's language; on a phone, the icon alone. The icon
  is the common sign for a language switch, and a first visit already
  opens in the browser's language; `/me`'s setting (spec 006) does the
  same. With a third language, the button becomes a choice among them.
- **The theme button** (◐, the sun or the moon) switches between light and
  dark with one press: a toggle button named "Dark theme", pressed while
  the dark theme is on. There's no "System" choice: until the first press
  the page follows the device, and after it the choice is remembered per
  browser. A theme setting on `/me`, such as following the device again,
  can come with accounts (spec 006). Two buttons rather than a menu: each
  is one press, and opening a floating menu was slow on a phone
  (scaffold follow-ups, "Theme control's first open").
- Components: Sidebar, Tabs, Button, Tooltip, Separator, Avatar.

### 3. The search palette

Opens from the search button, and from Ctrl K or ⌘ K. The button says
"Search…" (the icon alone on a phone), short enough never to be cut off in
either language; the palette's field names what it finds ("Search Pokémon,
moves, leagues…"). It finds Pokémon, forms, moves, abilities, types and
the person's own leagues as they type, grouped by kind; Enter
opens the highlighted result. Spec 001 builds the palette with no sources;
each later spec adds its own (003: Pokémon and forms; 004: moves,
abilities, types; 007: leagues). Spec 012 adds "Ask: …" as the last row.

- **Phone:** full screen, the input at the top, results below, the
  keyboard open.
- **Desktop:** a dialog, 640 px wide, at the top third of the screen. The
  field ends with an Esc key, as the search button shows Ctrl K; Escape or
  a click outside closes it. A phone has no Esc key and nothing outside,
  so there a close button (44 px) takes its place.
- **Searching:** while a search runs, a spinner sits at the field's end, in
  the Esc key's place, on every screen; the status says "Searching…" for
  screen readers, and the key comes back when the results do.
- **No single-key shortcuts:** WCAG 2.1.4 asks for a way to turn off
  any shortcut that's a single key, and the shell has no settings to hold
  one, so every shortcut uses a modifier (Ctrl K or ⌘ K). `d` and `/` did
  something until 2026-10-21; they do nothing now.
- Accessibility: Command's combobox and listbox roles; the result count is
  announced politely; Escape closes and returns focus to what opened it.
- Components: Command, Dialog, Kbd, Badge (type badges in results),
  Spinner.

### 4. States every view has

A view isn't done until it has every state that applies to it. Each is a
shared composition in the shared interface package once it's used three
times; until
then, the registry components named.

| State          | What the person sees                                                                                                                 | Built from                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| Loading        | Skeletons the size and shape of the content, so nothing shifts when it arrives (CLS)                                                 | Skeleton                         |
| Empty          | One sentence on why it's empty, and the next action                                                                                  | `EmptyState` (built)             |
| Error          | What failed, in plain words, and "Try again", announced as an alert                                                                  | `EmptyState` with `role="alert"` |
| Not found      | "There's no … at this address", with search and a way home                                                                           | `EmptyState`                     |
| Offline        | The Dex works from what's saved; other views show the last data, marked "You're offline", and disable changes                        | Alert                            |
| No permission  | "This league is private" or "Only admins can change this", and what to do                                                            | `EmptyState`                     |
| AI unavailable | The AI feature says why ("Today's AI allowance is used", "AI is off in this league") and when it returns; the rest of the view works | Alert                            |
| Live update    | A new pick, result or trade appears in place and is announced politely, at most once per event                                       | a polite live region             |

### 5. Writing

Plain, short, specific. Buttons say what they do ("Draft Garchomp", not
"Submit"). Errors say what happened and what to do next. The words are the
glossary's: "coach", not "player"; "roster", not "team" in a league; "KO",
not "kill". Copy is checked with the `better-writing` skill.

In Hindi, the same rules hold: plain, everyday Hindi rather than formal or
Sanskritised words, in Devanagari. Each glossary term's Hindi wording is
decided once, in a short term list at the top of the Hindi dictionary,
and used everywhere; where the
community uses the English word (draft, KO, tier), the Hindi interface uses
it too, in Devanagari or Latin as the dictionary fixes it. Pokémon, form,
move and ability names are never translated.

### 6. Languages

Every page exists in English and Hindi
([ADR 0007](../../adr/0007-languages-and-right-to-left.md)).

- **Addresses:** every route is served under its language, `/en/…` and
  `/hi/…`. The routes in this spec and the others are written without the
  prefix. An address without a language goes to the person's language: the
  one they chose before (remembered in a cookie), else their browser's
  preferred language if it's English or Hindi, else English.
- **Text:** no text is written into a component. Every string comes from
  the English and Hindi dictionaries, which always have the same keys.
  Titles and descriptions come from them too.
- **Pokémon data:** names stay English in both languages (the data has no
  Hindi names), and search finds them by their English name in both.
- **Direction:** `<html>` carries the page's `lang` and `dir`. Both v1
  languages are left to right, but every screen is built with logical
  directions (start and end, never left and right), so a right-to-left
  language can be added without redesigning it. Back and next are always
  icons that flip with the direction, never arrow characters typed into
  text ("←", "‹", "→").
- **Dates and numbers** are always formatted for the page's language and
  the viewer's (or the league's) time zone, never by hand.
- **Search engines:** each page names its other-language version.
- **Text in another language:** text that isn't in the page's language
  carries its own `lang` (Pokémon names on Hindi pages, a league's
  write-up in a different language). A write-up (spec 013) whose language
  differs from the page's says so beside it: "Written in English" or
  "Written in Hindi", from the dictionary.

### 7. Pages this spec builds

`/about` (what Coachlore is, who made it, the credits), `/legal` (the
not-affiliated notice, credits and licences of the data and images, and the
privacy notice, completed by spec 014) and not found (built; restyled to
the shell) and `/offline` (the page spec 003's offline Dex serves for a
page it hasn't saved).

One page is an exception to the shell and to one language per page: an
address that matches no page gets a minimal not-found page in English and
Hindi together, with a link to each language's home page and no shell. An
address without a language is redirected to the person's first, so this
page answers what's left unmatched.

## Rules and edge cases

1. **The design can change at any time.** A change goes into this spec's
   text and wireframes first, then into the screen; the spec always
   describes what's built.
2. **Times are shown in the viewer's time zone,** with the league's beside
   it when they differ ("Fri 20:00 · league time 19:00"). A league's week
   edges, draft start and reminders use the league's time zone (spec 007).
3. **A sticky element never covers the focused element** (requirement 2).
4. **No dead controls.** A screen shows nothing from a later spec until that
   spec is built: no disabled "coming soon" buttons.
5. **Signed out, a league route is not found** (spec 007); the Dex never
   asks anyone to sign in.
6. **An address with a language we don't have** (`/fr/dex`) is not found;
   an address with no language is redirected, keeping the rest of the path
   and its query.
7. **A string missing from one dictionary** fails the build's checks rather
   than showing a key or the other language.
8. **Long Hindi words** wrap rather than overflow: labels, buttons and
   tabs are checked at 360 px in Hindi.

## Screen inventory

Every v1 route, written without its language prefix (each is served as
`/en/…` and `/hi/…`). "Sign-in" is whether a person must be signed in to
see it.

| Route                         | Screen           | Purpose                                             | Built by | Sign-in                           |
| ----------------------------- | ---------------- | --------------------------------------------------- | -------- | --------------------------------- |
| `/`                           | Home             | Search, jump back in, see a live draft              | 003      | No                                |
| `/dex`                        | Browse the Dex   | Find any Pokémon by name, number, type, game, stats | 003      | No                                |
| `/games/[game]`               | A game's Dex     | Only what's in one game, its exclusives marked      | 003      | No                                |
| `/dex/[pokemon]`              | A Pokémon        | Everything about it, its default form               | 004      | No                                |
| `/dex/[pokemon]/[form]`       | A form           | The same page for another form                      | 004      | No                                |
| `/types`                      | Type chart       | Matchups for one type or two                        | 004      | No                                |
| `/moves`                      | Moves            | Find a move                                         | 004      | No                                |
| `/moves/[move]`               | A move           | Its effect, numbers and who learns it               | 004      | No                                |
| `/abilities/[ability]`        | An ability       | Its effect and who has it                           | 004      | No                                |
| `/team-check`                 | Team check       | A team's weaknesses and coverage                    | 005      | No                                |
| `/sign-in`                    | Sign in          | Continue with Discord                               | 006      | No                                |
| `/me`                         | Me               | Profile, leagues, data, delete account              | 006      | Yes                               |
| `/leagues`                    | Leagues          | My leagues; create or join one                      | 007      | Yes                               |
| `/leagues/new`                | Create a league  | Set up a league with defaults                       | 007      | Yes                               |
| `/join/[invitation]`          | Join a league    | Accept an invitation                                | 007      | Yes                               |
| `/l/[league]`                 | League home      | This week, standings, recent activity               | 007, 009 | Yes, members                      |
| `/l/[league]/tiers`           | Tier list        | Each form's points, and bans                        | 007      | Yes, members                      |
| `/l/[league]/settings`        | League settings  | Members, rules, draft, Discord, AI                  | 007      | Yes, admins                       |
| `/l/[league]/draft`           | Draft room       | The live draft                                      | 008      | Yes, members                      |
| `/l/[league]/rosters`         | Rosters          | Every coach's roster, points used and record        | 008, 009 | Yes, members                      |
| `/l/[league]/rosters/[coach]` | A coach's roster | Roster, points and record                           | 008, 009 | Yes, members                      |
| `/l/[league]/schedule`        | Schedule         | Every week's matches                                | 009      | Yes, members                      |
| `/l/[league]/matches/[match]` | A match          | Result, replays, KOs, recap                         | 009      | Yes, members                      |
| `/l/[league]/stats`           | Stats            | Leaders and records                                 | 009      | Yes, members                      |
| `/l/[league]/trades`          | Trades           | Propose, answer and approve trades                  | 010      | Yes, members                      |
| `/ask`                        | Ask              | The assistant                                       | 012      | Yes (the allowance is per person) |
| `/about`                      | About            | What it is, credits                                 | 001      | No                                |
| `/legal`                      | Legal            | Notice, licences, privacy                           | 001, 014 | No                                |
| none                          | Not found        | A wrong address                                     | 001      | No                                |
| `/offline`                    | Offline          | A page that isn't saved, offline                    | 001, 003 | No                                |
| overlay                       | Search palette   | Find anything                                       | 001      | No                                |
| overlay                       | Filters          | The Dex's filters                                   | 003      | No                                |

## Screens

Each screen: its purpose, wireframes at 360 px and 1024 px, the registry
components it uses (each checked to exist in shadcn's registry on
2026-10-21), its states beyond loading and error (which every screen has),
and its accessibility notes. Wireframes show layout and content (arrows such as ← and › stand for
icons that flip with the direction), not
style. The shell (top bar, tabs, sidebar, footer) is left out of most of
them.

### Home `/`

Purpose: start anything in one tap: search, jump back to what you looked at,
get into a live draft.

```text
360                              1024
┌──────────────────────────────┐ ┌─────────────────────────────────────────────┐
│ Find a Pokémon               │ │ Find a Pokémon                              │
│ ┌──────────────────────────┐ │ │ ┌───────────────────────────────────────┐   │
│ │ 🔍 Name, number or type  │ │ │ │ 🔍 Name, number or type               │   │
│ └──────────────────────────┘ │ │ └───────────────────────────────────────┘   │
│ ┌──────────────────────────┐ │ │ ┌──────────────────────┐ ┌────────────────┐ │
│ │ ● DRAFT LIVE · Kanto Cup │ │ │ │ RECENTLY VIEWED      │ │ ● DRAFT LIVE   │ │
│ │ Round 4 · you're 2nd up  │ │ │ │ [card][card][card]   │ │ Kanto Cup      │ │
│ │ [ Open the draft room ]  │ │ │ │ [card][card][card]   │ │ [ Open room ]  │ │
│ └──────────────────────────┘ │ │ ├──────────────────────┤ ├────────────────┤ │
│ RECENTLY VIEWED          →   │ │ │ BROWSE               │ │ YOUR LEAGUES   │ │
│ [card] [card] [card] [ca…    │ │ │ By type · By game ·  │ │ Kanto Cup  3rd │ │
│ BROWSE                       │ │ │ Type chart · Moves   │ │ Friday Cup 1st │ │
│ [By type] [By game]          │ │ │ Team check           │ │                │ │
│ [Type chart] [Team check]    │ │ └──────────────────────┘ └────────────────┘ │
│ YOUR LEAGUES             →   │ └─────────────────────────────────────────────┘
│ Kanto Cup · 3rd · Week 5     │
└──────────────────────────────┘
```

- The search box opens the search palette. "Draft live" appears only while
  one of the person's leagues is drafting. "Recently viewed" is kept in the
  browser only.
- Signed out, the league blocks become one card: "Run a draft league with
  your friends", one line on what that is ("Friends draft Pokémon with a
  points budget, then play a season on Showdown; Coachlore keeps the
  score."), "How leagues work" (a section of `/about`) and "Sign in with
  Discord".
- The league blocks arrive with specs 007 and 008; until then, home shows
  the Dex blocks only.
- Components: Input Group, Card, Item, Button, Badge, Scroll Area.
- States: nothing viewed yet (the block is hidden); signed out.
- Accessibility: the recently viewed row scrolls by swipe and by Tab; the
  live badge says "Draft live", not only a dot.

### Browse the Dex `/dex`

Purpose: find any Pokémon by name, number, type, weakness, resistance,
game, generation, ability or stats.

```text
360                              1024
┌──────────────────────────────┐ ┌─────────────────────────────────────────────┐
│ Dex                  ▦  ☰    │ │ Dex                              ▦  ☰       │
│ ┌──────────────────────────┐ │ │ ┌──────────────┐ ┌─────────────────────────┐ │
│ │ 🔍 Filter by name or #   │ │ │ │ FILTERS      │ │ 🔍 Filter by name or #  │ │
│ └──────────────────────────┘ │ │ │ Type      ▾  │ └─────────────────────────┘ │
│ [Steel ×] [Speed ≥ 90 ×]     │ │ │ Weak to   ▾  │ [Steel ×] [Speed ≥ 90 ×]    │
│ [+ Filter]                   │ │ │ Game      ▾  │ 12 Pokémon · Sort: Number ▾ │
│ 12 Pokémon · Sort: Number ▾  │ │ │ Generation▾  │ ┌────┐┌────┐┌────┐┌────┐┌───│
│ ┌────────┐┌────────┐┌───────┐│ │ │ Ability   ▾  │ │art ││art ││art ││art ││art│
│ │ sprite ││ sprite ││ sprite││ │ │ Stats     ▾  │ │#082││#205││#208││#227││#30│
│ │ #0082  ││ #0205  ││ #0208 ││ │ │ Forms     ▾  │ │Magn││Forr││Stee││Skar││Ag…│
│ │Magneton││Forretr…││Steelix││ │ │ [Clear all]  │ │ELEC││BUG ││STEE││STEE││ST…│
│ │[ELE][ST]││[BUG][S]││[STEEL]││ │ └──────────────┘ └────┘└────┘└────┘└────┘└───│
│ └────────┘└────────┘└───────┘│ └─────────────────────────────────────────────┘
└──────────────────────────────┘
```

- The filters live in the address (`/dex?type=steel&speed=90-`), so any
  view can be shared and Back works. On a phone, "+ Filter" opens the
  filters as a bottom sheet; on desktop they're a panel on the left. The
  groups: type, weak to, resists, game, generation, ability, stats, and
  forms (default, all, regional, Mega, Gigantamax, other).
- Grid (three columns on a phone, up to eight on desktop) or list (a table
  with the stats, sortable). The grid renders only what's on screen.
- Spec 012 adds plain-language search to the box: the filters it chose
  appear as the same removable chips.
- Components: Input Group, Badge, Button, Toggle Group (grid or list),
  Select, Sheet (filters on a phone), Accordion (filter groups), Checkbox,
  Slider (stat ranges), Card, Table, Skeleton.
- States: no match ("No Pokémon match these filters", and "Clear filters").
- Accessibility: the count is announced when the filters change; each card
  is one link named "#0208 Steelix, Steel and Ground"; sliders have
  number inputs beside them.

### A game's Dex `/games/[game]`

Purpose: the Pokémon in one game, with that game's numbers and its
version exclusives.

```text
360                              1024
┌──────────────────────────────┐ ┌─────────────────────────────────────────────┐
│ ← Games                      │ │ Scarlet and Violet            Game: [ ▾ ]   │
│ Scarlet and Violet     [▾]   │ │ 400 Pokémon · Versions: (All) (Scarlet)     │
│ (All) (Scarlet) (Violet)     │ │ (Violet)                                    │
│ 400 Pokémon                  │ │ ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐        │
│ ┌────────┐┌────────┐┌───────┐│ │ │#001││#002││#003││#004││#005││#006│        │
│ │ #001   ││ #002   ││ #003  ││ │ │Spri││Flor││Mews││Fuec││Croc││Skel│        │
│ │Sprigat…││Floragato││Meowsc…││ │ │GRAS││GRAS││GRAS││FIRE││FIRE││FIRE│        │
│ │[GRASS] ││[GRASS] ││[GRASS]││ │ └────┘└────┘└────┘└────┘└────┘└────┘        │
│ └────────┘└────────┘└───────┘│ │ [Only in Scarlet] on exclusives             │
└──────────────────────────────┘ └─────────────────────────────────────────────┘
```

- The same grid and filters as `/dex`, limited to the game, numbered by
  its regional Dex. Exclusives carry an "Only in Scarlet" badge.
- Components: Select, Toggle Group, Card, Badge, Skeleton.
- States: a game whose data is incomplete says so above the grid ("Data for
  this game is still being added").
- Accessibility: the version filter is a radio group.

### A Pokémon `/dex/[pokemon]`, a form `/dex/[pokemon]/[form]`

Purpose: everything about one Pokémon, in the order players look for it.

```text
360                              1024
┌──────────────────────────────┐ ┌─────────────────────────────────────────────┐
│ ← Dex          #0479   ‹  ›  │ │ ← Dex                     #0479      ‹   ›  │
│ ╭──────────────────────────╮ │ │ ╭─────────────────╮ About                   │
│ │        artwork           │ │ │ │                 │ Electric Plasma Pokémon │
│ ╰──────────────────────────╯ │ │ │    artwork      │ Abilities: Levitate     │
│ Rotom                        │ │ │                 │ ─────────────────────── │
│ [ELECTRIC] [WATER]           │ │ ╰─────────────────╯ Stats                   │
│ Form: (Rotom) (Wash) (Heat)… │ │ Rotom-Wash          HP      50 ████░░       │
│ About Stats Matchups Evol… → │ │ [ELECTRIC][WATER]   Attack  65 █████░       │
│ ──────────────────────────── │ │ Form: [Wash ▾]      …                       │
│ HP       50 ████░░░░░░       │ │ On this page:       Total  520              │
│ Attack   65 █████░░░░░       │ │  About · Stats ·    ─────────────────────── │
│ Defense 107 ████████░░       │ │  Matchups ·         Matchups                │
│ Sp. Atk 105 ████████░░       │ │  Evolution ·        Takes ×2 from: Grass,   │
│ Sp. Def 107 ████████░░       │ │  Moves · Where ·    Electric …              │
│ Speed    86 ███████░░░       │ │  Competitive        ─────────────────────── │
│ Total   520                  │ │                     Evolution · Moves · …   │
└──────────────────────────────┘ └─────────────────────────────────────────────┘
```

- Sections: About (category, height, weight, abilities with the hidden one
  marked, Pokédex entries by game, names in other languages), Stats (base
  stats and total), Matchups (damage taken from each type, grouped ×4, ×2,
  ½, ¼, ×0), Evolution (each step a link, with its method), Moves (by game,
  then by method; sortable), Where (where to find it in each game and
  version), Competitive (usage, common moves, items and partners, from the
  monthly usage statistics, when there are any).
- On a phone the sections are tabs; on desktop they're one scroll with a
  section menu, and the artwork and key facts stay in view.
- The form switcher changes the address to the form's own page. ‹ › go to
  the previous and next number; on a phone, a swipe does too.
- The page's accent is its first type's colour.
- Components: Tabs, Badge, Toggle Group (form switcher), Select (form, on
  desktop), Progress (stat bars), Table, Card, Item, Breadcrumb,
  Separator, Skeleton, Aspect Ratio (artwork, fixed size).
- States: a form or game with missing data says what's missing; a Pokémon
  with no usage statistics hides Competitive with a line saying why.
- Accessibility: each stat bar's value is in text beside it; the matchups
  are grouped lists with headings, not a colour grid; the swipe has the
  ‹ › buttons as its alternative (WCAG 2.5.1).

### Type chart `/types`

Purpose: what's strong against what, for one type or two.

```text
360                              1024
┌──────────────────────────────┐ ┌─────────────────────────────────────────────┐
│ Type chart                   │ │ Type chart                                  │
│ Defending: pick one or two   │ │ ┌──────────────────────────┐ ┌────────────┐ │
│ [NOR][FIR][WAT][ELE][GRA]…   │ │ │     NOR FIR WAT ELE GRA … │ │ DEFENDING  │ │
│ Steel + Fairy                │ │ │ NOR  1   1   1   1   1    │ │ [STE][FAI] │ │
│ ┌──────────────────────────┐ │ │ │ FIR  1  ½   ½   1   2     │ │ ×4 Fire?   │ │
│ │ ×2 from  Fire · Ground   │ │ │ │ WAT  1   2  ½   1  ½      │ │ ×2 Fire,   │ │
│ │ ½ from   Normal · Grass… │ │ │ │ ELE  1   1   2  ½  ½      │ │    Ground  │ │
│ │ ×0 from  Poison · Dragon │ │ │ │ …                         │ │ ½ Normal…  │ │
│ └──────────────────────────┘ │ │ └──────────────────────────┘ │ ×0 Poison, │ │
│ [ See the full chart ]       │ │                              │    Dragon  │ │
└──────────────────────────────┘ └─────────────────────────────────────────────┘
```

- On a phone, the full 18 × 18 chart is a separate view that scrolls both
  ways with its first row and column pinned.
- Instant: arithmetic over data already loaded.
- Components: Toggle Group (type picker, up to two), Badge, Card, Table,
  Scroll Area.
- Accessibility: the chart is a table with row and column headers
  ("Attacking", "Defending"); each cell's text says "×2", "½", "×0" or
  "×1", never colour alone.

### Moves `/moves`, a move `/moves/[move]`

Purpose: find a move; see what it does and who learns it.

```text
360 (list)                       1024 (a move)
┌──────────────────────────────┐ ┌─────────────────────────────────────────────┐
│ Moves                        │ │ ← Moves                                     │
│ 🔍 Filter by name            │ │ Thunderbolt   [ELECTRIC]  Special           │
│ [Type ▾] [Category ▾]        │ │ Power 90 · Accuracy 100 · PP 15             │
│ ┌──────────────────────────┐ │ │ A strong electric blast. May paralyse the   │
│ │ Thunderbolt   [ELECTRIC] │ │ │ target (10 %).                              │
│ │ Special · 90 · 100 %     │ │ │ ─────────────────────────────────────────── │
│ ├──────────────────────────┤ │ │ LEARNED BY (172)  Game: [Scarlet/Violet ▾]  │
│ │ Thunder Wave  [ELECTRIC] │ │ │ [card][card][card][card][card][card]        │
│ │ Status · — · 90 %        │ │ │ [card][card][card][card][card][card]        │
│ └──────────────────────────┘ │ └─────────────────────────────────────────────┘
└──────────────────────────────┘
```

- The list is a sortable table on desktop (name, type, category, power,
  accuracy, PP) and a list of rows on a phone.
- Components: Input Group, Select, Table, Item, Badge, Card, Pagination
  (if the list isn't virtualised), Skeleton.
- States: no match; a move not in the chosen game.
- Accessibility: sortable column headers say their sort state
  (`aria-sort`); "—" for no power is read as "no power".

### An ability `/abilities/[ability]`

Purpose: what an ability does and who has it.

```text
360                              1024
┌──────────────────────────────┐ ┌─────────────────────────────────────────────┐
│ ← Back                       │ │ ← Back                                      │
│ Levitate                     │ │ Levitate                                    │
│ Gives full immunity to       │ │ Gives full immunity to Ground-type moves.   │
│ Ground-type moves.           │ │ ─────────────────────────────────────────── │
│ HAS IT (48)                  │ │ HAS IT (48)        AS A HIDDEN ABILITY (3)  │
│ [card][card][card]           │ │ [card][card][card][card] [card][card][card] │
│ AS A HIDDEN ABILITY (3)      │ │                                             │
│ [card][card][card]           │ │                                             │
└──────────────────────────────┘ └─────────────────────────────────────────────┘
```

- Components: Card, Badge, Separator, Skeleton.
- Accessibility: the two groups are headed lists.

### Team check `/team-check`

Purpose: put six forms together and see at a glance what the team is weak
to and what it can't hit.

```text
360                              1024
┌──────────────────────────────┐ ┌─────────────────────────────────────────────┐
│ Team check     Import  Share │ │ Team check                 Import    Share  │
│ ┌──────┐┌──────┐┌──────┐     │ │ [Garchomp][Rotom-W][Corviknight][ + ][ + ][+]│
│ │Garch.││Rotom ││  +   │     │ │ ┌───────────────────────┐ ┌───────────────┐ │
│ └──────┘└──────┘└──────┘     │ │ │ WEAK TO     G  R  C   │ │ COVERAGE      │ │
│ ┌──────┐┌──────┐┌──────┐     │ │ │ Ice  ⚠ 2   ×4 ·  ·    │ │ Hits 14 of 18 │ │
│ │Corvi.││  +   ││  +   │     │ │ │ Fairy  1   ×2 ·  ·    │ │ super-        │ │
│ └──────┘└──────┘└──────┘     │ │ │ Grass  1   ·  ×2 ·    │ │ effectively   │ │
│ WEAK TO                      │ │ │ Fire   1   ·  ·  ×2   │ │ Not: Steel,   │ │
│ Ice    2 of 3  ⚠ uncovered   │ │ │ …                     │ │ Water, Fire,  │ │
│ Fairy  1 of 3                │ │ └───────────────────────┘ │ Dragon        │ │
│ COVERAGE                     │ │                           └───────────────┘ │
│ Hits 14 of 18 types          │ └─────────────────────────────────────────────┘
│ Not: Steel, Water, Fire, Dr… │
└──────────────────────────────┘
```

- The team lives in the address, so "Share" copies a link; "Import" takes
  Showdown's team text. Coverage uses the moves entered, or each form's
  types if none are.
- Instant: arithmetic in the browser, no request.
- Spec 012 adds "Explain my team".
- Components: Card, Button, Command in a Dialog (adding a form), Table,
  Badge, Textarea (import), Sonner ("Link copied"), Tooltip.
- States: an empty team ("Add a Pokémon to start"); a pasted team with
  names we don't know lists them.
- Accessibility: the weakness matrix is a table with headers; "uncovered"
  is a word, with the warning colour beside it.

### Sign in `/sign-in`

Purpose: sign in with Discord, saying what that gives access to and what
we keep.

```text
360                              1024
┌──────────────────────────────┐ ┌─────────────────────────────────────────────┐
│ Sign in                      │ │            ┌─────────────────────────┐      │
│ Leagues use your Discord     │ │            │ Sign in                 │      │
│ account. We keep your        │ │            │ Leagues use your Discord│      │
│ Discord ID, name and avatar, │ │            │ account. We keep your … │      │
│ nothing else.                │ │            │ [ Continue with Discord]│      │
│ [ Continue with Discord ]    │ │            │ The Dex needs no account│      │
│ The Dex needs no account.    │ │            └─────────────────────────┘      │
└──────────────────────────────┘ └─────────────────────────────────────────────┘
```

- Components: Card, Button.
- States: sign-in cancelled or failed ("Sign-in didn't finish. Try again.").

### Me `/me`

Purpose: who you're signed in as, your leagues, what we hold, and how to
delete it.

```text
360                              1024
┌──────────────────────────────┐ ┌─────────────────────────────────────────────┐
│ (A) Ash                      │ │ (A) Ash · signed in with Discord   Sign out │
│ Signed in with Discord       │ │ ┌───────────────────────┐ ┌───────────────┐ │
│ YOUR LEAGUES                 │ │ │ YOUR LEAGUES          │ │ YOUR DATA     │ │
│ Kanto Cup · coach            │ │ │ Kanto Cup   coach     │ │ What we hold  │ │
│ Friday Cup · admin           │ │ │ Friday Cup  admin     │ │ [ Download ]  │ │
│ YOUR DATA                    │ │ └───────────────────────┘ │ [ Delete my   │ │
│ What we hold · [ Download ]  │ │                           │   account ]   │ │
│ [ Delete my account ]        │ │                           └───────────────┘ │
│ [ Sign out ]                 │ └─────────────────────────────────────────────┘
└──────────────────────────────┘
```

- Spec 012 adds today's AI allowance.
- Deleting asks for confirmation and says what's removed and what stays
  (project doc, "Privacy"); an admin who is a league's only admin is asked
  to hand it over first.
- Components: Avatar, Card, Item, Button, Alert Dialog.
- Accessibility: the confirmation's destructive button names the action
  ("Delete my account"), and focus starts on "Cancel".

### Leagues `/leagues`

Purpose: your leagues, and the way to make or join one.

```text
360                              1024
┌──────────────────────────────┐ ┌─────────────────────────────────────────────┐
│ Leagues        [ + New ]     │ │ Leagues                        [ + New ]    │
│ ┌──────────────────────────┐ │ │ ┌────────────────┐┌────────────────┐        │
│ │ KC Kanto Cup             │ │ │ │ KC Kanto Cup   ││ FC Friday Cup  │        │
│ │ Coach · 3rd · Week 5     │ │ │ │ Coach · 3rd    ││ Admin · drafting│       │
│ │ [Draft live]             │ │ │ │ Week 5         ││ [Draft live]   │        │
│ └──────────────────────────┘ │ │ └────────────────┘└────────────────┘        │
│ Got an invitation link?      │ │ Got an invitation link? Open it to join.    │
│ Open it to join.             │ │                                             │
└──────────────────────────────┘ └─────────────────────────────────────────────┘
```

- Components: Card, Avatar (league initials on its colour), Badge, Button.
- States: no leagues ("No leagues yet. Create one, or open an invitation
  link from a friend.").

### Create a league `/leagues/new`

Purpose: set up a league with sensible defaults, in steps.

```text
360                              1024
┌──────────────────────────────┐ ┌─────────────────────────────────────────────┐
│ ← New league       Step 2/4  │ │ New league                                  │
│ ━━━━━━━━━━━━░░░░░░░░░░░░░░░  │ │ ┌───────────┐ ┌───────────────────────────┐ │
│ Draft                        │ │ │ 1 Basics ✓│ │ Draft                     │ │
│ Order  (Snake) (Linear)      │ │ │ 2 Draft  ●│ │ Order  (Snake) (Linear)   │ │
│ Budget  [ 110 ] points       │ │ │ 3 Season  │ │ Budget [ 110 ] points     │ │
│ Roster  [ 10 ] forms         │ │ │ 4 Review  │ │ Roster [ 10 ] forms       │ │
│ Timer   [ 2 min ▾]           │ │ └───────────┘ │ Timer  [ 2 min ▾]         │ │
│ Tier list [ From template ▾] │ │               │ Tier list [From template ▾]│ │
│ [ Back ]          [ Next ]   │ │               │ [ Back ]        [ Next ]  │ │
└──────────────────────────────┘ └─────────────────────────────────────────────┘
```

- Steps: Basics (name, colour, format), Draft (order, budget, roster size,
  timer, tier list template), Season (number of weeks, battles per match,
  trades on or off, admin approval), Review. Every field has a default and
  stays editable later in settings.
- Components: Field, Input, Radio Group, Select, Switch, Progress, Button,
  Card.
- States: a field that fails validation says why, next to it.
- Accessibility: each step's heading is focused when it opens; errors are
  linked to their fields (`aria-describedby`).

### Join a league `/join/[invitation]`

Purpose: accept an invitation.

```text
360                              1024
┌──────────────────────────────┐ ┌─────────────────────────────────────────────┐
│ KC Kanto Cup                 │ │          KC Kanto Cup                       │
│ Brock invited you to join as │ │          Brock invited you to join as a     │
│ a coach.                     │ │          coach.                             │
│ Showdown username            │ │          Showdown username [ ash-k      ]   │
│ [ ash-k                    ] │ │          So your replays can be matched to  │
│ So your replays can be       │ │          you. You can change it later.      │
│ matched to you.              │ │          [ Join Kanto Cup ]                 │
│ [ Join Kanto Cup ]           │ │                                             │
└──────────────────────────────┘ └─────────────────────────────────────────────┘
```

- Signed out, "Join" signs in first and comes back here.
- A coach invitation asks for the Showdown username, saying why; it can be
  left empty and changed later (spec 007). A viewer invitation doesn't ask.
- Components: Card, Avatar, Field, Input, Button.
- States: the invitation expired, was withdrawn or has been used as many
  times as it allows; already a member (a link to the league).

### League home `/l/[league]`

Purpose: what's happening in the league this week.

```text
360                              1024
┌──────────────────────────────┐ ┌─────────────────────────────────────────────┐
│ ← Kanto Cup              ⋯   │ │ Kanto Cup                                   │
│ Home Draft Rosters Sched… …  │ │ ┌───────────────────────┐ ┌───────────────┐ │
│ ┌──────────────────────────┐ │ │ │ WEEK 5 OF 9           │ │ STANDINGS     │ │
│ │ WEEK 5 OF 9              │ │ │ │ You vs Misty          │ │ 1 Brock 4-0+12│ │
│ │ You vs Misty             │ │ │ │ [ Report a result ]   │ │ 2 You   3-1 +7│ │
│ │ [ Report a result ]      │ │ │ ├───────────────────────┤ │ 3 Misty 3-1 +5│ │
│ └──────────────────────────┘ │ │ │ RECENT                │ │ 4 Gary  2-2 +1│ │
│ STANDINGS            Full →  │ │ │ Gary traded Rotom-W … │ │ Full →        │ │
│ 1  Brock    4-0   +12        │ │ │ Misty beat Erika 4-0  │ └───────────────┘ │
│ 2  You      3-1    +7        │ │ └───────────────────────┘                   │
│ 3  Misty    3-1    +5        │ └─────────────────────────────────────────────┘
│ RECENT                       │
│ • Gary traded Rotom-W for …  │
└──────────────────────────────┘
```

- Before the draft: the draft's scheduled start with a countdown (if one is
  set), the members, and a link to the tier list instead of standings.
  Admins also see which coaches haven't given a Showdown username.
- Recent includes "{name} joined" when someone joins by an invitation.
- A finished season shows its final standings, read-only, marked "Season
  1 · finished"; room is left for "Start season 2", which isn't in v1.
- Spec 013 adds the weekly digest.
- Components: Card, Table, Item, Badge, Button, Tabs (league navigation).
- States: no matches yet; no permission (not a member).
- Accessibility: the standings are a table with a caption; the person's own
  row is marked in text ("You").

### Tier list `/l/[league]/tiers`

Purpose: each form's points in this league, and what's banned.

```text
360                              1024 (admin)
┌──────────────────────────────┐ ┌─────────────────────────────────────────────┐
│ Tier list   🔍  [Type ▾]     │ │ Tier list    🔍 search  [Type ▾]  [ Edit ]  │
│ ▾ S · 18 points (6)          │ │ S · 18  [Garchomp][Kingambit][Gholdengo]…   │
│ [Garchomp] [Kingambit] …     │ │ A · 16  [Rotom-W][Corviknight][Dragapult]…  │
│ ▾ A · 16 points (9)          │ │ B · 13  […]                                 │
│ [Rotom-W] [Corviknight] …    │ │ Banned  [Koraidon][Miraidon]…               │
│ ▸ B · 13 points (14)         │ │ (editing: select forms, then "Move to tier")│
│ ▸ Banned (12)                │ │                                             │
└──────────────────────────────┘ └─────────────────────────────────────────────┘
```

- Admins edit by selecting forms and choosing "Move to tier…", which works
  the same by keyboard and touch; dragging may come later. A league starts
  from a template and adjusts it. Drafted forms show their coach.
- Components: Accordion, Badge, Card, Input Group, Select, Button,
  Checkbox, Dropdown Menu ("Move to tier"), Sonner.
- States: no tier list yet (admins: "Start from a template"); locked once
  the draft starts.
- Accessibility: each tier is a heading with its points; selection state is
  announced.

### League settings `/l/[league]/settings`

Purpose: for admins: members and roles, rules, draft, trades, Discord, AI.

```text
360                              1024
┌──────────────────────────────┐ ┌─────────────────────────────────────────────┐
│ ← Settings                   │ │ Settings                                    │
│ [General ▾]                  │ │ ┌───────────┐ ┌───────────────────────────┐ │
│ MEMBERS                      │ │ │ General   │ │ MEMBERS                   │ │
│ Brock     admin   ⋯          │ │ │ Members  ●│ │ Brock   admin    ⋯        │ │
│ Ash       coach   ⋯          │ │ │ Draft     │ │ Ash     coach    ⋯        │ │
│ [ Copy invitation link ]     │ │ │ Season    │ │ [ Copy invitation link ]  │ │
│ DANGER ZONE                  │ │ │ Discord   │ │                           │ │
│ [ Delete league ]            │ │ │ AI        │ │                           │ │
└──────────────────────────────┘ └─────────────────────────────────────────────┘
```

- Sections: General (name, colour, time zone), Members (coach or viewer,
  admin or not, how each joined, Showdown usernames, invitation links with
  their expiry and uses, replace a coach, remove), Draft (locked once it
  starts), Season (including the formats replays may use), Discord
  (spec 011: linked or not, a test post, and the last failed post), AI
  (spec 013: all AI on or off, suggestions on or off, recaps and digest on
  or off), and deleting the league.
- Components: Sidebar or Select (section menu), Item, Dropdown Menu, Field,
  Switch, Button, Alert Dialog.
- States: no permission for non-admins.

### Draft room `/l/[league]/draft`

Purpose: the live draft: whose turn it is, the time left, what's
available, and every pick seen by everyone at once.

```text
360                              1024
┌──────────────────────────────┐ ┌────────────────┬───────────────────────────┬────────────────┐
│ ← Kanto Cup draft   ● Live   │ │ BOARD          │ POOL  🔍  [Tier ▾][Type ▾]│ YOUR ROSTER    │
│ ┌──────────────────────────┐ │ │    R1  R2  R3  │ ┌─────┐┌─────┐┌─────┐┌───│ 48 points left │
│ │ Round 3 · pick 21 of 80  │ │ │ Brock ■  ■  ■  │ │Garch││King ││Ghol ││Dra│ Tyranitar  16  │
│ │ 0:47 · Misty is picking  │ │ │ You   ■  ■  ·  │ │18pts││17pts││17pts││16p│ Rotom-Wash 14  │
│ │ You: in 2 picks · 48 pts │ │ │ Misty ■  ■  ◔  │ │ ☆   ││ ☆   ││ ☆   ││ ☆ │ —              │
│ └──────────────────────────┘ │ │ Gary  ■  ■  ·  │ └─────┘└─────┘└─────┘└───│ ────────────── │
│ Board     Pool     Roster    │ │ …              │ …                         │ WISHLIST       │
│ ──────────────────────────── │ │                │                           │ 1 Garchomp     │
│ POOL  🔍 [Tier ▾] [Type ▾]   │ │ 0:47           │ [ Draft Garchomp ]        │ 2 Kingambit    │
│ Garchomp     18 pts   ☆      │ │ Misty is       │ (enabled on your turn)    │ ↑↓ to reorder  │
│ [DRAGON][GROUND]             │ │ picking        │                           │                │
│ Kingambit    17 pts   ☆      │ └────────────────┴───────────────────────────┴────────────────┘
│ [ Draft Garchomp ]           │
└──────────────────────────────┘
```

- The status bar stays in view: round and pick, the timer, whose turn it
  is, and the person's own turn and points left. On desktop, the room is
  three columns.
- **On a phone,** the room is three tabs (Board, Pool, Roster); the app's
  bottom tabs are hidden in the room, the status bar collapses to one line
  as the page scrolls, and the Draft button sits at the bottom, within
  thumb reach.
- **Picking:** the "Draft …" button is enabled only on the person's turn,
  for a form they can afford. The server decides; the room shows a pick
  only after the server stores it.
- **The pick reveal:** each pick shows its form and coach to the whole room
  for a moment, then joins the board; with reduced motion it appears in
  place.
- **Reconnecting:** if the connection drops, a banner says "Reconnecting…"
  and changes are disabled; when it's back, the room loads the server's
  state and says what changed.
- **Wishlist:** private, ordered, used by auto-pick. A star on a pool row
  adds a form; a "Wishlist" filter in Pool shows only those; the Roster
  tab (the right column on desktop) lists it in order, reordered with
  buttons as well as by dragging.
- Spec 013 adds suggestions, seen only by the coach whose turn it is.
- **Draft complete:** every roster with points used, and a link to the
  season.
- Components: Card, Badge, Button, Tabs, Table (board), Input Group,
  Select, Toggle (wishlist star), Item, Progress (timer), Alert
  (reconnecting), Sonner, Scroll Area, Skeleton.
- States: before the draft (the scheduled start, if set, with a countdown;
  the order; and "the room opens when an admin starts the draft"); paused by an admin; viewer
  (watches, can't pick); offline (Alert, picking disabled).
- Accessibility: the timer is announced politely at 30 and 10 seconds and
  when the turn changes, never every second; each pick is announced once
  ("Misty drafted Kingambit, 17 points"); the board is a table with coach
  and round headers; every action works by keyboard.

### Rosters `/l/[league]/rosters`

Purpose: every coach's roster at a glance.

```text
360                              1024
┌──────────────────────────────┐ ┌─────────────────────────────────────────────┐
│ Rosters                      │ │ Rosters                                     │
│ Ash      3-1  62/110 pts  →  │ │ Coach    Record  Points used  Forms         │
│ Brock    4-0  98/110 pts  →  │ │ Ash      3-1     62 of 110    10   →        │
│ Misty    3-1  85/110 pts  →  │ │ Brock    4-0     98 of 110    10   →        │
│ …                            │ │ …                                           │
└──────────────────────────────┘ └─────────────────────────────────────────────┘
```

- Components: Table, Item, Avatar.
- States: before the draft (empty: "Rosters fill during the draft").
- Accessibility: a table with a caption; each coach's row links to their
  roster.

### A coach's roster `/l/[league]/rosters/[coach]`

Purpose: one coach's roster, points and record.

```text
360                              1024
┌──────────────────────────────┐ ┌─────────────────────────────────────────────┐
│ ← Rosters                    │ │ Ash · 3-1 · +7 · 62 of 110 points used      │
│ Ash  3-1  +7                 │ │ ┌───────────────────────┐ ┌───────────────┐ │
│ 62 of 110 points used        │ │ │ ROSTER   pts  KO  Fnt │ │ WEAK TO       │ │
│ ROSTER                       │ │ │ Tyranitar 16   5   2  │ │ Fighting 3    │ │
│ Tyranitar  16 pts  5 KO 2 F  │ │ │ Rotom-W   14   3   1  │ │ Ground   2    │ │
│ Rotom-Wash 14 pts  3 KO 1 F  │ │ │ …                     │ │ COVERAGE      │ │
│ …                            │ │ └───────────────────────┘ │ 15 of 18      │ │
│ WEAK TO · COVERAGE           │ │                           └───────────────┘ │
└──────────────────────────────┘ └─────────────────────────────────────────────┘
```

- Weaknesses and coverage reuse the team check's arithmetic. "Open in team
  check" opens `/team-check?team=…` with this roster (spec 005), where
  spec 012's explanation is.
- Components: Card, Table, Item, Badge, Avatar.
- Accessibility: "KO" and "Fnt" are abbreviations with full names
  (`abbr`, and the column headers' accessible names).

### Schedule `/l/[league]/schedule`

Purpose: every week's matches and their status.

```text
360                              1024
┌──────────────────────────────┐ ┌─────────────────────────────────────────────┐
│ Schedule                     │ │ Schedule                                    │
│ ◀  Week 5 of 9  ▶            │ │ Week 4 ✓      Week 5          Week 6        │
│ ┌──────────────────────────┐ │ │ Ash 2-1 Misty  Ash – Misty     Ash – Gary   │
│ │ You  vs  Misty           │ │ │ ✓ confirmed    upcoming        upcoming     │
│ │ Upcoming [Report result] │ │ │ Brock 2-0 Gary Brock – Erika   …            │
│ ├──────────────────────────┤ │ │ ✓ confirmed    reported: waiting            │
│ │ Brock 2 – 0 Gary         │ │ │                                             │
│ │ ✓ Confirmed              │ │ │                                             │
│ └──────────────────────────┘ │ └─────────────────────────────────────────────┘
└──────────────────────────────┘
```

- A match's status is a word as well as an icon: upcoming, reported
  (waiting for the other coach), confirmed, disputed.
- Components: Button, Card, Item, Badge, Table, Pagination (weeks).
- States: no schedule yet (before the draft ends).

### A match `/l/[league]/matches/[match]`

Purpose: a match's result, its replays, the KOs, and how it was confirmed.

```text
360                              1024
┌──────────────────────────────┐ ┌─────────────────────────────────────────────┐
│ ← Week 5                     │ │ Week 5                                      │
│   Ash   2 – 1   Misty        │ │        Ash   2 – 1   Misty                  │
│ ✓ Confirmed by both          │ │        ✓ Confirmed by both                  │
│ BATTLE 1 · Ash won 4–0       │ │ ┌───────────────────────┐ ┌───────────────┐ │
│ [ Watch on Showdown ↗ ]      │ │ │ BATTLE 1 · Ash 4–0    │ │ KOs           │ │
│ KOs                          │ │ │ BATTLE 2 · Misty 2–0  │ │ Garchomp 3 KO │ │
│ Garchomp    3 KO  0 fainted  │ │ │ BATTLE 3 · Ash 1–0    │ │ Rotom-W  1 KO │ │
│ Rotom-Wash  1 KO  1 fainted  │ │ │ [Watch each ↗]        │ │ …             │ │
└──────────────────────────────┘ └─────────────────────────────────────────────┘
```

- **Reporting:** a coach pastes the replay links; the server reads each
  battle log and fills in the score and KOs; the other coach confirms or
  disputes; an admin settles a dispute. A result typed by hand is allowed
  and marked "Entered by hand".
- Spec 013 adds the recap, labelled as written by AI from the battle logs.
- Components: Card, Table, Badge, Button, Field, Input (replay links),
  Alert, Alert Dialog (dispute).
- States: not played yet; reported, waiting; disputed; a replay we can't
  read (says why, and offers entering by hand).
- Accessibility: the score is text ("Ash 2, Misty 1"); external links say
  they open Showdown.

### Trades `/l/[league]/trades`

Purpose: propose, answer and approve trades.

```text
360                              1024
┌──────────────────────────────┐ ┌─────────────────────────────────────────────┐
│ Trades           [ + New ]   │ │ Trades                         [ + New ]    │
│ ┌──────────────────────────┐ │ │ ┌──────────────────┐ ┌────────────────────┐ │
│ │ Gary → You               │ │ │ │ YOU GIVE         │ │ YOU GET            │ │
│ │ Rotom-W for Corviknight  │ │ │ │ [Corviknight 15] │ │ [Rotom-Wash  14]   │ │
│ │ Points: you +1 (61/110)  │ │ │ │                  │ │                    │ │
│ │ [Decline] [Accept]       │ │ │ └──────────────────┘ └────────────────────┘ │
│ └──────────────────────────┘ │ │ After: you 61/110 · Gary 104/110  ✓ allowed │
│ HISTORY                      │ │ [ Send offer ]                              │
└──────────────────────────────┘ └─────────────────────────────────────────────┘
```

- States of a trade: offered → accepted or declined → approved by an admin
  (if the league asks) → done; or withdrawn. The points check is shown
  before sending and enforced by the server.
- Spec 013 adds the AI's explanation of how the trade changes both rosters.
- Components: Card, Item, Badge, Button, Command in a Dialog (choose forms),
  Alert (not allowed: why), Alert Dialog.
- States: no trades; trades off in this league.

### Stats `/l/[league]/stats`

Purpose: the league's leaders and records.

```text
360                              1024
┌──────────────────────────────┐ ┌─────────────────────────────────────────────┐
│ Stats    [ KO leaders ▾ ]    │ │ Stats                                       │
│ 1 Garchomp (Ash)    11 KO    │ │ KO LEADERS          MOST DRAFTED   RECORDS  │
│ 2 Kingambit (Brock)  9 KO    │ │ 1 Garchomp  11      …              …        │
│ 3 Dragapult (Misty)  8 KO    │ │ 2 Kingambit  9                              │
└──────────────────────────────┘ └─────────────────────────────────────────────┘
```

- Components: Select, Table, Card, Badge.
- States: no results yet.

### Ask `/ask` (spec 012)

Purpose: ask a question; see what the assistant looked up, then its answer.

```text
360                              1024
┌──────────────────────────────┐ ┌─────────────────────────────────────────────┐
│ Ask                   New    │ │ Ask                                   New   │
│        What beats Garchomp?  │ │                        What beats Garchomp? │
│ ✓ Looked up Garchomp         │ │ ✓ Looked up Garchomp                        │
│ ✓ Checked its matchups       │ │ ✓ Checked its matchups · Found 8 Ice types  │
│ Garchomp takes ×4 from Ice.  │ │ Garchomp takes ×4 from Ice. Good answers:   │
│ [Weavile] [Mamoswine] …      │ │ [Weavile] [Mamoswine] [Baxcalibur] …        │
│ Written by AI from the Dex · │ │ Written by AI from the Dex · 16 of 20 today │
│ 16 of 20 left today          │ │ ┌─────────────────────────────────────────┐ │
│ [ Ask a follow-up…      ➤ ]  │ │ │ Ask a follow-up…                    ➤   │ │
└──────────────────────────────┘ └─────────────────────────────────────────────┘
```

- An answer appears only after its lookups, and only if it passes the
  grounding check.
- Components: Message, Message Scroller, Trace (the lookups), Marker,
  Textarea or Input Group, Button, Badge, Alert (allowance used).
- States: allowance used; AI unavailable; an answer that failed the
  grounding check ("I couldn't answer that from the data").
- Accessibility: new answers are announced politely when complete, not
  while they stream; the input stays above the keyboard.

### About `/about`, Legal `/legal`

Purpose: what Coachlore is, the credits, the not-affiliated notice, the
licences of the data and images, and the privacy notice.

```text
360                              1024
┌──────────────────────────────┐ ┌─────────────────────────────────────────────┐
│ About                        │ │ About                                       │
│ Coachlore is a fan-made …    │ │ Coachlore is a fan-made Pokédex and a home  │
│ CREDITS                      │ │ for draft leagues …        ┌──────────────┐ │
│ Data: … · Images: …          │ │ CREDITS                    │ On this page │ │
│ NOT AFFILIATED               │ │ …                          │ Credits      │ │
│ Pokémon and its names are …  │ │ NOT AFFILIATED …           │ Notice       │ │
└──────────────────────────────┘ └─────────────────────────────────────────────┘
```

- Plain text pages, server-rendered, no client code.
- Components: Separator, Breadcrumb.

### Not found, offline

```text
360 (offline)                    1024 (not found)
┌──────────────────────────────┐ ┌─────────────────────────────────────────────┐
│ You're offline               │ │ Page not found                              │
│ This page isn't saved for    │ │ There's no page at this address. Check the  │
│ offline use. The Dex pages   │ │ link, or start again from the home page.    │
│ you've opened still work.    │ │ [ Go to the home page ]                     │
│ [ Open the Dex ]             │ │                                             │
└──────────────────────────────┘ └─────────────────────────────────────────────┘
```

- Components: `EmptyState`, Button.

## Acceptance criteria

This spec is done when:

1. The colour tokens above exist in both themes, the 18 type pairs are
   used by a type badge, and an automated check recomputes every pair's
   contrast and fails below 4.5:1.
2. The shell works at 360, 768, 1024 and 1440 px: tabs on a phone, the
   sidebar from 1024 px, the skip link, the landmarks, and the footer's
   notice and credits on every page.
3. The search palette opens with the button, and with Ctrl K or ⌘ K; no
   single key opens it or changes the theme. The theme button switches
   between light and dark, and the choice survives a reload.
4. Every state in [States every view has](#4-states-every-view-has) is
   shown on the real view that has it, reviewed by the owner on a desktop
   and a phone (the fixture page was removed:
   [ADR 0010](../../adr/0010-only-real-routes.md)).
5. `/about`, `/legal`, not found and `/offline` are built, server-rendered,
   with titles and descriptions as `apps/web/README.md` describes.
6. An automated accessibility check finds no WCAG 2.2 AA violations on every page this
   spec builds, in both themes; keyboard-only use reaches everything.
7. With reduced motion on, nothing moves across the screen.
8. A mobile lab measurement shows no layout shift on these pages
   (CLS 0), and the owner's `/interface-review` passes.
9. On a long list under the shell's sticky bars (the Dex's list), at
   360 × 640, tabbing to the last row keeps the focused row in view, never
   under a sticky bar (WCAG 2.4.11); spec 008 repeats the test in the draft
   room.
10. Every page this spec builds works in English and Hindi: an address
    without a language redirects as [Languages](#6-languages) says, the
    top bar's language button changes the page's language and it's
    remembered, `<html>` has the
    right `lang` and `dir`, Hindi uses its font, and each page lists its
    other-language version.
11. The two dictionaries have the same keys, checked by a test, and no
    component contains interface text.
12. Rendered with `dir="rtl"`, the shell and every page this spec builds
    keep their layout (nothing overflows or overlaps), and no style uses a
    physical direction (`left` or `right`), checked by a test; back and
    next icons point the other way, and no arrow character is used as an
    icon.
13. An address that matches no page, after the redirect to a language,
    answers not found with the exception page above, as complete HTML in
    that one language (`/hi/…` in Hindi, with `<html lang="hi">`), a link
    to its home page, a 404 status, and no WCAG 2.2 AA violations. The site's own files answer 200 and are never redirected.

## Out of scope

From the screens research, left out of v1:

| From the research                          | Why it's out                                                                                    |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| The daily silhouette quiz and its streak   | Not in the project doc's scope; built on official artwork                                       |
| Shiny artwork, the cry, the holofoil tilt  | More official images and sounds, against "as few official images as possible"                   |
| Favourites and saved teams                 | A team lives in its link (`/team-check?team=…`); nothing to store, and the Dex needs no account |
| In-app notifications                       | The bot posts to the league channel (spec 011); the draft room shows whose turn it is           |
| Chat in the draft room                     | Leagues already talk on Discord                                                                 |
| League logos uploaded by users             | A colour and initials do the job without storing images                                         |
| "Describe your league" (AI fills the form) | Not in the project doc's AI scope                                                               |
| Discovering public leagues                 | Whether league pages can be public is an open question; v1 leagues are private (owner's call)   |
| "Drafted in N leagues" on a Pokémon's page | Shows data across leagues to people outside them                                                |
| An AI explanation on a coach's roster      | Team check explains a team; the roster links there (specs 005, 012)                             |
| Our own drawn type icons                   | A type is shown by its colour and its name, which meets the rule; icons can come later          |

## Changes

- 2026-10-21: written.
- 2026-10-21: audit. Rosters (`/l/[league]/rosters`, replacing `teams`),
  time zones, Focus Not Obscured, the draft room on phones (three tabs, no
  app tabs), the Showdown username on joining, finished seasons, Rules and
  edge cases, and Out of scope.
- 2026-10-21: languages (ADR 0007): English and Hindi, the language menu,
  logical directions, Hindi copy rules.
- 2026-10-21: built. The contrast test found shadcn's light muted text at
  4.34:1 on the muted background; it's darkened from `oklch(0.556 0 0)` to
  `oklch(0.54 0 0)` (4.64:1). Motion uses Tailwind's own `ease-out` and
  `ease-in-out` beside the two duration tokens. Toasts are shadcn's `toast`,
  on Base UI's Toast, not Sonner (the owner, 2026-10-21): no extra package.
- 2026-10-21: languages with next-intl ([ADR 0008](../../adr/0008-translation-library.md)),
  after the owner asked for a scalable, enterprise-grade set-up. Criterion
  13 now follows the redirect: what's still unmatched gets the
  two-language page.
- 2026-10-21: the mark is the Playbook (the owner's choice from five
  concepts): an open book with one play drawn across it, the coach and the
  lore. It is in `apps/web/app/icon.svg` and the top bar
  (`components/shell/logo-mark.tsx`); the favicon, touch icon and share
  image are rendered from it by `packages/playwright-web/scripts/make-icons.mjs`.
- 2026-10-22: the fixture pages removed; criteria 4 and 9 met on real
  views ([ADR 0010](../../adr/0010-only-real-routes.md)).
