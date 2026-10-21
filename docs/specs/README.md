# Specs

What Coachlore v1 is, split into specs in the order they're built. The
[project doc](../project-doc.md) says why; the specs say what; each spec's
plan says how. Words mean what [the glossary](../../GLOSSARY.md) says; the
stack is [ADR 0006](../adr/0006-architecture-and-stack.md).

Every spec and plan is written before building starts, so anyone can pick
up the next spec and build it from these documents alone.

## How a spec works

Each spec is a folder, `docs/specs/NNN-name/`, with two files:

| File      | Holds                                                                                                                                                                                                                   |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spec.md` | What and why: the requirements, the rules and edge cases, the screens, and the acceptance criteria. It names no framework, library or vendor, except the interface's components, which AGENTS.md already fixes.         |
| `plan.md` | How this repository builds it: the packages and files, the data model, the API and events, the jobs, the tests that prove each acceptance criterion, any new decision (as a table with sources), and the ordered tasks. |

- **Tasks** are in `plan.md`, in order, each small enough to review in one
  sitting and each with "done when". A task is checked, committed, then
  the next begins. Specs are built in groups, one branch and pull request
  per group, and the owner audits at the group's checkpoints (AGENTS.md,
  "Work loop").
- **Done** means every acceptance criterion in `spec.md` passes, shown by a
  test or a check that runs, not by a claim. Then the spec's row below is
  marked done.
- **No time estimates.** Nothing is planned in weeks or days. The order of
  the specs is the plan; a spec that grows shrinks back to its acceptance
  criteria, and quality doesn't move (the project doc, "Appetite").
- **A spec may change** while it's being built. The change goes in the
  spec's text with a line under its "Changes", so the spec always describes
  what's built.
- **Open questions** from the project doc are answered in the spec that
  needs them, then moved into the project doc's text.

## How a screen is built

Screens are designed without design tools or design accounts:

1. **Wireframe.** The screen's text wireframes, at 360 px and at 1024 px,
   are in [spec 001](001-interface/spec.md), with its components, states and
   accessibility notes.
2. **The screen on its route,** built with the real components and its
   real data; the app has no fixture or test pages
   ([ADR 0010](../adr/0010-only-real-routes.md)). Each state it has
   (empty, error and the rest) is reached and tested on that route.
3. **Owner's review** on a desktop browser and on a phone, over the local
   network (`next dev` listens on the machine's address;
   `allowedDevOrigins` lists it, from `DEV_ORIGINS` in `.env.local`).
   Changes go back into step 2.

The owner runs `/interface-review` before a screen is done (AGENTS.md,
"Skills").

## Conventions every spec and plan follows

So that specs written separately fit together.

**`spec.md` sections:** a header table (status, owner, written), Goal,
Where this comes from (the project doc's sections), Requirements
(numbered), Rules and edge cases, Screens (pointing to spec 001's
wireframes, adding detail), Acceptance criteria (numbered, each testable),
Out of scope, Changes.

**`plan.md` sections:** Builds on (the specs and ADR 0006 pieces it needs),
Packages and files, Data model, API, Events, Jobs, Tests (which test proves
which acceptance criterion), Decisions (only new ones, as a table with
sources), Tasks (ordered, each with "done when").

**Languages** ([ADR 0007](../adr/0007-languages-and-right-to-left.md)).

- Every route is served under the language, `/en/…` and `/hi/…`; specs
  write routes without the prefix.
- No text is written into a component: every string comes from the
  dictionaries, with a key in both; Pokémon, form, move and ability names
  stay English in every language.
- Styles use logical properties (`ms`, `me`, `ps`, `pe`, `inset-s`, `inset-e`,
  `text-start`), never `left` or `right`, so a right-to-left language
  works later; every screen is also checked with `dir="rtl"`.
- Dates, times and numbers are formatted with `Intl` in the page's
  language and the viewer's (or the league's) time zone.

**Packages.** `packages/db` is the only package that knows the database
and its driver; `packages/auth` the only one that knows the sign-in
library. The server and the scripts import them; nothing else imports
Drizzle, the PostgreSQL driver or Better Auth directly.

**Names.**

- Pokémon are keyed by PokéAPI's species name (`rotom`); forms by
  PokéAPI's Pokémon name (`rotom-wash`); the default form's key equals its
  Pokémon's in most cases, and the data says which form is the default.
  Routes: `/dex/rotom` (the default form), `/dex/rotom/wash` (the form key
  without its Pokémon's prefix).
- Moves, abilities, types and games use PokéAPI's names (`thunderbolt`,
  `levitate`, `electric`, `scarlet-violet`).
- A league's address uses its slug (`/l/kanto-cup`); a coach's uses their
  member ID; a match's its ID.
- Database tables are plural `snake_case`; IDs are UUIDs generated by
  PostgreSQL; times are `timestamptz` in UTC, shown in the viewer's time
  zone.

**The server's API.**

- JSON over HTTPS under `/api/v1/`. The browser reaches it only through the
  web app's own `/api/*` route, which forwards each request to the server
  with a secret header (ADR 0006, "Hosting"; spec 006); server-rendered
  pages call it the same way, forwarding the session cookie.
- Sign-in is at `/api/auth/*` (the sign-in library's own routes).
- Request and response shapes are Zod schemas in `packages/contracts`,
  shared by the web app and the server, created by spec 006.
- Errors are problem details ([RFC 9457](https://www.rfc-editor.org/rfc/rfc9457)):
  `type`, `title`, `status`, `detail`, and `errors` for field errors.
- Changes are `POST`, `PATCH` and `DELETE`, checked for the session and the
  member's role on the server, whatever the interface allowed.
- Roles: `league_members.role` is `coach` or `viewer`, and
  `league_members.is_admin` marks an admin, who may also coach (spec 007).
- The forwarding route sends the secret in `x-coachlore-origin` and the
  visitor's address in `x-coachlore-client-ip`; the server trusts neither
  header from anyone else (specs 006 and 014).

**Real-time.** One Socket.IO namespace, `/draft`, one room per draft.
Every event carries the draft's sequence number; a client that misses one
asks for the state from its last number. Connections authenticate with a
short-lived ticket from `POST /api/v1/realtime/ticket`, not the cookie.

**Jobs.** pg-boss queues named `domain.action` (`discord.post`,
`ai.recap`, `ai.digest`). A job that changes the outside world is sent
in the same transaction as the change it belongs to, carries an
idempotency key, and checks whether its effect already happened before
acting.

**Tests.**

- Packages: Vitest, next to the code (`*.test.ts`).
- Server: Vitest with a real PostgreSQL from Testcontainers, per test file.
- Screens: Playwright with axe in `packages/playwright-web/e2e/`, at 360 px and 1280 px,
  in both themes, against the app's real routes (ADR 0010).
- Every acceptance criterion names the test that proves it.

**Screens.** Every screen has the states in spec 001, its own title and
description (`apps/web/README.md`), and passes WCAG 2.2 AA with axe and by
keyboard.

## Defaults for the owner's calls

The specs are written with these defaults, so they can be built as they
stand. The owner can change any of them; the spec named changes with it.

| Call                             | Default in the specs                                                                                                                                             | Spec     |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Where PostgreSQL runs            | On the VM, next to the server; Neon by changing `DATABASE_URL` if chosen                                                                                         | 006      |
| A domain                         | None (the owner, 2026-10-21): `coachlore.vercel.app` and a free DuckDNS name for the server                                                                      | 000, 006 |
| The AI provider                  | Groq's free tier, behind the AI SDK, changeable by configuration                                                                                                 | 012      |
| Oracle's account                 | The free account; move to Hetzner if the VM is reclaimed                                                                                                         | 006      |
| Official images                  | A small sprite per form in lists, one artwork on a form's page; PokéAPI's sprites, self-hosted and credited                                                      | 002, 003 |
| Games and formats                | The Dex covers every Pokémon and game in the data; leagues play Generation 9 draft formats on Showdown, singles or doubles; a season lists the formats it allows | 002, 007 |
| A KO no move caused              | Direct and passive KOs counted separately; a passive KO goes to the Pokémon whose effect caused it, when the log names it; a forfeit credits no KOs              | 009      |
| Public league pages              | No: leagues are private to their members                                                                                                                         | 007      |
| Playoffs                         | Not in v1                                                                                                                                                        | 009      |
| How long league data is kept     | Until an admin deletes the league; a deleted account shows as "A former coach"                                                                                   | 006, 009 |
| AI features without signing in   | Not available: the allowance is per person; the Dex works fully without them                                                                                     | 012      |
| Editing shadcn's component files | Edited where the design needs it, as AGENTS.md says                                                                                                              | 001      |

## The specs, in build order

| #   | Spec                                                     | Goal                                                                                                                                   | Routes and screens it owns                                                                                                      | Status  |
| --- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 000 | [Platform](000-platform/spec.md)                         | The web app deploys on every merge to `main`, with a preview for every pull request, secrets kept out of the code, and errors reported | none                                                                                                                            | Done    |
| 001 | [Interface](001-interface/spec.md)                       | The design system, the app shell and every state, so each later screen is assembled, not designed from scratch                         | the app shell, the search palette (empty), `/about`, `/legal`, not found, `/offline`                                            | Written |
| 002 | [Pokémon data](002-pokemon-data/spec.md)                 | Our own Pokémon dataset, Pokémon and forms modelled correctly, imported from public sources and refreshable                            | none                                                                                                                            | Written |
| 003 | [Dex browse](003-dex-browse/spec.md)                     | Find any Pokémon fast on a phone, online or off                                                                                        | `/`, `/dex`, `/games/[game]`; the search palette's Dex results; the offline Dex                                                 | Written |
| 004 | [Pokémon pages](004-pokemon-pages/spec.md)               | Everything about one Pokémon, form, type, move or ability                                                                              | `/dex/[pokemon]`, `/dex/[pokemon]/[form]`, `/types`, `/moves`, `/moves/[move]`, `/abilities/[ability]`                          | Written |
| 005 | [Team check](005-team-check/spec.md)                     | A team of six's weaknesses and coverage, instantly, shareable by link                                                                  | `/team-check`                                                                                                                   | Written |
| 006 | [Accounts](006-accounts/spec.md)                         | Sign in with Discord; see and delete what we hold                                                                                      | `/sign-in`, `/me`                                                                                                               | Written |
| 007 | [Leagues](007-leagues/spec.md)                           | Create a league, invite members, set roles, rules and the tier list                                                                    | `/leagues`, `/leagues/new`, `/join/[invitation]`, `/l/[league]`, `/l/[league]/tiers`, `/l/[league]/settings`                    | Written |
| 008 | [Draft room](008-draft-room/spec.md)                     | A live, fair draft that survives disconnections                                                                                        | `/l/[league]/draft`, `/l/[league]/rosters`, `/l/[league]/rosters/[coach]`                                                       | Written |
| 009 | [Season](009-season/spec.md)                             | The schedule, results read from replays and confirmed by both coaches, standings and stats                                             | `/l/[league]/schedule`, `/l/[league]/matches/[match]`, `/l/[league]/stats`; standings on `/l/[league]`                          | Written |
| 010 | [Trades](010-trades/spec.md)                             | Coaches trade forms, with points checked and an admin's approval if the league asks                                                    | `/l/[league]/trades`                                                                                                            | Written |
| 011 | [Discord bot](011-discord-bot/spec.md)                   | Picks, results, trades and reminders posted to the league channel, once each                                                           | the Discord section of `/l/[league]/settings`                                                                                   | Written |
| 012 | [AI assistant](012-ai-assistant/spec.md)                 | Plain-language search and an assistant that shows its lookups, held to the data by the grounding check                                 | `/ask`; plain-language search on `/dex`, `/moves` and the palette; explanations on `/team-check`; the AI allowance on `/me`     | Written |
| 013 | [AI for leagues](013-ai-for-leagues/spec.md)             | Suggestions in the draft room, match recaps and the weekly digest, switchable per league                                               | parts of `/l/[league]/draft`, `/l/[league]/matches/[match]`, `/l/[league]`, `/l/[league]/trades`, `/l/[league]/rosters/[coach]` | Written |
| 014 | [Production readiness](014-production-readiness/spec.md) | Limits, privacy, security, accessibility and speed measured before the first real league                                               | `/legal` completed                                                                                                              | Written |

**Why this order:** the interface comes first so every screen after it is
assembled from the same parts. The Dex comes before Leagues because tier
lists, rosters and battle logs all stand on the Pokémon data. The server,
database and sign-in arrive with accounts (006), the first spec that needs
them, not before. The AI comes last because every feature works without
it.

**Ready to show:** after 009, a league can draft live and play a season
with standings: the project's main claim, demonstrable end to end. 010 to
014 complete v1.

**Later, out of v1:** `/compare` (two to four Pokémon side by side) and
`/calc` (a damage calculator).
