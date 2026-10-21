# 008: Draft room, plan

## Builds on

- Specs 001 (shell, states, the draft room's wireframes), 002 (forms),
  006 (the server, sessions through `packages/auth`, tables through
  `packages/db`, `packages/contracts`, the realtime ticket) and
  007 (leagues, members, seasons, tier lists).
- [ADR 0006](../../adr/0006-architecture-and-stack.md): Socket.IO with the
  in-memory adapter is added here, the first spec that needs it. No job
  queue: a turn's deadline is kept by an in-memory timer and a sweep on
  start, so pg-boss arrives with spec 011.

## Packages and files

| Where                                                     | What                                                                                                                                                                                                                                                                                                                          |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/league/src/draft/turns.ts`                      | `turnSequence(order, type, rosterSize)`, `regularTurnCount`, the member for a turn number. Pure.                                                                                                                                                                                                                              |
| `packages/league/src/draft/budget.ts`                     | `canAfford({ budget, spent, cost, slotsLeftAfter, cheapestTier })`. Pure.                                                                                                                                                                                                                                                     |
| `packages/league/src/draft/auto-pick.ts`                  | `chooseAutoPick(wishlist, pool, canAfford)`: the first allowed wishlist form, or none. Pure.                                                                                                                                                                                                                                  |
| `packages/db/src/schema/draft.ts`                         | The tables below; their migration in `packages/db/drizzle/`.                                                                                                                                                                                                                                                                  |
| `apps/server/src/draft/service.ts`                        | Start, order, pick, expire turn, pause, resume, undo: each one transaction.                                                                                                                                                                                                                                                   |
| `apps/server/src/draft/timers.ts`                         | In-memory timers for live drafts, rebuilt from stored deadlines on start (the sweep).                                                                                                                                                                                                                                         |
| `apps/server/src/draft/personal-data.ts`                  | Registers this spec's exporter and anonymiser with spec 006: wishlists, and picks' `made_by_user_id`.                                                                                                                                                                                                                         |
| `apps/server/src/draft/routes.ts`                         | The HTTP API below.                                                                                                                                                                                                                                                                                                           |
| `apps/server/src/realtime/draft.ts`                       | The `/draft` Socket.IO namespace.                                                                                                                                                                                                                                                                                             |
| `packages/contracts/src/draft.ts`                         | Request, response and event schemas.                                                                                                                                                                                                                                                                                          |
| `apps/web/app/[lang]/l/[league]/draft/page.tsx`           | Server Component: loads the snapshot, renders the room.                                                                                                                                                                                                                                                                       |
| `apps/web/app/[lang]/l/[league]/rosters/page.tsx`         | The rosters index: every coach, points used and left.                                                                                                                                                                                                                                                                         |
| `apps/web/app/[lang]/l/[league]/rosters/[coach]/page.tsx` | The roster page, with a link to the team check built from the roster.                                                                                                                                                                                                                                                         |
| `apps/web/components/draft/`                              | `DraftRoom` (`"use client"`: the state, the socket, the clock offset, the tab title), `Board`, `Pool` (with the wishlist star and filter), `Roster`, `StatusBar`, `Announcer`.                                                                                                                                                |
| `apps/web/proxy.ts`, `apps/web/next.config.ts`            | Extends spec 006's nonce CSP matcher to `/:lang/l/:path*` and adds the server's `https://` and `wss://` origin (from `NEXT_PUBLIC_REALTIME_URL`) to the proxy policy's `connect-src`; the static CSP in `next.config.ts` excludes the routes the proxy covers, so each page sends one CSP header. This spec owns that change. |
| `apps/web/fixtures/draft/`                                | Fixture snapshots for every state.                                                                                                                                                                                                                                                                                            |

**Languages** ([ADR 0007](../../adr/0007-languages-and-right-to-left.md)):
every string on these screens comes from the web app's dictionaries
(`en.json`, `hi.json`), with a key in both, under this spec's section;
Pokémon, form, move and ability names stay English; times use spec 001's
`formatTime` (`Intl`, the viewer's time zone with the league's beside
it); styles use logical properties, and the screens' end-to-end tests also
run with `dir="rtl"`. Announcements (each pick, the turn, the timer at 30 and 10 seconds) are dictionary strings in the page's language.

## Data model

| Table              | Columns                                                                                                                                                                                                                                                        | Constraints                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `drafts`           | `id`, `season_id`, `status` (scheduled, live, paused, complete), `scheduled_at` (timestamptz, null), `current_turn` (int, null before start), `turn_deadline` (timestamptz), `paused_remaining_ms` (int), `last_seq` (bigint, 0), `started_at`, `completed_at` | unique `season_id`                                                                                           |
| `draft_order`      | `draft_id`, `position` (1…n), `member_id`                                                                                                                                                                                                                      | primary key (`draft_id`, `position`); unique (`draft_id`, `member_id`)                                       |
| `draft_turns`      | `draft_id`, `turn_number`, `member_id`, `kind` (regular, makeup), `makeup_of` (turn number), `outcome` (pending, picked, auto, skipped, forfeited)                                                                                                             | primary key (`draft_id`, `turn_number`)                                                                      |
| `picks`            | `id`, `draft_id`, `season_id`, `turn_number`, `member_id`, `form_key`, `points`, `made_by` (coach, auto, admin), `made_by_user_id`, `idempotency_key`, `created_at`                                                                                            | unique (`draft_id`, `turn_number`); unique (`season_id`, `form_key`); unique (`draft_id`, `idempotency_key`) |
| `roster_entries`   | `id`, `season_id`, `member_id`, `form_key`, `points`, `acquired_via` (pick, trade), `pick_id`, `acquired_at`, `released_at`                                                                                                                                    | unique (`season_id`, `form_key`) where `released_at` is null                                                 |
| `wishlist_entries` | `season_id`, `member_id`, `position`, `form_key`                                                                                                                                                                                                               | primary key (`season_id`, `member_id`, `position`); unique (`season_id`, `member_id`, `form_key`)            |
| `draft_events`     | `draft_id`, `seq`, `type`, `data` (jsonb), `actor_user_id`, `created_at`                                                                                                                                                                                       | primary key (`draft_id`, `seq`)                                                                              |

- `draft_turns` holds the regular turns, written at the start from
  `turnSequence`, and make-up turns, appended when a turn is skipped.
  `current_turn` points at the first pending one.
- An undo deletes the pick and its roster entry and sets the turn back to
  pending; the `pick_undone` event keeps the record. That keeps the unique
  constraints simple.
- Trades (spec 010) release a roster entry (`released_at`) and add one
  with `acquired_via = 'trade'`; the partial unique index holds across
  both.
- Points spent = the sum of the member's unreleased `roster_entries`.
- Every comparison with the deadline uses the database's `now()`, one
  clock for every process.
- "Replace coach" (spec 007) changes `draft_order.member_id` and the
  member of every pending `draft_turns` row from the old member to the new
  one, in the same transaction as 007's roster move.

## API

All under `/api/v1/leagues/:slug/`, signed in, members only; errors as
problem details. Every child ID in a path or body (a member, a turn, a
pick) is looked up with the slug's `league_id` in the same query, so an ID
from another league is a 404.

| Method and path               | Who                           | Does                                                                                                     |
| ----------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| `GET draft`                   | members                       | The snapshot: state, order, turns, picks, pool, timer, `seq`, `serverNow`, and the caller's own wishlist |
| `PATCH draft`                 | admins, scheduled             | `{ scheduledAt }`: the planned start, or null                                                            |
| `PUT draft/order`             | admins, scheduled             | `{ memberIds }`: the whole order                                                                         |
| `POST draft/order/shuffle`    | admins, scheduled             | A random order (`crypto.randomInt`), stored and returned                                                 |
| `POST draft/start`            | admins                        | Checks the start conditions; writes the turns; first deadline                                            |
| `POST draft/pause`, `resume`  | admins                        | As the spec's state table                                                                                |
| `POST draft/picks`            | the turn's coach, or an admin | `{ turnNumber, formKey }`, header `Idempotency-Key`; 201 with the pick, or 409 with the reason           |
| `DELETE draft/picks/last`     | admins                        | `{ turnNumber }` of the pick to undo, so two admins can't undo two picks                                 |
| `GET draft/wishlist`, `PUT …` | the coach                     | `{ formKeys }`: the whole ordered list (up to 50)                                                        |
| `GET rosters`                 | members                       | Every coach's points used and left                                                                       |
| `GET rosters/:memberId`       | members                       | The roster: entries, points used and left                                                                |

**The pick, in one transaction:**

1. `SELECT … FROM drafts WHERE id = $1 FOR UPDATE`. PostgreSQL: this
   "prevents them from being locked, modified or deleted by other
   transactions until the current transaction ends"
   ([explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html)),
   so picks in one draft are decided one at a time.
2. Check: live; `turnNumber` is `current_turn`; the caller is that turn's
   coach or an admin; `now() < turn_deadline`; the form is priced, not
   banned and not on a roster; `canAfford`.
3. Insert the pick and the roster entry; mark the turn; advance
   `current_turn` (completing the draft after the last turn); set the next
   deadline; append the event with `seq = last_seq + 1`.
4. Commit, then arm the in-memory timer for the new deadline and broadcast
   the event.

The unique constraints refuse a double pick even if a check above were
wrong ("Unique constraints ensure that the data contained in a column, or a
group of columns, is unique among all the rows in the table",
[constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)).

**Expiring a turn** (`expireTurn(draftId, turnNumber)`): the same lock;
does nothing unless the draft is live, `turnNumber` is current and
`now() >= turn_deadline`; then auto-picks, skips (adding a make-up turn) or
forfeits a make-up turn, as the spec's rules say. Called by the in-memory
timer at the deadline, and by the sweep when the server starts; both can
run for the same turn, and the lock and the checks make the second do
nothing. Pausing, resuming and undoing clear and re-arm the timer.

**The person's live drafts** (`GET /api/v1/me/drafts`, signed in): each
league of theirs with a live draft, its round, and `yourTurn`; `/leagues`
and home use it. **Starting** (`POST draft/start`) takes `confirmNoChannel`:
with a timer of 10 minutes or more and no linked channel (spec 011's
`league_discord`; none exists before it), a start without it is refused
with a problem whose `type` asks the admin to confirm.

## Events

Socket.IO namespace `/draft`. The ticket is single use and lasts 60
seconds (`POST /api/v1/realtime/ticket`, spec 006), so the client passes
`auth` as a function that fetches a fresh ticket on every connection and
reconnection: `auth: (cb) => fetchTicket().then((ticket) => cb({ ticket,
league }))`, as Socket.IO's client accepts. The server checks the ticket
and membership, then joins the socket to the room `draft:<id>`. The client
connects straight to the server at `NEXT_PUBLIC_REALTIME_URL`
(`https://coachlore.duckdns.org`; `http://localhost:4000` locally), not
through the web app's proxy; the server's Socket.IO `cors` allows only the
web app's own addresses. `NEXT_PUBLIC_REALTIME_URL` is set for Production
only, like `SERVER_ORIGIN` (spec 006): a preview build has none, and its
draft room renders fixtures.

- **The origin guard** (spec 006) exempts the Socket.IO path: the ticket is
  its check. This spec adds that exemption.
- **Limits per connection:** at most 60 messages a minute, and one `sync`
  every 2 seconds; over that, the message is dropped and the client is
  told to wait.
- **Membership changes:** when a member is removed, leaves or is replaced
  (spec 007), the server disconnects that user's sockets in the league's
  draft room; `sync` re-checks membership every time.
- **The clock:** every `snapshot` and `event` carries `serverNow`; the
  client keeps `serverNow − Date.now()` as its offset and counts the timer
  down from the deadline with it.

| Direction       | Name       | Data                                                                                                                                                                                                                                                                 |
| --------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| server → client | `snapshot` | The same body as `GET draft`, with `seq` and `serverNow`                                                                                                                                                                                                             |
| server → client | `event`    | `{ seq, type, data, serverNow }`; `type` is one of `order_set`, `scheduled`, `started`, `pick`, `pick_undone`, `turn_skipped`, `turn_forfeited`, `paused`, `resumed`, `completed`, `coach_replaced`; `data` carries the change and the new current turn and deadline |
| client → server | `sync`     | `{ fromSeq }`: the server answers with the events after it, or a `snapshot` if more than 500 are missing                                                                                                                                                             |

- Events are broadcast only after their transaction commits, built from
  the stored row.
- The client applies an event only if its `seq` is the next one; on a gap,
  on reconnect, and when the tab becomes visible again, it sends `sync`.
- Socket.IO's own recovery isn't relied on: its docs say it "**will not
  always be successful**. That's why you will still need to handle the case
  where the states of the client and the server must be synchronized"
  ([connection state recovery](https://github.com/socketio/socket.io-website/blob/main/docs/categories/01-Documentation/connection-state-recovery.md)).
- Wishlists never travel over the socket; each client reads its own over
  HTTP.

## Jobs

None. On start, the server reads every live draft, re-arms its in-memory
timer from `turn_deadline`, and runs `expireTurn` at once for any deadline
that has passed. A queued job would add nothing the sweep doesn't already
cover, and a job keyed by turn would block the new deadline after a pause
or an undo.

## Tests

| Criterion | Test                                                                                                                                                                                                                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1         | `apps/server/src/draft/concurrency.test.ts`: 16 coaches, every turn submitted by every coach at once (overlapping forms, the same idempotency key resent), a full draft, repeated 20 times; then SQL checks: no form twice, no budget broken, one pick per turn                                         |
| 2         | `packages/league/src/draft/turns.test.ts`: every turn for 2–24 coaches, both types, with make-up turns appended                                                                                                                                                                                         |
| 3         | `packages/league/src/draft/budget.test.ts`: allowed and refused at the exact boundary, last slot, cheapest tier changing                                                                                                                                                                                |
| 4         | `apps/server/src/draft/timer.test.ts`: `expireTurn` with the deadline set in the past; wishlist hit, none affordable (skip), a second miss (forfeit), a pick at the deadline                                                                                                                            |
| 5         | `apps/server/src/draft/restart.test.ts`: a live draft with a past deadline; starting the server auto-picks once                                                                                                                                                                                         |
| 6         | `apps/server/src/realtime/reconnect.test.ts`: a socket client dropped, picks made, reconnected at once and again after 61 seconds (fake timers on the ticket's expiry); its applied state equals `GET draft`                                                                                            |
| 7         | `apps/server/src/draft/admin.test.ts`: pause keeps the remaining time; resume restores it; undo returns the form and the turn                                                                                                                                                                           |
| 8         | `apps/server/src/realtime/privacy.test.ts`: every message a second member receives, checked for the first coach's wishlist                                                                                                                                                                              |
| 9         | `apps/web/e2e/draft-room.spec.ts` and `roster.spec.ts`: axe, keyboard, both themes, 360 and 1280 px; the live region's text after a pick and a turn change; the tab title on the coach's turn                                                                                                           |
| 10        | `apps/server/src/realtime/membership.test.ts`: a removed member's socket closed and `sync` refused; `apps/web/components/draft/clock.test.ts`: a client clock 5 minutes off still shows the server's time left; `apps/server/src/draft/scope.test.ts`: member and turn IDs from another league give 404 |
| 11        | `apps/server/src/draft/personal-data.test.ts`: the export holds the wishlist and picks made; deletion anonymises `made_by_user_id` and removes the wishlist                                                                                                                                             |
| 13        | `e2e/draft-csp.spec.ts`: a league page sends one CSP header with a nonce and the server in `connect-src`, and the socket connects under it; `e2e/preview-build.test.ts` (006's) extended: no `NEXT_PUBLIC_REALTIME_URL` in a preview build                                                              |
| 14        | `draft/start.test.ts`: a 10-minute draft with no channel refused without `confirmNoChannel`, started with it; a 2-minute draft starts; `e2e/leagues.spec.ts`: "Your turn" on `/leagues` and home from fixtures                                                                                          |
| 12        | `e2e/draft-room-languages.spec.ts`: the room in `/hi`, a pick announced in Hindi (the live region's text), and the room at 360 px with `dir="rtl"`: no overlap, back and next arrows flipped                                                                                                            |

## Decisions

| Item                | Options                                 | Decision and why                                                                                                      |
| ------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| How a pick is sent  | A socket message; an HTTP request       | HTTP: one path for sign-in, validation, idempotency and problem details; the socket only tells the room what happened |
| Serialising picks   | `SERIALIZABLE` with retries; a row lock | `SELECT … FOR UPDATE` on the draft: one draft's picks queue behind one lock, nothing to retry, quoted above           |
| The clock           | Each process's clock; the database's    | The database's `now()` decides; clients show the timer with the offset from `serverNow`                               |
| A missed timer      | In-memory timer and a sweep; a job too  | The timer and the sweep on start: one server, so the sweep covers a restart, and nothing to cancel after a pause      |
| Ticket on reconnect | One ticket; a fresh ticket each time    | Fresh: tickets are single use, and Socket.IO sends `auth` again on every reconnection                                 |

## Tasks

1. **League rules.** `turns.ts`, `budget.ts`, `auto-pick.ts` with their
   tests. Done when criteria 2 and 3 pass.
2. **Tables.** The schema and migration above. Done when the migration
   runs on an empty database and on 007's.
3. **Draft service.** Order, shuffle, scheduled start, start, pick,
   `expireTurn`, pause, resume, undo, timers, the sweep on start, the
   "Replace coach" hook and the no-channel confirmation. Done when
   criteria 1, 4, 5 and 7 pass, and `start.test.ts`.
4. **HTTP API and contracts.** With child IDs scoped by league. Done when
   each route's tests cover its roles and its errors.
5. **Real-time.** The namespace, the ticket callback, the origin-guard
   exemption and limits, broadcast after commit, `sync`, `serverNow`,
   disconnects on membership changes, `NEXT_PUBLIC_REALTIME_URL` in
   `.env.example` and on Vercel for Production only, and the nonce CSP on
   league pages with the server in `connect-src` (`proxy.ts`, the static
   CSP excluding them). Done when criteria 6, 8, 10 and 13 pass.
6. **Personal data.** The exporter and anonymiser. Done when criterion 11
   passes.
7. **Fixture screens.** The room in every state (scheduled with a
   countdown, live on your turn, live on another's, a make-up turn,
   paused, reconnecting, viewer, complete), the phone layout's three tabs,
   the rosters index and roster page, and the home page's "Draft live"
   block, at 360 and 1024 px. Done when the owner has reviewed them on a
   desktop and a phone.
8. **Real data.** The page loads the snapshot; `DraftRoom` applies events,
   syncs and keeps the clock offset; the announcer and the tab title;
   `GET /me/drafts` and "Your turn" on `/leagues` and home. Done when
   criteria 9 and 14 pass.
9. **Review.** The owner's `/interface-review`; the spec's row marked done.
