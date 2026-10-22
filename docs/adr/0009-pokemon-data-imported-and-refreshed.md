# 9. Pokémon data: imported ahead, refreshed monthly

- Status: Accepted (the owner, 2026-10-22)
- Date: 2026-10-22
- Builds on: [ADR 0006](0006-architecture-and-stack.md), "Pokémon data"

## Context

Spec 002 imports the Pokémon data once from pinned sources (PokéAPI's
`api-data` and sprites, Showdown's names through `@pkmn/dex`, Smogon's
monthly usage), checks it, commits it in `packages/dex/data/`, and builds
the Dex's pages from it. With the import done, the owner asked: shouldn't
each page fetch its Pokémon's details when it loads? Isn't a committed
copy old, static data, nothing live, and is that the enterprise-standard
way?

This record answers that, and settles how the copy stays current.

### What "this type of project" means

Software holds two kinds of data, and each has its own standard way of
being served:

- **Reference data** changes rarely and is the same for everyone who reads
  it: a dictionary, a product catalogue, a train timetable, the Pokédex. A
  Pokémon's types, stats, moves and evolutions change only when a new game
  or update comes out, a few times a year; Smogon's usage changes once a
  month. The standard way to serve it is to build pages from a checked copy
  ahead of time and refresh the copy on a schedule: Next.js calls this
  prerendering, which "happens at build time or during revalidation and the
  result is cached" (the bundled docs, `04-linking-and-navigating.md`).
- **Live data** changes by the second and differs per person: a bank
  balance, a chat, a draft room. It's served from a database on each
  request, or pushed as it changes.

The Dex is reference data. The Leagues (drafts, picks, scores, standings)
are live data, and come from Coachlore's own database when specs 006 and
on build them; nothing here changes that.

PokéAPI is itself a copy: volunteers update it after each game's release.
Fetching it on every page load wouldn't make the data newer, only slower
and dependent on another site.

## Decision

