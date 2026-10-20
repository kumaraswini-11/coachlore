# Draftboard | Pokédex and Draft League Manager

<!-- Badges follow the Stack section's order: the app, then the tooling. Only what the repository uses today gets a badge; planned tools get one when they're added. Each takes its brand's colour (Simple Icons, from each brand's guidelines; React's from react.dev); where shields' white text on it would read under 3:1, the badge is black and the logo carries the colour. -->

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-23272F?style=for-the-badge&logo=react&logoColor=58C4DC)](https://react.dev)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)](https://ui.shadcn.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-000000?style=for-the-badge&logo=tailwindcss&logoColor=06B6D4)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![Turborepo](https://img.shields.io/badge/Turborepo-FF1E56?style=for-the-badge&logo=turborepo&logoColor=white)](https://turborepo.com)

> The name comes from the **draft board** of a sports draft: the board where
> every pick goes up as it's made, round by round, so everyone in the room
> sees who took whom.
>
> In a Pokémon draft league, coaches draft Pokémon instead of players, each
> one priced in points. Draftboard is that board for them, with a Pokédex
> beside it.

A fast, mobile-first Pokédex and a home for Pokémon draft leagues: live
drafts, schedules, trades, standings and AI match recaps from real battle
logs.

> [!NOTE]
> **Early days.** The repository holds the monorepo scaffold and the working
> rules. Everything under "How it works" and "Features" is planned, not built.

## About

Draftboard has two halves:

- **The Dex**: a Pokédex anyone can use on a phone, with no sign-in, no ads
  and nothing that jumps around while it loads.
- **Leagues**: for the draft leagues that run on Discord and spreadsheets
  today. A league is created, its coaches draft live, they play their
  matches on Pokémon Showdown, and Draftboard keeps the schedule, results,
  trades, standings and stats.

Every number comes from data and code. Where a model helps, it explains
or chooses among options the code worked out, and what it says is checked
against the data.

Draftboard is a personal project, built to learn and show heavy backend and
full-stack work. It's independent, unofficial and non-commercial (see
[Credits and disclaimer](#credits-and-disclaimer)).

## How it works

Planned:

```text
Pokémon data
  → PokéAPI and Smogon's monthly usage statistics, imported by a worker
  → stored in one database, the one source for the Dex and every league

A draft
  → a coach picks; the server checks the turn, points left and availability
  → the pick is stored (no Pokémon can be taken twice in a league)
  → every coach in the room sees it at once; the Discord bot posts it

A match
  → played on Showdown; the winner pastes the replay link
  → the battle log is parsed by code: the score, each Pokémon's KOs, the MVP
  → standings and stats update; a recap is written from those facts
```

## Features

Planned for the first version.

### The Dex

- **Search and filters**: by type, weakness, game, generation, ability and
  stats, or in plain words ("fast steel types that resist fairy"), turned
  into filters you can see and edit.
- **A page for each Pokémon**: stats, type matchups, evolutions, moves, where
  to find it in each game, Pokédex entries, names in other languages, and how
  it's used competitively.
- **Type chart** for one type or two.
- **Team check**: a team of six's weaknesses and coverage at a glance.
- **Mobile first and offline**: designed at phone width first; the Dex works
  without a connection.

### Leagues

- **Create a league**: format, rules, points budget, picks per coach, timer,
  schedule and a Discord channel.
- **Tier list**: each Pokémon's cost in points for this league, and its bans.
- **Live draft room**: snake or linear order, a timer, a wishlist with
  auto-pick, and each pick revealed to everyone at once.
- **Schedule and results**: results read from Showdown replays and confirmed
  by both coaches.
- **Trades** between coaches, with points checked and an admin's approval if
  the league asks for it.
- **Standings and stats**: records, differentials, KO leaders.
- **Discord bot**: picks, results, trade offers and reminders, in the
  league's channel.

### AI that shows its work

- **Plain-language search**: the model turns a question into filters; the
  database returns the Pokémon.
- **Ask**: a chat that looks facts up and shows its lookups before it
  answers.
- **Team and trade checks**: code works out the weaknesses and the
  candidates that cover them; the model explains them.
- **Draft suggestions**, seen only by the coach whose turn it is, and
  switched off by a league if it chooses.
- **Match recaps and a weekly digest**, written from the parsed battle logs
  and the standings.

## Held to account

Planned: each of these will be a check that runs, not a promise.

- **Nothing the AI says is unchecked.** Every Pokémon, move or ability an
  answer names is looked up in the data; an answer naming one that doesn't
  exist is never shown. An evaluation on fixed cases fails the build on a
  regression.
- **A fair draft.** A Pokémon can be drafted once per league, enforced by the
  database and tested with coaches picking at the same moment.
- **Works without the AI.** Every feature has a path that doesn't need a
  model, and runs when the AI's quota is spent.
- **Accessible.** WCAG 2.2 AA: type colours paired with text that passes
  contrast, never colour alone; keyboard and screen-reader support for the
  grid, search and draft room.
- **Fast on a phone.** Core Web Vitals' "good" thresholds, measured on a
  mid-range phone profile.
- **Respectful of the franchise.** No ads, paid tiers or app-store app, as
  few official images as possible, and the notice below on every page.

## What's next

1. The project doc and glossary: what Draftboard is, and one meaning for each
   term (coach, league, tier, pick, match).
2. The stack's decisions, each recorded with its alternatives: the package
   manager, the API, the database, real-time and hosting.
3. Specs in build order, starting with the platform and the Dex.

## Stack

What the repository uses today, from the scaffold. Each remaining piece will
be chosen and recorded as a decision in `docs/adr/`, with the alternatives
considered.

- **The app**: [Next.js](https://nextjs.org) 16 on React 19;
  [shadcn/ui](https://ui.shadcn.com) on [Base UI](https://base-ui.com), with
  [Tailwind CSS](https://tailwindcss.com) 4, Lucide icons and next-themes
- **Tooling**: TypeScript, ESLint, Prettier, [Bun](https://bun.sh) workspaces
  and [Turborepo](https://turborepo.com)

Planned, with each tool still to be chosen: an API with a relational
database and a cache, real-time updates for the draft room, background jobs,
a Discord bot, a provider-agnostic AI layer with its evaluation, and tests
from unit to end-to-end and load. The core (league
rules, Pokémon data, the battle-log parser) is planned as isolated,
framework-agnostic packages, tested on their own.

## Layout

```text
apps/
  web/                 the Next.js app
packages/
  ui/                  shared UI: shadcn components, the theme (globals.css), cn
  eslint-config/, typescript-config/
                       the settings every package shares
docs/
  git-workflow.md      a new clone's setup, the checks, branches and merging
```

## Getting started

Requires [Bun](https://bun.sh) (the version is set by `packageManager` in
`package.json`) and [Node.js](https://nodejs.org) 20.9 or later.

```bash
git clone https://github.com/kumaraswini-11/draftboard.git
cd draftboard
bun install
bun run dev
```

Before your first commit in a new clone, set it up as
[docs/git-workflow.md](docs/git-workflow.md) describes.

The app runs at <http://localhost:3000>.

## Scripts

Run from the repository root. Turborepo runs each one in every app and
package.

| Script              | What it does                         |
| ------------------- | ------------------------------------ |
| `bun run dev`       | Starts the app in development mode   |
| `bun run build`     | Builds every app and package         |
| `bun run lint`      | Lints every app and package          |
| `bun run typecheck` | Type-checks every app and package    |
| `bun run format`    | Formats the TypeScript with Prettier |

## Adding UI components

With the shadcn CLI, from the repository root:

```bash
bunx --bun shadcn@latest add button -c apps/web
```

The component lands in `packages/ui/src/components`, and the app imports it
from the `ui` package:

```tsx
import { Button } from "@workspace/ui/components/button"
```

## References

- [AGENTS.md](AGENTS.md): how to work in this repository: the limits on
  Pokémon's names and images, the AI rule, the interface, git, decisions,
  versions and tooling
- [Git workflow](docs/git-workflow.md): a new clone's setup, the checks before
  a commit or push, and recovery

## Credits and disclaimer

Draftboard is an independent, unofficial and non-commercial project. It is
not affiliated with, endorsed or sponsored by Nintendo, Creatures, Game Freak
or The Pokémon Company. Pokémon and Pokémon character names are trademarks of
Nintendo, Creatures and Game Freak; Pokémon images and names © Nintendo,
Creatures, Game Freak and The Pokémon Company.

## License

Draftboard's own code is under the [MIT License](LICENSE). The Pokémon names,
images and data it shows belong to their owners (see
[Credits and disclaimer](#credits-and-disclaimer)).
