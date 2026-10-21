# 009: Season, plan

## Builds on

- Specs 001 (the screens), 002 (forms and the Showdown name table in
  `packages/dex`), 006 (the server, sessions through `packages/auth`, tables through
  `packages/db`, contracts), 007 (leagues,
  members, seasons with their formats and time zone, `db:seed`) and 008
  (`roster_entries`, the season moving to in season). No job queue: replays
  are read while the coach waits, and auto-confirming is a sweep.
- [ADR 0006](../../adr/0006-architecture-and-stack.md): `packages/battle-log`
  is created here, on `@pkmn/protocol`.

## Packages and files

| Where                                                     | What                                                                                              |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `packages/battle-log/src/parse.ts`                        | `parseBattle(log, { formFor })`: a battle log in, a `BattleResult` out. No framework, no network. |
| `packages/battle-log/src/credit.ts`                       | The KO rules: who caused each faint, and whether it's direct, passive or no one's.                |
| `packages/battle-log/src/replay-id.ts`                    | `parseReplayLink(text)`: the replay ID and its password, or why it isn't a replay link.           |
| `packages/battle-log/fixtures/`                           | The six replays' logs and `expected.json`, the counts a person made by watching them (task 2).    |
| `packages/league/src/schedule.ts`                         | `roundRobin(memberIds, weeks)`: the circle method, byes for odd counts.                           |
| `packages/league/src/standings.ts`                        | `standings(matches)`: records, differentials and places by the spec's rule 19.                    |
| `apps/server/src/season/`                                 | Schedule, reports, confirmations, settling, standings and stats: services and routes.             |
| `apps/server/src/season/replay-fetch.ts`                  | `fetchReplay({ id, password })`: one guarded request to Showdown's replay server (below).         |
| `apps/server/src/season/auto-confirm.ts`                  | The sweep that confirms undisputed reports whose time has come.                                   |
| `apps/server/src/season/personal-data.ts`                 | Registers this spec's exporter and anonymiser with spec 006.                                      |
| `packages/db/src/schema/season.ts`                        | The tables below; their migration in `packages/db/drizzle/`.                                      |
| `packages/db/src/seed/season.ts`                          | Adds a played week to 007's `db:seed` demo league.                                                |
| `packages/contracts/src/season.ts`                        | Request and response schemas.                                                                     |
| `apps/web/app/[lang]/l/[league]/schedule/page.tsx`        | Schedule.                                                                                         |
| `apps/web/app/[lang]/l/[league]/matches/[match]/page.tsx` | A match, reporting and confirming.                                                                |
| `apps/web/app/[lang]/l/[league]/stats/page.tsx`           | Stats.                                                                                            |
| `apps/web/app/[lang]/l/[league]/rosters/[coach]/page.tsx` | 008's roster page, with the record and each form's battles, KOs and faints.                       |
| `apps/web/components/season/`                             | `StandingsTable`, `MatchCard`, `ReportForm` (`"use client"`), `BattleBreakdown`, `Leaderboard`.   |
| `apps/web/fixtures/season/`                               | Fixtures for every state of each screen.                                                          |