| Item                             | Before (checked 2026-10-22)              | What the sources say (quoted)                                                                                                                                                                                                                                                                                                                                                                         | Decision                                                                                                                                                                                                                                                                                      |
| -------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Where the Dex's data comes from  | Imported and committed (spec 002)        | PokéAPI: "Locally cache resources whenever you request them" ([docs](https://pokeapi.co/docs/v2)); Next.js: prerendering "happens at build time or during revalidation and the result is cached" (bundled docs)                                                                                                                                                                                       | Kept: the import, its checks and the committed copy; pages are prerendered from it. No page calls PokéAPI or Smogon                                                                                                                                                                           |
| How often to look for newer data | By hand only                             | Smogon publishes its usage once a month ([stats](https://www.smogon.com/stats/))                                                                                                                                                                                                                                                                                                                      | Monthly, on the 16th: Smogon's last month has then been out over two weeks, so the newest pin at least two weeks old (AGENTS.md, "Versions") is always reachable. Quiet months cost nothing: with nothing newer, nothing happens                                                              |
| What runs the check              | –                                        | GitHub: "At the start of each workflow job, GitHub automatically creates a unique `GITHUB_TOKEN`", which "expires when the job finishes"; "The `schedule` event can be delayed during periods of high loads" ([events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows), [token](https://docs.github.com/en/actions/concepts/security/github_token)) | A GitHub Actions scheduled workflow (cron syntax), [`.github/workflows/data-freshness.yml`](../../.github/workflows/data-freshness.yml), with a manual "Run workflow" too. It runs where the code is, needs no secret of ours, and its token can open issues and nothing else (`permissions`) |
| What the check does              | –                                        | docs/git-workflow.md: "No bot pull requests"; "Dependency updates are the owner's own commits"                                                                                                                                                                                                                                                                                                        | It never commits. When a newer pin exists, it opens an issue (or updates the open one) with a table of what's newer and the command to run; `packages/dex/scripts/update-pins.ts --check` writes the text                                                                                     |
| How a refresh is done            | Three commands in packages/dex/README.md | –                                                                                                                                                                                                                                                                                                                                                                                                     | `bun run data:refresh` (new pins, the import, the images), then the usual flow: the import's change summary and the diff reviewed, the checks, one commit of `sources.json`, `data/` and the images, a pull request                                                                           |

`@pkmn/dex` and `@pkmn/data` are dependencies, not pins in `sources.json`:
they're updated like any dependency, by the owner.

## Alternatives considered

- **Fetch from PokéAPI when a page loads.** Every page waits on another
  site and breaks when it's slow or down; it goes against PokéAPI's own
  request to cache; the offline Dex (spec 003) becomes impossible; data
  mistakes reach visitors unchecked (spec 002's hand-checked forms and
  Showdown check run on the import); each visit is a server call on
  Vercel's free plan. It isn't fresher either: PokéAPI changes when its
  volunteers update it.
- **Fetch at build time, with no committed copy.** Builds need the network
  and change whenever the source does, unreviewed; a refresh is no longer a
  diff anyone reads.
- **Our own database for the Dex.** A server and a database to run for data
  that changes a few times a year; the Dex would stop being static pages.
- **A bot pull request each month.** Fully automatic, but against the
  owner's rules: commits carry the owner's identity alone, and CI's "Commit
  identity" job fails any other.
- **Where the schedule runs:**
  - **Vercel Cron Jobs:** on the Hobby plan, "once per day" at most with
    "Per-hour (±59 min)" precision
    ([usage](https://vercel.com/docs/cron-jobs/usage-and-pricing)); it
    calls a function in the deployed app, so the site would carry a
    maintenance route and a GitHub token as a secret.
  - **A scheduled job in our Node.js backend** (the owner's question):
    ADR 0006 plans `apps/server` with pg-boss, which has "retries, cron,
    deduplication keys", for the long-running work. That's the right home
    for jobs that change the **live database**: a Discord post, a weekly
    digest, a league's reminders. This job's output is different: it's a
    change to the **repository** (`sources.json`, `data/`, the images),
    which must go through review and CI as a commit; ADR 0006 already says
    so ("refreshing it is a commit like a dependency update, audited by the
    owner"). From the backend it would need a GitHub token and a git
    identity stored on the server, a 520 MB download and an image step on
    the small free VM beside the draft room (ADR 0006 moves jobs to their
    own process "when job work is seen to slow the draft room"), and it
    would stop whenever the server is down. The server also doesn't exist
    until spec 006. The rule this follows: a job that changes data the app
    serves live runs in the backend; a job that changes what the app is
    built from runs in CI.
  - **A scheduled task on a computer:** runs only when that computer is on,
    and keeps a token on it.
  - **GitHub Actions** (chosen) needs none of these: no server, no stored
    token, its runs and logs beside the code.
- **Every four months instead of monthly.** Fewer reminders, but the
  competitive usage would lag up to four months behind Smogon's.

## Consequences

- The Dex stays fast (prerendered pages), free to host, offline-capable,
  and checked before anyone sees a change.
- A refresh is the owner's few minutes: the issue says what's newer, one
  command does the work, and the checks and review are the usual ones.
- The scheduled run may start late on the 16th; nothing depends on the
  hour.
- "In a public repository, scheduled workflows are automatically disabled
  when no repository activity has occurred in 60 days" (GitHub's events
  docs). After a long pause, re-enable it in the repository's Actions tab,
  or run it by hand.
- The issue is opened with `GITHUB_TOKEN`, so it comes from
  `github-actions[bot]`; it's a reminder, not a change, so the
  one-identity rule for commits is untouched.

## Sources

- PokéAPI, [documentation](https://pokeapi.co/docs/v2), fair use.
- Next.js 16.4.1's bundled docs, `01-app/01-getting-started/04-linking-and-navigating.md`.
- GitHub, [Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows), "schedule".
- GitHub, [`GITHUB_TOKEN`](https://docs.github.com/en/actions/concepts/security/github_token).
- Vercel, [Usage and pricing for cron jobs](https://vercel.com/docs/cron-jobs/usage-and-pricing).
- Smogon University, [usage statistics](https://www.smogon.com/stats/).
- [docs/git-workflow.md](../git-workflow.md), "Rules" and "Attribution".
