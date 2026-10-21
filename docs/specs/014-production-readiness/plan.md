# 014: Production readiness, plan

## Builds on

- Every earlier spec: their acceptance tests are criteria 1–10's proof.
- [ADR 0006](../../adr/0006-architecture-and-stack.md): Fastify, the
  web app's proxy to the server and its secret (spec 006), Socket.IO, pg-boss, Coolify, Sentry,
  pino; k6 for the draft room's load.
- The `security-and-hardening` skill for the review (AGENTS.md, "Skills").

## Packages and files

```text
apps/server/src/plugins/
  limits.ts             @fastify/rate-limit, keys and limits
  origin-guard.ts       006's guard, extended: the visitor's IP, the exemptions
  headers.ts            HSTS, nosniff, no banner
apps/server/src/routes/admin-jobs.ts     owner-only failed jobs, retry
apps/server/test/permissions.test.ts     the route × role matrix, with cross-league IDs
apps/server/test/data-coverage.test.ts   every table: exporter and anonymiser, or marked as holding nothing personal
apps/web/e2e/a11y-all.spec.ts            every page, state, width, theme
apps/web/e2e/notice-crawl.spec.ts        notice and credits on every page
apps/web/e2e/interactions.spec.ts        INP-style timings, CPU ×4
load/draft-room.k6.js                    k6, Socket.IO over k6/websockets
load/README.md                           how to run it against a server
.github/workflows/uptime.yml             scheduled health check
docs/runbooks/restore.md                 the restore drill, with timings
docs/runbooks/move-host.md               moving the server to another VM
docs/specs/014-production-readiness/review.md   the OWASP review, the manual a11y pass, the launch checklist
```

## Data model

None: this spec adds no table.

## API

None: it adds limits and checks to the routes earlier specs built.

## Events

None.

## Jobs