`parseBattle` reads lines with `@pkmn/protocol`, which "converts Pokémon
Showdown's text protocols into typed object representations"
([pkmn/ps](https://github.com/pkmn/ps/tree/main/protocol)); the counting is
ours. `@pkmn/client` isn't used: it tracks far more than a result needs.

**Languages** ([ADR 0007](../../adr/0007-languages-and-right-to-left.md)):
every string on these screens comes from the web app's dictionaries
(`en.json`, `hi.json`), with a key in both, under this spec's section;
Pokémon, form, move and ability names stay English; times use spec 001's
`formatTime` (`Intl`, the viewer's time zone with the league's beside
it); styles use logical properties, and the screens' end-to-end tests also
run with `dir="rtl"`. A replay that can't be read, a format warning and every other error are dictionary strings; week edges and "Auto-confirms on …" use the league's time zone, shown with the viewer's.

## Data model

Uses 007's `league_members.showdown_name`, `leagues.time_zone` and
`seasons.allowed_format_ids` (`gen9draft` or `gen96v6doublesdraft` by
default, plus any an admin adds); a replay whose `formatid` isn't in the
list carries a warning.

| Table                  | Columns                                                                                                                                                                                                                                                                                                                     | Constraints                                                        |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `weeks`                | `id`, `season_id`, `number`, `starts_at`, `ends_at`, `completed_at` (null until every match is confirmed or a bye; set in the confirming transaction)                                                                                                                                                                       | unique (`season_id`, `number`)                                     |
| `matches`              | `id`, `season_id`, `week_id`, `coach_a_id`, `coach_b_id` (null for a bye), `status` (upcoming, reported, confirmed, disputed, bye), `winner_id`, `wins_a`, `wins_b`, `left_a`, `left_b`, `by_hand` (bool), `needs_admin` (bool: a warning only an admin may accept), `auto_confirm_at` (timestamptz, null), `version` (int) | unique (`week_id`, `coach_a_id`); unique (`week_id`, `coach_b_id`) |
| `match_reports`        | `id`, `match_id`, `reported_by`, `status` (ready, failed, submitted, superseded), `replay_ids` (text[]), `result` (jsonb: the battles as read), `warnings` (jsonb), `errors` (jsonb), `created_at`                                                                                                                          | one `submitted` per match                                          |
| `replays`              | `id` (the replay ID without its password; Showdown's IDs are unique across the site), `password` (text, null; a secret), `format_id`, `players` (text[]), `uploaded_at`, `log` (text), `fetched_at`                                                                                                                         | primary key (`id`)                                                 |
| `battles`              | `id`, `league_id`, `match_id`, `number`, `replay_id` (references `replays`), `winner_id`, `ended_by` (faints, forfeit, timeout, tie, by_hand), `left_a`, `left_b`, `warnings` (jsonb)                                                                                                                                       | unique (`match_id`, `number`); unique (`league_id`, `replay_id`)   |
| `battle_pokemon_stats` | `battle_id`, `member_id`, `form_key`, `brought`, `fainted`, `direct_kos`, `passive_kos`                                                                                                                                                                                                                                     | primary key (`battle_id`, `member_id`, `form_key`)                 |
| `result_confirmations` | `id`, `match_id`, `action` (reported, confirmed, disputed, settled, corrected, entered_by_hand), `user_id`, `reason`, `before` (jsonb), `after` (jsonb), `created_at`                                                                                                                                                       | –                                                                  |

- `battles` and `battle_pokemon_stats` are written when a report is
  submitted; the match's totals when it's confirmed. A correction replaces
  them inside one transaction and bumps `matches.version`.
- Standings and stats are computed on read from confirmed matches by
  `packages/league` (a league has at most a few hundred battles); a cache
  can come later if a page is slow.
- `replays.password` is never selected for a response to a non-member and
  is redacted from logs by the logger's redaction paths. A replay's log is
  shown only to members of a league whose battle uses it.
- `auto_confirm_at` is set when a report is submitted: the end of its week
  in the league's time zone, plus 48 hours (or 48 hours from the report,
  if that's later). A dispute clears it.

## API

All under `/api/v1/leagues/:slug/`, signed in, members only. Every child
ID (a week, a match, a member) is looked up with the slug's `league_id`
in the same query, so an ID from another league is a 404.

| Method and path                     | Who                             | Does                                                                                                                                                                     |
| ----------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PUT members/me/showdown-name`      | the member                      | `{ name }`                                                                                                                                                               |
| `POST schedule`                     | admins, draft complete          | `{ firstWeekStartsOn }`: generates weeks and matches                                                                                                                     |
| `PATCH weeks/:number`               | admins, before its first report | `{ startsAt?, pairs? }`                                                                                                                                                  |
| `GET schedule`                      | members                         | Weeks and matches                                                                                                                                                        |
| `GET matches/:id`                   | members                         | The match, its battles, stats, report and history                                                                                                                        |
| `POST matches/:id/report`           | its coaches                     | `{ replayLinks }`: checks links, fetches the replays not yet stored (up to three at once), reads them; 200 with the report: ready (battles, warnings) or failed (errors) |
| `GET matches/:id/report`            | its coaches, admins             | The latest report                                                                                                                                                        |
| `POST matches/:id/report/submit`    | the reporter                    | Ready, no errors: the match becomes reported                                                                                                                             |
| `POST matches/:id/by-hand`          | its coaches, admins             | `{ battles: [{ winner, leftA, leftB, kos? }] }`                                                                                                                          |
| `POST matches/:id/confirm`          | the other coach, or an admin    | The match becomes confirmed; when `needs_admin`, an admin only                                                                                                           |
| `POST matches/:id/dispute`          | the other coach                 | `{ reason }`                                                                                                                                                             |
| `POST matches/:id/settle`           | admins                          | `{ action: confirm or correct, battles?, reason }`                                                                                                                       |
| `POST season/end`                   | admins                          | Ends the season                                                                                                                                                          |
| `GET standings`, `GET stats?board=` | members                         | `board`: `kos`, `faints`, `used`, `records`                                                                                                                              |
| `GET rosters/:memberId`             | members                         | 008's roster, with the record and each form's battles, KOs and faints                                                                                                    |

Every change carries `matches.version`; a stale version gets 409, so two
admins settling at once can't both win.

## Events

None in real time: a match page reads on load. Spec 011 posts results to
Discord from these changes, and spec 013 adds its recap and digest jobs to
the confirming transactions.

## Jobs

None. A report reads at most three small replays, so it does it while the
coach waits; a queue would add a status, polling and a retry policy for no
gain.

**Fetching a replay** (`fetchReplay({ id, password })`): `GET
<base>/<id>.json`, or `<base>/<id>-<password>.json` for a private replay,
where the base is `https://replay.pokemonshowdown.com` (configuration, so
tests point it at a stub) and the ID and password come only from
`parseReplayLink`, never from the pasted text; the password travels with
the ID to this one request and is never logged (the request's address is
redacted in logs and error reports); `redirect: "error"`; a 10-second timeout and one retry; the
body read up to 2 MB and refused beyond; refused unless the content type is
JSON and the JSON has a `log`. A replay already stored is never fetched
again.

**Auto-confirming:** every 5 minutes and when the server starts, the server
confirms each reported, undisputed match whose `auto_confirm_at` has
passed and that doesn't need an admin, each in its own transaction with the
match's `version`, recording it in `result_confirmations` as confirmed
automatically. Running it twice does nothing the second time.

Showdown's own docs: "Most PS APIs that you would want to access
programmatically are available by adding `.json` to the URL", and "Replay
logs and inputlogs are also available in the JSON"
([WEB-API](https://github.com/smogon/pokemon-showdown-client/blob/master/WEB-API.md)).
A replay already stored is never fetched again.

## Reading the log

From Showdown's [protocol](https://github.com/smogon/pokemon-showdown/blob/master/sim/SIM-PROTOCOL.md),
the lines that matter and what `parseBattle` does with them:

| Line                                                          | Protocol says                                                                                  | We                                                                                              |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `\|player\|`, `\|poke\|`                                      | the players; team preview                                                                      | Players' names; how many each side brought                                                      |
| `\|switch\|`, `\|drag\|`, `\|detailschange\|`                 | details start with the species                                                                 | Map side and nickname to a form (`formFor`); in-battle form changes keep the entry form         |
| `\|replace\|`                                                 | "Illusion has ended … everything you thought you knew about the previous Pokémon is now wrong" | Reassign every event since that switch-in to the revealed Pokémon                               |
| `\|move\|`                                                    | –                                                                                              | Remember the user and target, for direct damage and for statuses, hazards and weather it starts |
| `\|-damage\|`                                                 | tags "such as `\|[from] EFFECT\|[of] SOURCE`"                                                  | Record the damage's source by rule 15 of the spec                                               |
| `\|-status\|`, `\|-sidestart\|`, `\|-weather\|`, `\|-start\|` | –                                                                                              | Remember who inflicted, set or started it                                                       |
| `\|-activate\|` Destiny Bond; `\|-start\|` perish0            | –                                                                                              | The Destiny Bond or Perish Song user takes the KO                                               |
| `\|faint\|`                                                   | "The Pokémon `POKEMON` has fainted."                                                           | Count the faint; credit the KO from its last recorded source                                    |
| `\|-message\|` "… forfeited." or "… lost due to inactivity."  | –                                                                                              | `ended_by` forfeit or timeout; that side counts zero left                                       |
| `\|win\|`, `\|tie`                                            | "`USER` has won the battle."; "The battle has ended in a tie."                                 | The winner, or a tie                                                                            |

A name `formFor` can't map stops the parse with that name; the parser
never guesses.

## Fixtures

Five public Generation 9 replays, chosen for their cases (checked on
2026-10-21; their logs are saved into `packages/battle-log/fixtures/` by a
script, so tests never use the network):

| Replay                                                                                      | Why                                  |
| ------------------------------------------------------------------------------------------- | ------------------------------------ |
| [gen9ou-2701874557](https://replay.pokemonshowdown.com/gen9ou-2701874557)                   | A full singles battle, Stealth Rock  |
| [gen9ou-2701874838](https://replay.pokemonshowdown.com/gen9ou-2701874838)                   | Destiny Bond, entry hazards          |
| [gen9nationaldex-2701879318](https://replay.pokemonshowdown.com/gen9nationaldex-2701879318) | Illusion (Zoroark), Destiny Bond     |
| [gen9ou-2701878872](https://replay.pokemonshowdown.com/gen9ou-2701878872)                   | A forfeit, poison and burn           |
| [gen9doublesou-2701869904](https://replay.pokemonshowdown.com/gen9doublesou-2701869904)     | Doubles, hazards, recoil, Leech Seed |

And one more for rule 13: [gen9ou-2701876505](https://replay.pokemonshowdown.com/gen9ou-2701876505),
a loss on time with no faints.

## Tests

| Criterion | Test                                                                                                                                                                                                                                    |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1         | `packages/league/src/schedule.test.ts`: 2–24 coaches; every pair once per round robin; one bye a week when odd; repeats and truncation                                                                                                  |
| 2         | `packages/battle-log/src/fixtures.test.ts`: each fixture's result equals `fixtures/expected.json`                                                                                                                                       |
| 3         | `packages/battle-log/src/credit.test.ts` and `parse.test.ts`: one excerpt per rule (direct, each passive source, no one's, Illusion, form change, doubles, forfeit, timeout, tie, unknown name)                                         |
| 4         | `apps/server/src/season/report.test.ts`, against a stub Showdown serving fixture JSON: wrong players and an unknown Pokémon refused; a format outside the season's list (the fixtures' own formats) gives the warning and `needs_admin` |
| 5         | `apps/server/src/season/replay-fetch.test.ts`: the stub counts requests; a reused replay is refused; a redirect, a 3 MB answer and a non-JSON answer are refused                                                                        |
| 6         | `apps/server/src/season/results.test.ts`: reported, confirmed, disputed, settled, by hand; standings count only confirmed                                                                                                               |
| 7         | `packages/league/src/standings.test.ts`: each tiebreak step and shared places                                                                                                                                                           |
| 8         | `apps/server/src/season/privacy.test.ts`: the logger's output and a non-member's responses never contain the password                                                                                                                   |
| 9         | `packages/playwright-web/e2e/season.spec.ts`: schedule, match (every status), stats and league home; axe, keyboard, both themes, 360 and 1280 px                                                                                        |
| 10        | `apps/server/src/season/auto-confirm.test.ts`: a report in a league whose time zone is far from UTC confirms at its week's end plus 48 hours, not before; a disputed or `needs_admin` one doesn't; an admin's confirm works             |
| 11        | `apps/server/src/season/scope.test.ts`: match and member IDs from another league give 404; `personal-data.test.ts`: export and anonymisation of reports, confirmations and the Showdown name                                            |
| 12        | `e2e/season-languages.spec.ts`: the schedule and a match in `/hi`, with week dates and "Auto-confirms on …" in the viewer's and the league's zones; the same screens with `dir="rtl"`                                                   |

## Decisions

| Item                 | Options                                               | Decision and why                                                                                                                                                 |
| -------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reading the protocol | Our own line reader; `@pkmn/protocol`; `@pkmn/client` | `@pkmn/protocol` (MIT) for lines and their tags; our own counting; `@pkmn/client` tracks more than needed                                                        |
| Reading replays      | A job with polling; while the coach waits             | While the coach waits: at most three small files, so no status, polling or queue                                                                                 |
| A replay's key       | Per league; Showdown's ID alone                       | Showdown's ID alone: unique across the site, so `battles` can reference it; `battles` holds the league for "once per league"                                     |
| A wrong format       | Refuse; warn                                          | Warn, with an admin's confirmation: leagues play custom challenges too                                                                                           |
| Auto-confirming      | A scheduled job; a sweep in the server                | A sweep every 5 minutes: no queue needed before spec 011, and idempotent                                                                                         |
| Standings            | Stored; computed on read                              | Computed on read from confirmed matches: always consistent after a correction                                                                                    |
| Scheduling           | Random pairs; round robin                             | Round robin by the [circle method](https://en.wikipedia.org/wiki/Round-robin_tournament), "a simple algorithm to create a schedule for a round-robin tournament" |

## Tasks

1. **Replay links.** `parseReplayLink` with tests (the spec's rule 1).
   Done when its tests pass.
2. **Fixtures.** A script saves the six logs; a person watches each replay
   on Showdown and writes the score, Pokémon left, KOs (direct and
   passive) and faints into `expected.json`, with who counted and when.
   Done when the file is committed and reviewed by the owner.
3. **The parser.** `parseBattle` and `credit.ts`. Done when criteria 2
   and 3 pass.
4. **Schedule and standings.** `schedule.ts`, `standings.ts`. Done when
   criteria 1 and 7 pass.
5. **Tables.** The schema, the new columns, the migration. Done when it
   runs on 008's database.
6. **Reports and replays.** Link checks, `fetchReplay`, the report and its
   checks, submit, with child IDs scoped by league. Done when criteria 4, 5
   and 8 pass.
7. **Confirming.** Confirm (the other coach or an admin), dispute, settle,
   by hand, auto-confirm, end the season, with the history. Done when
   criteria 6 and 10 pass.
8. **Personal data and seed.** The exporter and anonymiser; a played week
   in `db:seed`. Done when criterion 11 passes and the seeded league shows
   standings.
9. **Fixture screens.** Schedule, a match in every status, reporting with
   warnings and errors, stats, league home's standings, a coach's stats,
   the Showdown username field, at 360 and 1024 px. Done when the owner
   has reviewed them on a desktop and a phone.
10. **Real data.** The pages on the API. Done when criterion 9 passes.
11. **Project doc.** Move the three answered open questions into its text,
    as the spec says. Done when the owner has read the change.
12. **Review.** The owner's `/interface-review`; the spec's row marked
    done.
