# 014: Production readiness

| Status  | Owner             | Written    |
| ------- | ----------------- | ---------- |
| Written | Aswini Kumar Sahu | 2026-10-21 |

## Goal

Before the first real league runs a season on Coachlore, everything the
project doc says must be true is shown to be true by a check that runs,
and the things that go wrong in public (abuse, leaks, slowness, lost data,
inaccessible screens) are limited, measured and rehearsed.

## Where this comes from

The [project doc](../../project-doc.md): "What has to be true before this
ships", "Privacy, security and running it" ("Collect as little as
possible", "Failures are seen before users report them", "It costs nothing
to run while it's small"), "Scope" ("Running in public: limits per user …
error reports that carry no personal data, security headers, and speed and
accessibility measured rather than assumed"). AGENTS.md: WCAG 2.2 AA and
Core Web Vitals' "good" thresholds on a mid-range phone. Hosting risks:
[ADR 0006](../../adr/0006-architecture-and-stack.md), "Hosting".

## Requirements

### 1. Limits

1. Every server route has a request limit per visitor (by IP address)
   and, when signed in, per person. Defaults: 120 requests a minute per IP;
   20 sign-in attempts an hour per IP; 30 changes a minute per person;
   AI routes as spec 012 says, plus 10 a minute per person.
2. A request over a limit gets status 429 with a `Retry-After` header and
   a plain message; the interface shows "Too many requests. Try again in a
   minute."
3. Request bodies are capped (64 KB; a team import or replay list at most
   16 KB of text) and refused above that before they're parsed.
4. The visitor's IP address is taken from the header the web app's host
   adds only when the request carries the proxy's secret; anything else
   is refused (ADR 0006).
5. Replays are fetched only from Showdown's replay host, by an address the
   server builds from the replay's ID, never from a URL as given.

### 2. Privacy

1. `/legal` is complete:
   - **The notice:** not affiliated with Nintendo, Creatures, Game Freak
     or The Pokémon Company; names and images belong to them.
   - **Credits and licences** of the data and images (PokéAPI, Pokémon
     Showdown's data, Smogon's usage statistics, the sprites).
   - **What we keep:** nothing about Dex visitors; the theme and shortcut
     settings in the visitor's own browser; for people who sign in, their
     Discord ID, name and avatar, a session cookie, their leagues' data,
     the replays and battle logs reported in their leagues, and AI runs
     (their content for 90 days, the counts after).
   - **Who else handles data:** the web host, the server host, Discord
     (sign-in and the bot), the AI provider (named, with what it keeps and
     whether it trains on requests, and what each AI feature sends), and
     the error reporter (no personal data).
   - **Deleting:** how to delete an account (`/me`) and what deleting
     removes and keeps (spec 006); how a league is deleted (spec 007);
     that deleted data leaves the backups within 14 days (spec 006).
   - **Contact:** the repository's issues.
2. Error reports and logs carry no personal data: no Discord IDs, names,
   IP addresses, session cookies, replay addresses or question text.
3. Analytics: none in v1.
4. **Every table is covered by export and deletion.** Each table either has
   an exporter and an anonymiser registered (spec 006's registry, extended
   by each later spec) or is marked as holding nothing about a person; a
   test fails for any table that's neither.

### 3. Security

1. A review against the OWASP Top 10, with each category's finding and
   what was done, recorded in this spec's plan before launch.
2. Every route's permission check is tested: for each route, a signed-out
   visitor, a non-member, a viewer, a coach and an admin, each getting what
   the spec allows and nothing more. It includes IDs from another league:
   a member, match, season or trade ID that belongs to a different league
   than the address's is refused as not found, even for an admin of the
   address's league.
3. Secrets are only in the hosts' environment settings, never in the
   repository or a log; each is listed in `.env.example` without its
   value.
4. Dependencies: no known high or critical advisory without a recorded
   reason (the CI audit, ADR 0002).
5. Headers on the server's address: `Strict-Transport-Security`,
   `X-Content-Type-Options: nosniff`, and no framework banner. The web
   app's content security policy allows only what earlier specs added (the
   server's real-time address, spec 008; Discord's avatar host and the
   per-response nonce on signed-in pages, spec 006), checked by a test.
6. Failed jobs are reported to the error reporter and listed for the
   owner, with a way to retry one.
7. Private vulnerability reporting is turned on for the repository before
   the first deploy, so `SECURITY.md`'s instructions work.

### 4. Accessibility

1. Every page in spec 001's screen inventory passes an automated WCAG 2.2
   AA check, at 360 and 1280 px, in both themes and both languages (English
   and Hindi, [ADR 0007](../../adr/0007-languages-and-right-to-left.md)),
   with every state its fixtures show.
2. A manual pass, recorded in the plan: keyboard only, a screen reader on
   a phone and on a desktop, 200 % zoom and 320 px reflow, reduced motion,
   and Windows' contrast themes, on the Dex browse, a Pokémon page, the
   team check, the draft room and a match, in English and in Hindi.
3. **Ready for right-to-left:** every screen is reviewed with `dir="rtl"`
   set: nothing overlaps or is cut off, "back" and "next" point the right
   way, and no style uses `left` or `right` (the lint check passes).
4. **The Hindi words are right:** every Hindi string is read by the owner
   (or someone fluent they ask) in its screen, not only in the dictionary.

### 5. Speed

1. On a mid-range phone profile, the Dex's pages (home, browse, a Pokémon,
   the type chart), in both languages, meet Core Web Vitals' "good"
   thresholds in the lab (the Hindi pages load their extra font):
   largest contentful paint within 2.5 seconds and layout shift of 0.1 or
   less; and their main interactions (opening the filters, choosing a
   type, switching a form) respond within 200 milliseconds.
