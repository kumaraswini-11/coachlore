# Draftboard: screens, UI and the AI angle

> **A dated snapshot, not maintained.** The first screen-by-screen design,
> kept as it was written. Where it and a later document disagree, the later
> one wins: the [project doc](../project-doc.md), then the specs and
> decision records.

Companion to [the research](pokemon-app-research.md); this file replaces its
section 10 with the full screen-by-screen design, mobile first, with the AI
features added.

Written 20 October 2026. A personal project: building and learning come
first, marketing second. The legal rules in the research file still apply
(a non-commercial website, a disclaimer, as few official images as
possible).

---

## Contents

1. [The idea in one paragraph](#1-the-idea-in-one-paragraph)
2. [Every screen at a glance](#2-every-screen-at-a-glance)
3. [The look: design direction](#3-the-look-design-direction)
4. [Mobile-first rules](#4-mobile-first-rules)
5. [The app shell and navigation](#5-the-app-shell-and-navigation)
6. [The Dex screens](#6-the-dex-screens)
7. [The League screens](#7-the-league-screens)
8. [Account, system and overlay screens](#8-account-system-and-overlay-screens)
9. [The AI angle](#9-the-ai-angle)
10. [What makes it exciting](#10-what-makes-it-exciting)
11. [States every screen has](#11-states-every-screen-has)
12. [What changes in the plan](#12-what-changes-in-the-plan)
13. [Sources](#13-sources)

---

## 1. The idea in one paragraph

**Draftboard** is a fast, beautiful Pokédex anyone can use on their phone,
and a home for Pokémon draft leagues: create a league, draft live with
friends, play the matches on Showdown, and let the app keep the schedule,
standings, trades and stats. **AI helps without guessing:** it turns plain
questions into filters, explains a team's weaknesses, suggests draft picks
from computed options, and writes match recaps from the real battle log.
Every number comes from data and arithmetic; the AI only explains and
chooses among what the data allows.

---

## 2. Every screen at a glance

**29 screens: 24 routes, plus 4 overlays and the offline / not-found
screens.** "v1" is the first full version;
"Later" comes after it.

| #   | Screen                | Route                       | Area       | Signed in       | AI                         | Phase |
| --- | --------------------- | --------------------------- | ---------- | --------------- | -------------------------- | ----- |
| 1   | Home                  | `/`                         | Dex        | No              | Ask box                    | v1    |
| 2   | Browse the Dex        | `/dex`                      | Dex        | No              | Plain-language search      | v1    |
| 3   | A Pokémon             | `/dex/:species`             | Dex        | No              | "Ask about it"             | v1    |
| 4   | Type chart            | `/types`                    | Dex        | No              | —                          | v1    |
| 5   | Moves                 | `/moves`                    | Dex        | No              | Plain-language search      | v1    |
| 6   | A move                | `/moves/:move`              | Dex        | No              | —                          | v1    |
| 7   | An ability            | `/abilities/:ability`       | Dex        | No              | —                          | v1    |
| 8   | A game's Dex          | `/games/:game`              | Dex        | No              | —                          | v1    |
| 9   | Team check            | `/team-check`               | Dex        | No (saved: yes) | Explain + suggest fixes    | v1    |
| 10  | Ask                   | `/ask`                      | Dex        | Yes             | The assistant, full screen | v1    |
| 11  | Compare               | `/compare`                  | Dex        | No              | —                          | Later |
| 12  | Damage calculator     | `/calc`                     | Dex        | No              | —                          | Later |
| 13  | Leagues               | `/leagues`                  | League     | No              | —                          | v1    |
| 14  | Create a league       | `/leagues/new`              | League     | Yes             | Rules from a description   | v1    |
| 15  | League home           | `/l/:league`                | League     | Members*        | Weekly digest              | v1    |
| 16  | Tier list             | `/l/:league/tiers`          | League     | Members*        | —                          | v1    |
| 17  | **Draft room**        | `/l/:league/draft`          | League     | Members*        | Pick suggestions           | v1    |
| 18  | A coach's team        | `/l/:league/teams/:coach`   | League     | Members*        | Team review                | v1    |
| 19  | Schedule              | `/l/:league/schedule`       | League     | Members*        | —                          | v1    |
| 20  | A match               | `/l/:league/matches/:match` | League     | Members*        | Match recap                | v1    |
| 21  | Trades                | `/l/:league/trades`         | League     | Members*        | Trade check                | v1    |
| 22  | Stats                 | `/l/:league/stats`          | League     | Members*        | —                          | v1    |
| 23  | League settings       | `/l/:league/settings`       | League     | Admins          | —                          | v1    |
| 24  | Me                    | `/me`                       | Account    | Yes             | —                          | v1    |
| —   | Sign in               | overlay                     | Account    | —               | —                          | v1    |
| —   | Search palette        | overlay (⌘K or `/`)         | Everywhere | No              | Ask from anywhere          | v1    |
| —   | Filters               | overlay (bottom sheet)      | Dex        | No              | —                          | v1    |
| —   | Notifications         | overlay                     | Account    | Yes             | —                          | v1    |
| —   | Offline and not found | system                      | Everywhere | No              | —                          | v1    |

\* A league can be public, so anyone can watch; it's private by default.

Also: `/about` and `/legal` (credits, the disclaimer, privacy), plain text
pages.

---

## 3. The look: design direction

**In one line:** a calm, card-based app where each Pokémon's type colour is
the accent, with big artwork, clean numbers, and League screens that feel
like a modern fantasy-sports app.

| Element        | Choice                                                                                                     | Why                                                                                                         |
| -------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Mood           | Calm surfaces, colour from the content                                                                     | The type colours are loud already; the frame stays quiet                                                    |
| Theme          | Light and dark, both first-class; follows the system                                                       | Many play at night                                                                                          |
| Accent         | The page's Pokémon type colours its header, tabs and stat bars                                             | Each page feels different without a new design                                                              |
| Type colours   | 18 tokens, each paired with a text colour that passes 4.5:1                                                | White on Electric yellow fails; black passes ([WCAG 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum)) |
| Type badges    | Colour **and** name **and** your own icon                                                                  | Never colour alone (colour-blind users)                                                                     |
| Font           | One variable sans font; tabular figures for stats and standings                                            | Numbers line up in tables                                                                                   |
| Artwork        | Large on detail pages, small sprites in grids, fixed sizes                                                 | No layout shift                                                                                             |
| Cards          | Rounded, soft shadow in light, a faint border in dark                                                      | Recognisable, tappable                                                                                      |
| Icons          | Lucide for the interface; your own drawn type icons                                                        | No official icon assets                                                                                     |
| Components     | shadcn/ui (Base UI underneath), Tailwind tokens                                                            | Accessible primitives, consistent                                                                           |
| League screens | Inspired by fantasy-sports apps ([Sleeper](https://sleeper.com)): bold numbers, live tickers, team colours | Draft night should feel like an event                                                                       |

**Design references** (from the research file): Saepul Nahwan's Pokédex
concept for the type-coloured grid, skydoves/Pokedex for list-to-detail
transitions, PokémonDB for the detail page's order, PKMN.help for the type
tools, PvPoke for the team builder, and Sleeper for the draft room.

---

## 4. Mobile-first rules

Every screen is designed at **360 px wide first**, then grows.

| Width        | Name    | Layout                                                                |
| ------------ | ------- | --------------------------------------------------------------------- |
| 360–767 px   | Phone   | One column; bottom tab bar; panels become bottom sheets               |
| 768–1023 px  | Tablet  | Two columns where useful (list + detail); tab bar becomes a side rail |
| 1024–1439 px | Desktop | Sidebar; three columns in the draft room                              |
| 1440 px +    | Wide    | Content capped at about 1,280 px; the draft room uses the full width  |

**The rules:**

- **Thumb reach:** primary actions sit at the bottom on phones (a sticky
  action bar), never only in the top corner.
- **Touch targets:** at least 44 × 44 px for main controls; never below
  WCAG 2.2's 24 × 24 px minimum
  ([2.5.8](https://www.w3.org/TR/WCAG22/#target-size-minimum)).
- **Sheets, not side panels:** filters, the search palette, a Pokémon's
  quick view and the draft pool's details open as bottom sheets on phones
  and as side panels on desktop: the same component, two shapes.
- **Tables become cards:** standings, moves and stats are tables on desktop
  and stacked cards (or a horizontally scrolling table with the first column
  pinned) on phones.
- **Real screen height:** `dvh` units and safe-area insets, so the bottom
  bar clears the iPhone home indicator and the keyboard doesn't hide the
  chat box.
- **Swipe where it's natural:** swipe between Pokémon on the detail page,
  between tabs in the draft room; always with buttons too.
- **Container queries:** a card lays itself out by its own width, so the
  same card works in a grid, a sheet and a sidebar.
- **Fast on a mid-range phone:** a virtualised grid for 1,025+ species,
  lazy images with fixed sizes, the Dex cached offline, Core Web Vitals
  "good" on a throttled phone profile.

---

## 5. The app shell and navigation

**Phone:** a top bar (logo, search, avatar) and a **bottom tab bar** with
five tabs.

```text
┌──────────────────────────────┐
│ ◆ Draftboard        🔍   (A) │  top bar: search opens the palette
├──────────────────────────────┤
│                              │
│         page content         │
│                              │
├──────────────────────────────┤
│  Dex   Team   Ask  Leagues Me│  bottom tabs, 5 items, icons + labels
└──────────────────────────────┘
```

**Desktop:** a slim top bar and a left sidebar; inside a league, the
sidebar lists the league's sections.

```text
┌────────────────────────────────────────────────────────────────────┐
│ ◆ Draftboard     [ Search or ask…            ⌘K ]        🔔   (A) │
├──────────────┬─────────────────────────────────────────────────────┤
│ Dex          │                                                     │
│ Types        │                                                     │
│ Moves        │                    page content                     │
│ Team check   │                                                     │
│ Ask          │                                                     │
│ ──────────── │                                                     │
│ MY LEAGUES   │                                                     │
│ ● Kanto Cup  │                                                     │
│ ● Friday VGC │                                                     │
└──────────────┴─────────────────────────────────────────────────────┘
```

**Inside a league on a phone,** a second row of scrollable tabs sits under
the top bar: Home · Draft · Teams · Schedule · Trades · Stats.

**One search everywhere:** the search palette (shadcn's Command) finds
Pokémon, moves, abilities, leagues and coaches as you type, and offers
"Ask: …" as the last row, which sends the text to the assistant.

---

## 6. The Dex screens

### 1 · Home `/`

**Purpose:** start anything in one tap: search, ask, jump into a league.

```text
┌──────────────────────────────┐
│ ◆ Draftboard        🔍   (A) │
├──────────────────────────────┤
│ Good evening, Ash            │
│ ┌──────────────────────────┐ │
│ │ Search or ask anything…  │ │  big search box; the AI is inside it
│ └──────────────────────────┘ │
│ Try: "fast fire types" ·     │  example chips, tappable
│ "what beats Garchomp?"       │
│                              │
│ YOUR DRAFT IS LIVE  ● 2:14   │  only when a draft is running
│ ┌──────────────────────────┐ │
│ │ Kanto Cup · Round 4      │ │
│ │ You pick in 2 turns  [→] │ │
│ └──────────────────────────┘ │
│                              │
│ WHO'S THAT?    🔥 streak 6   │  daily silhouette quiz
│ ┌──────────────────────────┐ │
│ │      ▓▓▓ silhouette ▓▓▓  │ │
│ │ [ Guess…             ]   │ │
│ └──────────────────────────┘ │
│                              │
│ RECENTLY VIEWED      →       │  horizontal scroll of cards
│ [card] [card] [card] [card]  │
│                              │
│ YOUR LEAGUES         →       │
│ [Kanto Cup 3rd] [Friday 1st] │
├──────────────────────────────┤
│  Dex   Team   Ask  Leagues Me│
└──────────────────────────────┘
```

- **Signed out:** the league blocks become "Run a draft league with your
  friends" with a short explanation and a sign-in button.
- **Desktop:** two columns: search, quiz and recent on the left; leagues
  and the live draft on the right.
- **The moment:** the daily silhouette reveals in full colour with a small
  burst when you guess right; your streak counts up.

### 2 · Browse the Dex `/dex`

**Purpose:** find any Pokémon by number, name, type, game, generation,
stats or a plain question.

```text
┌──────────────────────────────┐
│ ← Dex              Grid ▦ ☰  │  grid / list toggle
│ ┌──────────────────────────┐ │
│ │ ✦ fast steel types that  │ │  plain-language search
│ │   resist fairy           │ │
│ └──────────────────────────┘ │
│ ✦ AI read this as:           │
│ [Steel ×] [Speed ≥ 90 ×]     │  editable chips: the real filters
│ [Resists Fairy ×]  + Filter  │
│ 12 Pokémon · Sort: Number ▾  │  count announced to screen readers
│ ┌──────┐┌──────┐┌──────┐     │
│ │ art  ││ art  ││ art  │     │  type-coloured cards
│ │#0082 ││#0205 ││#0208 │     │
│ │Magne…││Forre…││Steel…│     │
│ │STEEL ││BUG   ││STEEL │     │
│ └──────┘└──────┘└──────┘     │
│ ┌──────┐┌──────┐┌──────┐     │
│ │ …    ││ …    ││ …    │     │  virtualised: 1,025+ cards scroll smoothly
├──────────────────────────────┤
│  Dex   Team   Ask  Leagues Me│
└──────────────────────────────┘
```

- **Filters sheet** (from "+ Filter"): type, weakness, resistance, game,
  generation, ability, height and weight, stat ranges (sliders), forms
  (regional, Mega, Gigantamax), legendary or mythical.
- **Columns:** 3 on a phone, 4 on a tablet, 6–8 on desktop; the list view
  shows stats in a sortable table.
- **The URL holds the filters** (`?type=steel&speed=90-`), so any view can
  be shared or bookmarked; the AI only fills them in.
- **The moment:** tapping a card morphs its artwork into the detail page's
  header (a View Transition), and Back morphs it home.

### 3 · A Pokémon `/dex/:species`

**Purpose:** everything about one Pokémon, in the order players look for
it (the research file's 12 blocks), without a wall of tables.

```text
┌──────────────────────────────┐
│ ←  #0445            ☆  ⋯     │  favourite, share
│ ╭──────────────────────────╮ │  header tinted with its types' colours
│ │                          │ │
│ │      big artwork         │ │  swipe ← → for the next Pokémon
│ │                          │ │
│ ╰──────────────────────────╯ │
│ Garchomp           ✨ 🔊     │  shiny toggle, cry
│ [DRAGON] [GROUND]            │
│ Form: (Normal) (Mega)        │  form switcher
│ ─────────────────────────────│
│ About Stats Matchups Moves … │  sticky tabs, swipeable
│ ─────────────────────────────│
│ HP      108 ████████░░       │
│ Attack  130 ██████████░      │  bars in the type colour
│ Defense  95 ███████░░░       │
│ Sp. Atk  80 ██████░░░░       │
│ Sp. Def  85 ██████░░░░       │
│ Speed   102 ████████░░       │
│ Total   600                  │
│                              │
│ ✦ Ask about Garchomp         │  opens Ask with this Pokémon as context
├──────────────────────────────┤
│  Dex   Team   Ask  Leagues Me│
└──────────────────────────────┘
```

**The tabs and what each holds:**

| Tab         | Content                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| About       | Pokédex entries by game, height, weight, category, abilities (hidden marked), training and breeding, names in other languages |
| Stats       | Base stats, stat total, min/max at level 50 and 100                                                                           |
| Matchups    | Damage taken from each type, grouped ×4, ×2, ½, ¼, 0                                                                          |
| Evolution   | The chain as tappable cards with each method ("Level 48", "Trade holding Metal Coat")                                         |
| Moves       | By game, then by method (level, TM, egg, tutor); sortable                                                                     |
| Where       | Where to catch it in each game, version exclusives marked                                                                     |
| Competitive | Usage %, common moves, items, partners (monthly Smogon stats); "Drafted in 34 leagues"                                        |

- **Desktop:** artwork and key facts on the left (sticky), tabs become
  sections on the right in one scroll, with a section menu.
- **The moment:** the header's gradient comes from the Pokémon's types;
  the shiny toggle cross-fades the artwork; the cry plays with a small
  waveform.

### 4 · Type chart `/types`

**Purpose:** what's strong against what, for one type or a dual type.

- **Phone:** pick one or two types (two rows of 18 badges); below, three
  cards: "Takes double from", "Takes half from", "Immune to". The full
  18 × 18 chart is a separate view that scrolls both ways with the header
  row and column pinned.
- **Desktop:** the full 18 × 18 chart on the left, the dual-type calculator
  on the right; hovering a cell highlights its row and column.
- **Accessibility:** the chart is a real table with row and column
  headers; each cell's text says "×2", never colour alone.

### 5–7 · Moves, a move, an ability

- **Moves list:** a searchable, sortable table (name, type, category,
  power, accuracy, PP); on a phone, each row is a compact card with the
  type badge and power. Plain-language search works here too ("priority
  moves that hit fairy super-effectively").
- **A move:** its effect in plain words, numbers, and "Learned by" as a
  filterable grid of Pokémon.
- **An ability:** its effect, and which Pokémon have it (normal or
  hidden).

### 8 · A game's Dex `/games/:game`

**Purpose:** the Pokédex for one game: only what's catchable there, its
exclusives, its regional numbers.

- A game picker at the top (cover-like tiles in your own simple style, not
  box art); then the same grid as `/dex`, filtered, with "Exclusive to
  Scarlet" badges.

### 9 · Team check `/team-check`

**Purpose:** build a team of six and see its weaknesses and coverage at a
glance.

```text
┌──────────────────────────────┐
│ ← Team check     Import ⋯    │  import / export Showdown text
│ ┌────┐┌────┐┌────┐           │
│ │art ││art ││ +  │           │  six slots; tap + to add
│ └────┘└────┘└────┘           │
│ ┌────┐┌────┐┌────┐           │
│ │art ││ +  ││ +  │           │
│ └────┘└────┘└────┘           │
│ WEAKNESSES                   │
│ ICE    ●●●○○○  3 weak  ⚠     │  dots per team member
│ FAIRY  ●●○○○○  2 weak        │
│ WATER  ●○○○○○  1 weak        │
│ COVERAGE (your moves hit)    │
│ ✓ 14 of 18 types super-eff.  │
│ ✗ Steel, Water, Fire, Dragon │
│ ┌──────────────────────────┐ │
│ │ ✦ Explain my team        │ │  AI: plain-language summary
│ │ ✦ Suggest a fix for Ice  │ │  AI explains computed candidates
│ └──────────────────────────┘ │
├──────────────────────────────┤
│  Dex   Team   Ask  Leagues Me│
└──────────────────────────────┘
```

- **Desktop:** slots across the top, the weakness matrix (types × team
  members) on the left, coverage and the AI panel on the right.
- **Saved teams** when signed in; shareable by link.
- **The moment:** adding a Pokémon makes its weaknesses ripple into the
  matrix; a covered weakness turns from amber to green.

### 10 · Ask `/ask`

The assistant, full screen (section 9 explains what it can and can't do).

```text
┌──────────────────────────────┐
│ ← Ask                 New ⟳  │
│                              │
│      ┌─────────────────────┐ │
│      │ What beats Garchomp │ │  your question
│      │ in a draft league?  │ │
│      └─────────────────────┘ │
│ ✓ Looked up Garchomp         │  the lookups, shown first
│ ✓ Checked its matchups       │
│ ✓ Found 8 Ice-type options   │
│ ┌──────────────────────────┐ │
│ │ Garchomp takes ×4 from   │ │
│ │ Ice moves. Good answers: │ │
│ │ [Weavile] [Mamoswine]    │ │  chips: tap opens the Pokémon
│ │ [Baxcalibur] …           │ │
│ └──────────────────────────┘ │
│ ✦ Written by AI from the     │
│   Dex's data · 4 of 20 left  │  today's allowance
│ ┌──────────────────────────┐ │
│ │ Ask a follow-up…      ➤  │ │  stays above the keyboard
│ └──────────────────────────┘ │
├──────────────────────────────┤
│  Dex   Team   Ask  Leagues Me│
└──────────────────────────────┘
```

- **On desktop,** Ask also opens as a side panel from any page, already
  knowing the page's Pokémon, team or league.

### 11–12 · Later: Compare and Damage calculator

- **Compare:** two to four Pokémon side by side: overlaid stat bars (or a
  radar chart with a table alternative), shared weaknesses, who outspeeds
  whom. On a phone: two at a time, swipe for more.
- **Damage calculator:** attacker and defender panels with stats, items,
  natures and the move; the result as a percentage range and "chance to
  KO", from `@smogon/calc`. On a phone, the panels stack, and the result
  sticks to the bottom.

---

## 7. The League screens

### 13 · Leagues `/leagues`

**Purpose:** your leagues, and public ones to watch or join.

- **Your leagues** as cards: name, logo, season, your place, "Draft live"
  or "Week 5 · vs Misty" badges.
- **Discover:** public leagues with filters (format: VGC or singles;
  generation; status: drafting, in season, finished).
- **Empty state:** "No leagues yet. Create one, or ask a friend for an
  invite link."

### 14 · Create a league `/leagues/new`

**Purpose:** set up a league in a few minutes, with sensible defaults.

A five-step form, one step per screen on a phone, with a progress bar:

1. **Basics:** name, logo (upload or pick a colour and emblem),
   public or private.
2. **Format:** singles or doubles, generation, game rules (level, items,
   banned list), number of coaches.
3. **Draft:** snake or linear order, points budget, picks per coach, timer
   per pick, start date.
4. **Season:** weeks, matches per week, playoffs (Later), trade window.
5. **Discord:** link a server and channel for the bot (optional).

**✦ AI:** "Describe your league" ("8 friends, doubles, Champions rules,
110 points, weekly Friday matches") fills the form; every field stays
editable and is checked by the same validation as typing it by hand.

### 15 · League home `/l/:league`

**Purpose:** the league's front page: what's happening this week.

```text
┌──────────────────────────────┐
│ ← Kanto Cup          ⚙  ⋯    │
│ Home Draft Teams Schedule …  │  league tabs, scrollable
│ ┌──────────────────────────┐ │
│ │ WEEK 5 OF 9              │ │
│ │ You vs Misty · Fri 20:00 │ │
│ │ [Report result]          │ │
│ └──────────────────────────┘ │
│ STANDINGS            Full →  │
│ 1  Brock     4-0  +12        │  tabular numbers
│ 2  You       3-1   +7        │  your row highlighted
│ 3  Misty     3-1   +5        │
│ 4  Gary      2-2   +1        │
│ ✦ THIS WEEK IN THE LEAGUE    │  AI digest from real results
│ "Brock stays unbeaten after  │
│  his Tyranitar swept two…"   │
│ RECENT                       │
│ • Gary traded Rotom for …    │  activity feed
│ • Misty beat Erika 4-0       │
├──────────────────────────────┤
│  Dex   Team   Ask  Leagues Me│
└──────────────────────────────┘
```

- **Desktop:** standings and the week's matches on the left; the digest
  and the activity feed on the right.

### 16 · Tier list `/l/:league/tiers`

**Purpose:** each Pokémon's points cost in this league, and who's banned.

- **Phone:** tiers as collapsible sections ("20 points", "19 points" …),
  each a grid of small cards; drafted ones dimmed with the coach's colour.
- **Desktop for admins:** a drag-and-drop board: drag a Pokémon between
  tiers (and a keyboard way: select, then "Move to…"); start from a template
  (for example a community tier list for the format) and adjust.
- **Search and filter** as in the Dex.

### 17 · Draft room `/l/:league/draft` (the centrepiece)

**Purpose:** a live draft, everyone at once, picks appearing instantly.

**Phone:** a sticky status bar and four tabs.

```text
┌──────────────────────────────┐
│ ← Kanto Cup draft   ● LIVE   │
│ ┌──────────────────────────┐ │
│ │ Round 3 · Pick 21 of 64  │ │
│ │ ◔ 0:47  Misty is picking │ │  timer ring; whose turn
│ │ You: in 2 picks · 48 pts │ │  your points left
│ └──────────────────────────┘ │
│ Board  Pool  My team  Chat   │  tabs, swipeable
│ ─────────────────────────────│
│ POOL     🔍  Tier ▾  Type ▾  │
│ ┌──────────────────────────┐ │
│ │ [art] Garchomp   18 pts  │ │
│ │ DRAGON GROUND     ☆ queue│ │  queue your wishlist
│ ├──────────────────────────┤ │
│ │ [art] Kingambit  17 pts  │ │
│ │ DARK STEEL        ☆      │ │
│ ├──────────────────────────┤ │
│ │ …                        │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ ✦ Suggest a pick         │ │  only you see it
│ │ [   Draft Garchomp   ]   │ │  enabled on your turn only
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

**Desktop:** three columns, the board always visible.

```text
┌───────────────┬───────────────────────────────┬──────────────────┐
│ BOARD         │ POOL   🔍 search  Tier▾ Type▾ │ MY TEAM  48 pts  │
│ R1 R2 R3 R4   │ ┌─────┐┌─────┐┌─────┐┌─────┐ │ [art] Tyranitar  │
│ Brock ■ ■ ■   │ │ art ││ art ││ art ││ art │ │ [art] Rotom-W    │
│ You   ■ ■ ·   │ │18pts││17pts││16pts││16pts│ │ [art] —          │
│ Misty ■ ■ ◔   │ └─────┘└─────┘└─────┘└─────┘ │ ──────────────── │
│ Gary  ■ ■ ·   │ ┌─────┐┌─────┐┌─────┐┌─────┐ │ ✦ SUGGESTIONS    │
│ …             │ │ …   ││ …   ││ …   ││ …   │ │ 1 Garchomp: fills│
│               │ └─────┘└─────┘└─────┘└─────┘ │   your Ground gap│
│ ◔ 0:47 Misty  │                               │ 2 Kingambit: …   │
│ picking       │ [ Draft selected ]            │ CHAT             │
└───────────────┴───────────────────────────────┴──────────────────┘
```

**What makes it work:**

- **Live:** picks arrive over WebSockets for everyone at once; if you lose
  the connection, a banner says "Reconnecting…" and the board catches up
  from the server when it's back.
- **Fair:** the server decides whose turn it is and whether a pick is
  allowed (points left, already taken, banned); two coaches can never take
  the same Pokémon (a unique constraint, tested under concurrency).
- **Queue and auto-pick:** a wishlist in order; if your timer runs out,
  the first available one is drafted for you (a league setting).
- **Pick reveal:** on each pick, everyone's screen shows the Pokémon's
  card for two seconds with the coach's name (a still card with reduced
  motion), then it slides into the board.
- **Timer for screen readers:** announced at 30 and 10 seconds and on each
  pick, not every second (a polite live region).
- **Draft complete:** a summary of every team, with points used, and a
  share image.

### 18 · A coach's team `/l/:league/teams/:coach`

**Purpose:** one coach's roster and record.

- A header with the coach's name, colour and record (3-1, +7); the roster
  as cards with points and each Pokémon's season stats (games, KOs,
  deaths).
- The team's weakness and coverage summary, from the Team check's
  arithmetic.
- **✦ AI:** "Team review": strengths and gaps in a short paragraph, built
  only from the computed weaknesses and the league's tier list.

### 19 · Schedule `/l/:league/schedule`

**Purpose:** every week's matches.

- **Phone:** a week switcher at the top (◀ Week 5 ▶), then match cards:
  both coaches, the score once reported, the status (upcoming, reported,
  confirmed, disputed).
- **Desktop:** all weeks as a grid; your matches highlighted.

### 20 · A match `/l/:league/matches/:match`

**Purpose:** the result, the replay, the stats, and a recap.

```text
┌──────────────────────────────┐
│ ← Week 5                     │
│   YOU   4 – 2   MISTY        │  big score
│   ✓ confirmed by both        │
│ [▶ Watch replay on Showdown] │
│ KOs                          │  parsed from the battle log
│ Garchomp    3 KOs  0 fainted │
│ Rotom-W     1 KO   1 fainted │
│ …                            │
│ MVP: Garchomp                │  computed, not chosen by AI
│ ✦ RECAP                      │
│ "Garchomp opened with two    │
│  quick KOs, and Misty's      │
│  Gyarados couldn't…"         │
│ Written by AI from the       │
│ battle log                   │
└──────────────────────────────┘
```

- **Reporting a result:** the winner pastes the Showdown replay link; the
  server downloads the replay's JSON (it carries the full battle log:
  switches, moves, faints, the winner), parses it, fills in the score and
  KOs, and the other coach confirms. Typing the score by hand stays
  possible.

### 21 · Trades `/l/:league/trades`

**Purpose:** propose, accept and approve trades.

- **Trade builder:** pick a coach; choose what you give and what you get
  from two rosters; the points difference is shown live; "Send offer".
- **States:** proposed → accepted or declined → approved by an admin (if
  the league asks for it) → done; or expired at the trade deadline.
- **✦ AI:** "Trade check" explains how the trade changes both teams'
  weaknesses and coverage, from the computed before-and-after.

### 22 · Stats `/l/:league/stats`

**Purpose:** leaders and records.

- KO leaders, most-used Pokémon, best differential, longest win streak,
  each a ranked list; a chart of standings by week (with a table
  alternative).
- **Phone:** one leaderboard at a time, with a selector.

### 23 · League settings `/l/:league/settings`

**Purpose:** for admins: coaches, roles, rules, Discord, the AI switch.

- Sections: General, Coaches (invite link, roles: admin, coach, viewer),
  Rules, Draft, Trades, Discord, **AI** (allow pick suggestions in the draft
  room: on or off; allow recaps and digests: on or off), Danger zone
  (archive, delete).

---

## 8. Account, system and overlay screens

- **24 · Me `/me`:** your profile (from Discord), your leagues, saved
  teams, favourites, the quiz streak, theme, language, notification
  settings, the AI allowance used today, delete my account.
- **Sign in (overlay):** "Continue with Discord" (most draft leagues live
  there); the Dex never needs it.
- **Search palette (overlay):** section 5.
- **Filters (overlay):** a bottom sheet on phones, a side panel on desktop.
- **Notifications (overlay):** your turn to pick, a trade offer, a result
  to confirm, a new week; also sent by the Discord bot.
- **Offline:** the Dex keeps working from its cache; League screens say
  "You're offline: this needs a connection" with the last data shown,
  greyed.
- **Not found:** a friendly page with search, never a dead end.

---

## 9. The AI angle

### The rule

**Arithmetic decides; the AI explains and chooses among what the data
allows.** The model never invents a stat, a matchup or a result.

- Numbers (stats, damage, weaknesses, standings, KOs) come from the
  database and code.
- Every Pokémon, move or ability the AI names is checked against the
  database before the answer is shown; an answer naming something that
  doesn't exist is retried once, then refused.
- Every AI answer is labelled ("✦ Written by AI from …") and shows what it
  looked up.
- The app works fully with the AI off, or out of quota.

### The features

| #   | Feature                             | Where                         | How it works                                                                                                                                                  | What the AI may not do                  |
| --- | ----------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 1   | **Plain-language search**           | `/dex`, `/moves`, the palette | The model turns "fast steel types that resist fairy" into structured filters (a schema); the database returns the results; the filters show as editable chips | Return Pokémon itself                   |
| 2   | **Ask**                             | `/ask`, side panel            | A chat with tools: look up a Pokémon, its matchups, moves, a league's standings; answers cite what was looked up                                              | Answer without a lookup                 |
| 3   | **Explain my team / Suggest a fix** | `/team-check`, a coach's team | Code computes weaknesses and finds candidates that cover them; the model explains the result and the top candidates                                           | Suggest a Pokémon code didn't propose   |
| 4   | **Draft pick suggestions**          | Draft room, only for you      | Code ranks available Pokémon (points left, gaps covered, usage); the model explains the top three                                                             | See other coaches' queues; pick for you |
| 5   | **Match recap**                     | A match, Discord              | Code parses the Showdown battle log (KOs, turns, MVP); the model writes a short recap from those facts, as a background job                                   | Change the score or stats               |
| 6   | **Weekly digest**                   | League home, Discord          | From the week's results and standings, after the week closes                                                                                                  | Invent storylines                       |
| 7   | **League from a description**       | `/leagues/new`                | Text → the form's fields (a schema), then normal validation                                                                                                   | Skip validation                         |
| 8   | **Trade check**                     | Trades                        | Before-and-after team arithmetic, explained                                                                                                                   | Approve or block a trade                |

**Later:** the Discord bot answers `/ask` in the league's channel; "Ask
about this Pokémon" with competitive data; a weekly power ranking.

### How it's built

| Piece             | Choice                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Model access      | Vercel AI SDK with a provider you can swap; a Gemini Flash-Lite model for search parsing (cheap and fast), a Flash model for writing |
| Structured output | Zod schemas for filters and form fields: the model's output is validated like any request                                            |
| Tool calling      | Lookups as tools, each a plain database query; a maximum number of lookups per question                                              |
| Grounding check   | Every named Pokémon, move and ability checked against the database                                                                   |
| Background AI     | Recaps and digests as BullMQ jobs, retried, cached, and posted by the outbox                                                         |
| Limits            | Per-user daily allowance and a global budget; when it's spent, a calm "AI is resting until tomorrow" state                           |
| Prompt safety     | User-written text (team names, chat, replay names) passed as data, never as instructions                                             |
| Tracing and evals | Each run traced; a small eval set (questions with known answers, recaps from known logs) run in CI before prompt changes             |
| Optional          | `pgvector` embeddings of move and ability descriptions, for "moves that heal the user" style search (hybrid with keyword search)     |

**Free tier caution:** Google doesn't publish fixed free limits, and
unofficial reports in September 2026 put Gemini 3.x Flash at about 20
requests a day and Flash-Lite at about 500
([yingtu.ai](https://yingtu.ai/en/blog/google-gemini-api-free-tier-limits-2026),
[agentdeals.dev](https://agentdeals.dev/gemini-api-pricing-changes)).
Check the real numbers in AI Studio. That's why search uses Flash-Lite,
answers are cached, and the AI is optional everywhere. On the free tier,
Google may use the requests to improve its products: fine for a personal
project, but say so on `/legal`.

### Why it's a good AI angle for a portfolio

It shows the hard parts: structured output, tool calling, grounding checks,
background generation, budgets and limits, evals, and a UI that shows what
the AI did. It also shows judgement: the AI is a helper over real data, not
the source of truth.

---

## 10. What makes it exciting

Moments worth designing carefully (each with a still version for reduced
motion):

| Moment                                                                              | Screen             |
| ----------------------------------------------------------------------------------- | ------------------ |
| The card-to-page morph (View Transitions)                                           | Dex → Pokémon      |
| Header gradient from the Pokémon's types; shiny cross-fade; the cry                 | A Pokémon          |
| A holofoil tilt on featured cards ([pokemon-cards-css](https://poke-holo.simey.me)) | Home, draft reveal |
| The daily silhouette quiz and streak                                                | Home               |
| Weaknesses rippling as a team fills                                                 | Team check         |
| The pick reveal for everyone at once; the timer ring                                | Draft room         |
| The draft summary as a share image                                                  | Draft room         |
| The big score and the recap                                                         | A match            |
| Your row climbing the standings                                                     | League home        |
| AI chips appearing as the question is read                                          | Dex search         |

---

## 11. States every screen has

| State          | What the user sees                                                         |
| -------------- | -------------------------------------------------------------------------- |
| Loading        | Skeletons the same size as the content (no shift)                          |
| Empty          | One sentence of why, and the next action                                   |
| Error          | What failed, in plain words, with "Try again"; announced to screen readers |
| Offline        | The Dex from the cache; League screens greyed with the last data           |
| No permission  | "This league is private" with a request-to-join button                     |
| AI unavailable | The feature's button says why and when; everything else works              |
| Live updates   | New picks, results and trades slide in, with a polite announcement         |

---

## 12. What changes in the plan

Compared with the research file's roadmap:

- **Week 3:** add plain-language search (feature 1) with its schema,
  grounding check and eval set: the AI foundation.
- **Week 6:** pick suggestions in the draft room (feature 4).
- **Week 7:** replay parsing and match recaps as jobs (feature 5).
- **Week 8:** Ask (feature 2), the weekly digest, and the AI limits.
- **Packages:** add `packages/ai` (prompts, schemas, the grounding check,
  evals) and `packages/battle-log` (the Showdown log parser: pure code, fully
  unit-tested, no AI).
- **First users** are optional now (marketing comes second), but one league
  of friends using it is still the best test of the draft room.

---

## 13. Sources

**Checked for this file:**

- Showdown replays: the search API returns JSON
  ([example](https://replay.pokemonshowdown.com/search.json?format=gen9ou)),
  and a replay's `.json` holds `id`, `format`, `players`, `rating` and the
  full `log`, with lines like `|switch|`, `|move|`, `|faint|`, `|win|`
  ([example replay](https://replay.pokemonshowdown.com/gen9ou-2701585831.json)).
  No official documentation was found for these endpoints, so treat them as
  unofficial and cache what you download.
- Gemini free-tier reports (unofficial, conflicting):
  [yingtu.ai](https://yingtu.ai/en/blog/google-gemini-api-free-tier-limits-2026),
  [agentdeals.dev](https://agentdeals.dev/gemini-api-pricing-changes),
  [tinkerllm](https://tinkerllm.com/blog/gemini-api-free-tier-limits-rate-quotas/).

**Standards:**
[WCAG 2.2 contrast](https://www.w3.org/TR/WCAG22/#contrast-minimum) ·
[WCAG 2.2 target size](https://www.w3.org/TR/WCAG22/#target-size-minimum) ·
[APG grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) ·
[APG combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) ·
[Core Web Vitals](https://web.dev/articles/vitals).

**Design references:** listed in the research file's section 10, plus
[Sleeper](https://sleeper.com) for the draft room's feel.