None of its own: failed jobs from specs 011 and 013 are reported
([Failed jobs](#failed-jobs)).

## Limits

- [`@fastify/rate-limit`](https://github.com/fastify/fastify-rate-limit)
  ("A low overhead rate limiter for your routes") with its in-memory store:
  one server needs nothing shared (ADR 0006).
- Key: the person's internal ID when the session is valid, else the
  visitor's IP. Limits per route group: default 120/min per IP; `/api/auth/*`
  20/hour per IP; changes (`POST`, `PATCH`, `DELETE`) 30/min per person;
  `/api/v1/ai/*` 10/min per person.
- Body limits: Fastify's `bodyLimit` 64 KB globally; 16 KB on team import
  and replay routes.
- The visitor's IP: spec 006's proxy (`app/api/[...path]/route.ts`) sends
  Vercel's `x-real-ip` on as `x-coachlore-client-ip`. `origin-guard.ts`
  trusts it only when the request carries the `x-coachlore-origin` secret
  (`ORIGIN_SECRET`, set on both hosts), and refuses `/api/*` requests
  without it with 403. The Socket.IO handshake, Discord's interactions
  endpoint (spec 011) and `GET /api/v1/health` (spec 006) come straight to
  the server and are exempt; the first two authenticate with the ticket
  and Discord's signature.
- WebSocket messages: spec 008 owns the Socket.IO handshake's exemption
  from the origin guard and the limit of 60 messages a minute per
  connection (and on `sync`); this spec's limit tests check them.
- Replays: `fetchReplay` (spec 009) builds
  `https://replay.pokemonshowdown.com/<id>.json` from an ID matching
  `^[a-z0-9]+-\d+(-[a-z0-9]+)?$`; anything else is refused before any
  request.

## Headers and CSP

- Server: `Strict-Transport-Security: max-age=31536000` (no `preload`),
  which "informs browsers that the host should only be accessed using
  HTTPS" ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security));
  `X-Content-Type-Options: nosniff`; Fastify sends no `X-Powered-By`.
- Web: the CSP is checked, not changed: `connect-src` is `'self'` plus
  the server's address (spec 008); error reports use Sentry's tunnel on our
  own address (spec 000); `img-src` adds Discord's avatar host, and
  signed-in pages carry spec 006's per-response nonce.
  A test reads the production CSP and fails on anything else, and checks
  that every page sends exactly one CSP header (the static one in
  `next.config.ts` excludes the routes spec 006's proxy covers); the
  socket under the nonce policy is spec 008's test, run here, not redone. Check the web app's own HSTS header in
  production, and add it in `next.config.ts` if the host doesn't send it.

## Failed jobs

- A pg-boss `failed` event handler reports each failed job to Sentry with
  its queue, ID and error, and no payload.
- `GET /api/v1/admin/jobs?state=failed` and `POST
/api/v1/admin/jobs/:id/retry`, allowed only for the owner's user ID
  (`OWNER_USER_ID`).

## Privacy

- `/legal` is written from requirement 2.1 as a Server Component page with
  sections and an "On this page" list (spec 001).
- Sentry: spec 000's no-personal-data settings; a `beforeSend` removes
  request headers, cookies, query strings and user data; `user` is never
  set.
- pino: a redaction list (`req.headers.cookie`, `req.headers.authorization`,
  `x-real-ip`, `x-forwarded-for`, `*.discordId`, `*.question`, `*.replayId`).
- Criterion 18 is checked by searching the test league's Sentry events and
  the server's logs for the test accounts' Discord IDs and names.

## Security review

`review.md` records, for each OWASP Top 10 category ("a standard awareness
document for developers and web application security",
[OWASP Top 10](https://owasp.org/www-project-top-ten/)): what applies, how
it's handled, the test that shows it, and anything open. At least:

| Area                        | Where it's handled                                                                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Broken access control       | Every route's role check; the permission matrix test                                                                                                                                       |
| Cryptographic failures      | HTTPS everywhere; HSTS; secure, `httpOnly`, `SameSite` cookies (spec 006)                                                                                                                  |
| Injection                   | Drizzle's parameterised queries; Zod on every input; prompt data sections (spec 012)                                                                                                       |
| Insecure design             | The draft's server-side state machine and constraints (spec 008)                                                                                                                           |
| Security misconfiguration   | Headers; Coolify's dashboard not on the open internet, with two-factor sign-in, SSH by key only, the security list open on 22, 80 and 443 (spec 006); PostgreSQL not exposed beyond the VM |
| Vulnerable components       | `bun audit` in CI; the release-age rule                                                                                                                                                    |
| Identification and auth     | The sign-in library's `state`, PKCE and origin checks; sign-in rate limit                                                                                                                  |
| Data integrity              | Discord's signature check on interactions; the proxy's secret                                                                                                                              |
| Logging and monitoring      | Sentry, pino, failed jobs listed                                                                                                                                                           |
| Server-side request forgery | Replays fetched only from Showdown's host by ID                                                                                                                                            |

The `security-and-hardening` skill is run over the server and the web app,
and its findings are added to the review.

## Accessibility

- `a11y-all.spec.ts` builds its list from the screen inventory (a typed
  list in `apps/web/e2e/routes.ts`), visits each route and each fixture
  state, at 360 and 1280 px, in light and dark, under `/en` and `/hi`, and
  runs axe with the WCAG 2.2 A and AA tags.
- `rtl.spec.ts` visits the same list with `dir="rtl"` forced on `<html>`
  and saves a screenshot of each for the right-to-left review in
  `review.md`; the lint check for `left`/`right` utilities (spec 001) runs
  in CI.
- `dictionaries.test.ts`: every key in `en.json` exists in `hi.json` and
  the reverse; `e2e/raw-keys.spec.ts` crawls the Hindi pages for a raw
  key.
- The Hindi review in `review.md`: each screen read in Hindi by the owner,
  with what changed.
- The manual pass in `review.md`: NVDA with Firefox on Windows, VoiceOver
  on an iPhone, TalkBack on Android; keyboard only; 200 % zoom; 320 px
  reflow; reduced motion; Windows contrast themes. Each screen named in
  requirement 4.2 gets a row with what was tried and what was found.

## Speed

- Lighthouse (mobile profile) on `/`, `/dex`, `/dex/garchomp` and `/types`,
  under `/en` and `/hi`, against the production build: "LCP should occur within 2.5 seconds of
  when the page first starts loading" and "pages should maintain a CLS of
  0.1" ([web.dev](https://web.dev/articles/vitals)). Recorded in
  `review.md`.
- Interactions: Lighthouse's lab run doesn't measure INP, so
  `interactions.spec.ts` uses Playwright with the CPU slowed four times
  (Chrome DevTools Protocol) and the `web-vitals` library's INP reporting
  on opening the filters, choosing a type and switching a form; each must
  be at most 200 ms ("INP of 200 milliseconds or less",
  [web.dev](https://web.dev/articles/vitals)).

## The draft room's load

- `load/draft-room.k6.js` uses `k6/websockets` ("This module implements the
  browser WebSocket API with additional k6-specific functionalities",
  [k6](https://grafana.com/docs/k6/latest/javascript-api/k6-websockets/))
  and speaks Socket.IO's packets over it (Engine.IO's `40` connect,
  `42[...]` events, `2`/`3` ping and pong).
- Setup: a test league with 16 coaches and a draft, created through the
  API with test sessions and tickets; 100 watcher connections.
- Each turn, all 16 coaches send a pick for the same form at the same
  instant; the script records when each `pick.made` event reaches each
  connection.
- Thresholds, "the pass/fail criteria that you define for your test
  metrics" ([k6](https://grafana.com/docs/k6/latest/using-k6/thresholds/)):
  `pick_delivery{p(95)} < 1000` ms, zero `pick_conflicts`, zero duplicate
  forms and zero over-budget rosters in the final state (checked by a
  query after the run).
- Run from the owner's machine against the production-shaped server (a
  staging copy on the VM, or production before the league is created),
  never against a league in use.

## Backups and the host

- Coolify's scheduled PostgreSQL backups, daily: "Each backup schedule
  creates a backup on the database's server, and can upload a copy to an
  S3-compatible storage provider" ([Coolify](https://coolify.io/docs/databases/backups)).
  The copy goes to object storage outside the VM (Oracle's Object Storage
  in the same free account, through its S3-compatible API).
- `docs/runbooks/restore.md`: download the latest backup, restore it into
  a new database, run the integrity checks (row counts per table; one
  league's picks against its rosters), apply the current migrations, start
  a server against it and call its health address, record the time taken.
- `docs/runbooks/move-host.md`: a new VM, Coolify, restore, the DuckDNS
  name pointed at the new address, `ORIGIN_SECRET` and the other secrets
  set, the Discord interactions endpoint checked.
- The idle rule: in `review.md`, the VM's 7-day CPU, network and memory
  from Oracle's monitoring, against the 20 % thresholds in ADR 0006.

## The forwarding's latency

With the web app's functions in the region nearest the VM (spec 006), 100
`GET /api/v1/health` requests through `https://coachlore.vercel.app/api/v1/health`
and 100 straight to the server; the median and 95th percentile of each,
and the difference, are recorded in `review.md`. If the difference makes
screens feel slow, the region choice is revisited first.

## Uptime

- `.github/workflows/uptime.yml` runs every 5 minutes ("The shortest
  interval you can run scheduled workflows is once every 5 minutes",
  [GitHub](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows))
  and requests the server's `GET /api/v1/health` (spec 006); a failed run emails the owner
  through GitHub's own notifications. No extra account.
- GitHub warns: "In a public repository, scheduled workflows are
  automatically disabled when no repository activity has occurred in 60
  days." The launch checklist includes checking it's enabled.

## Tests

| Acceptance criterion | Test or record                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1–10                 | The earlier specs' tests named in the spec's table; all pass in one CI run                                 |
| 11                   | `test/limits.test.ts`: per IP, per person, the secret, `Retry-After`                                       |
| 12                   | `season/replay-fetch.test.ts` additions (spec 009): other hosts and bad IDs refused, no request made       |
| 13                   | `test/permissions.test.ts`: generated from the route table, every role                                     |
| 14                   | `load/draft-room.k6.js`, three runs recorded in `review.md`                                                |
| 15                   | Lighthouse results and `e2e/interactions.spec.ts`, recorded in `review.md`                                 |
| 16                   | `e2e/a11y-all.spec.ts`; the manual pass in `review.md`                                                     |
| 17                   | `e2e/notice-crawl.spec.ts`                                                                                 |
| 18                   | The search described under "Privacy", recorded in `review.md`                                              |
| 19                   | `docs/runbooks/restore.md` run once, timing recorded; backups visible in object storage                    |
| 20                   | The OWASP review in `review.md`                                                                            |
| 21                   | `/legal` reviewed by the owner                                                                             |
| 22                   | The launch checklist in `review.md`, ticked                                                                |
| 23                   | `test/data-coverage.test.ts`: reads the schema's tables and the registry; fails on any table with neither  |
| 24                   | `docs/runbooks/restore.md` run: migrations applied and health answered, recorded                           |
| 25                   | The latency run under "The forwarding's latency", recorded in `review.md`                                  |
| 26                   | The owner's screenshot of the setting in `review.md`                                                       |
| 27                   | `e2e/rtl.spec.ts` screenshots and the right-to-left review in `review.md`; the Hindi review in `review.md` |
| 28                   | `dictionaries.test.ts` and `e2e/raw-keys.spec.ts`                                                          |
| 29                   | `e2e/csp.spec.ts`: one CSP header on every page; spec 008's `e2e/draft-csp.spec.ts` in the same run        |

## The launch checklist

In `review.md`, ticked by the owner:

- [ ] Every criterion above passes or is recorded.
- [ ] Both dictionaries complete: every key in English and in Hindi, and
      the Hindi read in its screens.
- [ ] Secrets set on both hosts and listed in `.env.example`; none in the
      repository (`git grep` for each one's prefix).
- [ ] Backups running; a restore rehearsed.
- [ ] The uptime workflow enabled and has run.
- [ ] Private vulnerability reporting turned on (the repository's
      Settings, Security).
- [ ] The Discord application's redirect and interactions addresses point
      at production.
- [ ] The AI provider's key set, the global budget set below its free
      limits, and `/legal` naming it.
- [ ] A test league drafted and played end to end on two phones and a
      desktop, then deleted.
- [ ] The first league's admin told what the bot posts and what the AI
      features send, and how to turn them off.

## Decisions

| Item             | What the docs say (quoted)                                     | Decision                                                                      |
| ---------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Rate-limit store | One server (ADR 0006)                                          | In memory; PostgreSQL or Redis when there's a second server                   |
| Uptime monitor   | GitHub's scheduled workflows: every 5 minutes at most often    | A scheduled workflow, so there's no new account                               |
| Measuring INP    | Lighthouse's lab run has no INP; web.dev's threshold is 200 ms | Playwright with the CPU slowed and `web-vitals`' INP on the main interactions |

## Tasks

1. **Origin guard and limits.** `origin-guard.ts`, `limits.ts`, body
   limits, the 429 state in the web app. Done when criterion 11 passes.
2. **Headers and the CSP check.** Done when the headers are present in
   production, the CSP test passes, and the draft room and Sentry work
   under the CSP: criterion 29.
3. **Replay fetch hardening.** Done when criterion 12 passes.
4. **The permission matrix and data coverage.** Cross-league IDs in the
   matrix; `data-coverage.test.ts`. Done when criteria 13 and 23 pass for
   every route and table.
5. **Failed jobs.** The Sentry handler, `OWNER_USER_ID` added to the
   server's `env.ts` and `.env.example`, and the owner's routes. Done when a
   job made to fail appears in Sentry and can be retried.
6. **Privacy.** Sentry and pino redaction; `/legal` written. Done when
   criteria 18 and 21 pass.
7. **Accessibility and languages.** `routes.ts`, `a11y-all.spec.ts`
   in both languages, `notice-crawl.spec.ts`, `rtl.spec.ts`,
   `dictionaries.test.ts`, `raw-keys.spec.ts`, the manual pass, the
   right-to-left and Hindi reviews. Done when criteria 16, 17, 27 and 28
   pass.
8. **Speed.** Lighthouse runs and `interactions.spec.ts`. Done when
   criterion 15 passes; any page that fails is fixed in its own spec's
   code before this task closes.
9. **The load test.** `load/draft-room.k6.js` and its README. Done when
   criterion 14 passes three times.
10. **Backups, restore and the host.** Coolify schedule, object storage,
    the runbooks, the idle check, the latency run. Done when criteria 19,
    24 and 25 pass.
11. **Uptime.** The workflow. Done when it has run and a forced failure
    emailed the owner.
12. **The security review.** `review.md`, the skill's run. Done when
    criterion 20 passes.
13. **Owner: private vulnerability reporting.** Turned on in the
    repository's settings before the first deploy. Done when criterion 26
    is recorded.
14. **Launch.** The checklist. Done when the owner has ticked it.
