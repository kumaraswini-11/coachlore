<div align="center">

# Coachlore

**A fast, mobile-first Pokédex and a home for Pokémon draft leagues, from the live draft to the final standings.**

<!-- Badges: only what the repository uses today, in the Stack table's order. Each takes its brand's colour (Simple Icons; React's from react.dev); where shields' white text on it would read under 3:1, the badge is black and the logo carries the colour. -->

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-23272F?style=for-the-badge&logo=react&logoColor=58C4DC)](https://react.dev)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)](https://ui.shadcn.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-000000?style=for-the-badge&logo=tailwindcss&logoColor=06B6D4)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![Turborepo](https://img.shields.io/badge/Turborepo-FF1E56?style=for-the-badge&logo=turborepo&logoColor=white)](https://turborepo.dev)

[Why](#why) · [Features](#features) · [Highlights](#highlights) · [Stack](#stack) · [How it’s built](#how-its-built) · [Getting started](#getting-started) · [Docs](#documentation) · [Contributing](#contributing-and-security) · [Credits](#credits-and-disclaimer) · [License](#license)

</div>

> [!NOTE]
> **Early days:** the plan is complete, spec by spec, and the build is
> starting. Everything below is planned unless the Stack table says "today".

## Why

Pokémon draft leagues run on spreadsheets and Discord: a sheet of tiers and
points, a sheet of rosters, and a draft held one message at a time, with
someone checking by eye that nobody took a Pokémon twice. Coachlore is that
league's home, with the fastest, calmest Pokédex beside it.

The name joins the league's **coaches** and their **lore**: everything they
know about every Pokémon, and everything their league has lived through.

## Features

**The Dex**, open to everyone, no sign-in: search and filters (or plain
words), a page for every Pokémon and form, the type chart, a team checker
you share by link, and it works offline.

**Leagues**, signed in with Discord: create a league, a points-based tier
list, a **live draft room**, a schedule with results read from Showdown
replays, trades, standings, stats, and a Discord bot that posts it all.

**In English and Hindi**, and built for more, right-to-left languages included.

**AI that shows its work**: plain-language search, an assistant that shows
its lookups, draft suggestions, match recaps and a weekly digest, all
checked against the data and all optional.

## Highlights

- **Fair under pressure**: every pick decided by the server in a
  transaction; the database refuses a Pokémon taken twice; reconnecting
  catches up from the server.
- **State machines**: the draft, a match's result and a trade, every
  transition stated and tested.
- **Reliable jobs**: saved with the change they belong to and retried
  safely; a retried Discord post appears once.
- **Real input, real rules**: Showdown battle logs parsed into scores and
  KOs, checked against real replays.
- **AI with guardrails**: structured output, a grounding check on every
  name and number, an evaluation, a daily allowance, and nothing breaks
  with the AI off.
- **Built for phones**: designed at 360 px first, WCAG 2.2 AA, an offline
  Dex, Core Web Vitals measured on a mid-range phone.

## Stack

| Layer   | Tools                                                                                                                                                                                                                                                           |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web     | **Today:** [Next.js](https://nextjs.org) 16, React 19, [shadcn/ui](https://ui.shadcn.com) on [Base UI](https://base-ui.com), [Tailwind CSS](https://tailwindcss.com) 4                                                                                          |
| Tooling | **Today:** TypeScript, ESLint, Prettier, [Bun](https://bun.sh) workspaces, [Turborepo](https://turborepo.dev), GitHub Actions                                                                                                                                   |
| Server  | [Fastify](https://fastify.dev), [Socket.IO](https://github.com/socketio/socket.io), [PostgreSQL](https://www.postgresql.org) with [Drizzle](https://orm.drizzle.team), [pg-boss](https://github.com/timgit/pg-boss), [Better Auth](https://www.better-auth.com) |
| Core    | Framework-agnostic TypeScript packages: the Pokémon data model, the league rules, the battle-log parser                                                                                                                                                         |
| AI      | The [AI SDK](https://ai-sdk.dev) behind one interface, so the provider can change                                                                                                                                                                               |
| Quality | [Vitest](https://vitest.dev), [Playwright](https://playwright.dev) with axe, [Testcontainers](https://testcontainers.com), [k6](https://k6.io), [Sentry](https://sentry.io)                                                                                     |
| Hosting | $0: [Vercel](https://vercel.com) for the web app; an Oracle Cloud Always Free VM with [Coolify](https://coolify.io) for the server and database                                                                                                                 |

Proposed in [ADR 0006](docs/adr/0006-architecture-and-stack.md); each piece
is added only when the first spec that needs it is built.

## How it's built

Agile and iterative, in small increments of working software: each
[spec](docs/specs/README.md) is a slice with its own acceptance criteria,
built in small tasks, each checked by CI, reviewed and committed before the
next. Decisions are recorded as [ADRs](docs/adr/), screens are reviewed on a
desktop and a phone before they meet real data, and the specs change as we
learn. No deadlines: scope flexes, quality doesn't.

## Getting started

Needs [Bun](https://bun.sh) (the version in `package.json`'s
`packageManager`) and [Node.js](https://nodejs.org) 24.

```bash
git clone https://github.com/kumaraswini-11/coachlore.git
cd coachlore
bun install
bun run dev        # http://localhost:3000
```

`bun run lint`, `typecheck`, `test`, `build` and `format:check` are the checks CI
runs on every pull request. Before your first commit, set up the clone as
[docs/git-workflow.md](docs/git-workflow.md) describes.

## Documentation

[Project doc](docs/project-doc.md) (the why) ·
[Specs](docs/specs/README.md) (the what, in build order) ·
[Decisions](docs/adr/) · [Glossary](GLOSSARY.md) ·
[AGENTS.md](AGENTS.md) (how to work here)

## Contributing and security

Questions and ideas are welcome as
[issues](https://github.com/kumaraswini-11/coachlore/issues). It's a personal
project, so pull requests aren't accepted. For a security problem, see
[SECURITY.md](SECURITY.md), never a public issue.

## Credits and disclaimer

Coachlore is an independent, unofficial, non-commercial fan project, not
affiliated with, endorsed or sponsored by Nintendo, Creatures, Game Freak or
The Pokémon Company. Pokémon and Pokémon character names are trademarks of
Nintendo, Creatures and Game Freak; Pokémon images and names © Nintendo,
Creatures, Game Freak and The Pokémon Company. Data from
[PokéAPI](https://pokeapi.co) and
[Pokémon Showdown](https://github.com/smogon/pokemon-showdown); usage
statistics from [Smogon](https://www.smogon.com/stats/).

## License

[MIT](LICENSE) for Coachlore's own code. The Pokémon names, images and data
it shows belong to their owners.