2. The draft room under load: 16 coaches and 100 watchers in one room,
   every coach trying to pick at the same instant, every turn: no form
   taken twice, no coach over budget, and each pick reaching every
   connection within 1 second at the 95th percentile.

### 6. Running it

1. The database is backed up daily to storage off the VM, and a restore is
   rehearsed: the latest backup restored into an empty database, checked,
   migrated to the current version, and the server run against it, with the
   time it took recorded.
2. The VM's use is checked against the host's idle rule (ADR 0006), and
   the steps to move to another host are written as a runbook.
3. Uptime: the server's health address is checked from outside every few
   minutes by a free monitor, which emails the owner.
4. The time the web app's forwarding to the server adds is measured and
   recorded, with the web app's functions in the region nearest the VM
   (spec 006).

### 7. Before the first league

A launch checklist, run by the owner, in the plan: the project doc's
"What has to be true before this ships", this spec's criteria, the
accounts and secrets in place, both dictionaries complete, a test league
drafted end to end on phones, and the league's admin told what the AI and
the bot send.

## Rules and edge cases

- **Limits never block a draft pick** from a coach on the clock: the room's
  events go over the WebSocket and are limited per connection (60 messages
  a minute), not per IP, so a league in one house isn't throttled.
- **Shared IPs** (a school, a mobile carrier) hit the per-IP limit first;
  signed-in people are limited per person, which is higher.
- **A restore** never overwrites the live database; it goes into a new one.

## Screens

- `/legal` completed (spec 001's wireframe).
- A "Too many requests" state, from spec 001's error state.
- No new screens for the owner: failed jobs are listed by an owner-only
  API route and in the error reporter.

## Acceptance criteria

The project doc's "What has to be true before this ships", each with the
check that proves it:

| #   | Must be true                                                                                     | Proved by                                                             |
| --- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| 1   | Ten Pokémon checked by hand, forms included, match the Dex                                       | Spec 002's hand-checked test cases                                    |
| 2   | Many coaches picking at once: no Pokémon twice, no coach over budget                             | Spec 008's concurrency test, and this spec's load test (criterion 14) |
| 3   | A coach who reconnects sees exactly the server's state                                           | Spec 008's reconnection test                                          |
| 4   | Five real replays parse to the score and KOs a person counts, ambiguous cases by the stated rule | Spec 009's replay test cases                                          |
| 5   | No AI answer names a Pokémon, move or ability that isn't in the data                             | Spec 012's grounding tests and evaluation                             |
| 6   | The assistant shows its lookups first; no lookups, no answer                                     | Spec 012's Ask tests                                                  |
| 7   | With the AI off, every page works                                                                | Spec 012's AI-off suite                                               |
| 8   | A Discord post retried after a failure appears once                                              | Spec 011's retry test                                                 |
| 9   | Core Web Vitals "good" on a mid-range phone; WCAG 2.2 AA on every page                           | Criteria 15 and 16                                                    |
| 10  | Every page carries the notice and credits                                                        | Criterion 17                                                          |

And this spec's own:

11. Each limit returns 429 with `Retry-After` when exceeded; the per-person
    limit applies when signed in; a request without the proxy's secret is
    refused.
12. A replay address on any other host, or an ID that doesn't match
    Showdown's pattern, is refused without a request.
13. The permission matrix test covers every route and every role, and IDs
    from another league, and passes.
14. The load test meets requirement 5.2 three times in a row against the
    production-shaped server.
15. Lighthouse's mobile profile on the four Dex pages meets the LCP and CLS
    thresholds, and the interaction test measures each main interaction
    within 200 ms with the CPU slowed four times.
16. The automated accessibility run passes on every page and state; the
    manual pass is recorded with no open failures.
17. A crawl of every page in the screen inventory finds the notice and the
    credits links on each.
18. A search of error reports and logs from the test league finds no
    Discord ID, name, IP address or cookie.
19. A backup restore is rehearsed and recorded; daily backups appear off
    the VM.
20. The OWASP review is recorded with no open high-risk finding.
21. `/legal` has every part in requirement 2.1, reviewed by the owner.
22. The launch checklist is complete.
23. The table-coverage test (requirement 2.4) passes.
24. A restored backup migrates to the current version and the server runs
    against it.
25. The forwarding's added time is recorded: the median and 95th
    percentile of 100 health requests through the web app, against 100 made
    directly.
26. Private vulnerability reporting is on.
27. The right-to-left review (requirement 4.3) is recorded with no open
    failures, and the Hindi review (4.4) is recorded by the owner.
28. Every dictionary key exists in both languages, and no Hindi page shows
    a raw key, or English words outside Pokémon data and what people
    wrote.
29. Every page sends exactly one Content-Security-Policy header; signed-in
    pages carry a per-response nonce (spec 006), and the draft room's
    socket connects under it (spec 008).

## Out of scope

- Analytics and usage tracking.
- A status page.
- Paid monitoring, paid hosting, a domain (the owner, 2026-10-21).
- Load beyond one VM.

## Changes

- 2026-10-21: written.
- 2026-10-21: both languages in the accessibility and speed checks, a right-to-left review, the Hindi review and complete dictionaries (ADR 0007).
- 2026-10-21: audit: cross-league IDs in the permission matrix, every table covered by export and deletion, the restored backup migrated, the forwarding's latency measured, private vulnerability reporting, backups in `/legal`.
- 2026-10-21: final audit: one CSP header per page, and the socket under the nonce policy, checked.
