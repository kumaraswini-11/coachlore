# 010: Trades, plan

## Builds on

- **007:** `leagues`, `league_members` (`role`, `is_admin`, `left_at`),
  `seasons` (`status`, `budget`, `roster_size`, `trades_enabled`,
  `trade_approval_required`), the league settings that change them.
- **008:** `roster_entries` (one active row per form per season, enforced by
  the unique index on (`season_id`, `form_key`) where `released_at` is
  null).
- **009:** the season ending (`seasons.status` becomes `finished`).
- **006:** sessions through `packages/auth`, tables through `packages/db`,
  problem details, `packages/contracts`, the web app's
  proxy and `lib/server-api.ts`.
- **011** (built after this spec) posts completed trades; this spec sends
  nothing to Discord itself, and 011's tasks add the post.
- [ADR 0006](../../adr/0006-architecture-and-stack.md): Fastify, Drizzle,
  PostgreSQL.

## Packages and files

| Path                                             | What                                                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `packages/league/src/trade.ts`                   | `checkTrade()`: the rules, pure. Used by the server (authority) and the web app (the live check). |
| `packages/league/src/trade.test.ts`              | The rules' unit tests.                                                                            |
| `packages/contracts/src/trades.ts`               | Request and response schemas.                                                                     |
| `apps/server/src/trades/service.ts`              | Offer, answer, approve, complete, lapse: each one transaction.                                    |
| `apps/server/src/trades/routes.ts`               | The routes below.                                                                                 |
| `apps/server/src/trades/*.test.ts`               | Service tests against a real PostgreSQL, including the concurrent one.                            |
| `packages/db/src/schema/trades.ts`               | Adds `trades` and `trade_items`; a migration in `packages/db/drizzle/`.                           |
| `apps/web/app/[lang]/l/[league]/trades/page.tsx` | The Trades screen (Server Component): open trades and history.                                    |
| `apps/web/components/trades/trade-builder.tsx`   | The builder (`"use client"`): coach, give and get pickers, the live check, "Send offer".          |
| `apps/web/components/trades/trade-row.tsx`       | One trade: its forms, points, status and the actions the viewer may take.                         |
| `apps/web/fixtures/trades.ts`                    | Fixture rosters and trades for every state.                                                       |
| `apps/web/e2e/trades.spec.ts`                    | The screen's end-to-end and accessibility tests.                                                  |

**Languages** ([ADR 0007](../../adr/0007-languages-and-right-to-left.md)):
every string on these screens comes from the web app's dictionaries
(`en.json`, `hi.json`), with a key in both, under this spec's section;
Pokémon, form, move and ability names stay English; times use spec 001's
`formatTime` (`Intl`, the viewer's time zone with the league's beside
it); styles use logical properties, and the screens' end-to-end tests also
run with `dir="rtl"`. Why a trade isn't allowed comes from `checkTrade()` as a reason code, never text, and the screen shows that code's dictionary string.

## Data model

| Table         | Columns                                                                                                                                                                                                                                                                                        | Constraints                                                                                           |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `trades`      | `id`, `season_id`, `from_member_id`, `to_member_id`, `status` (`offered`, `awaiting_approval`, `completed`, `declined`, `withdrawn`, `rejected`, `lapsed`), `message` (≤ 280), `lapse_reason`, `answered_at`, `decided_by_member_id`, `decided_at`, `completed_at`, `created_at`, `updated_at` | `from_member_id` ≠ `to_member_id`; index on (`season_id`, `status`)                                   |
| `trade_items` | `id`, `trade_id`, `roster_entry_id` (the entry offered), `form_key`, `from_member_id`, `points`                                                                                                                                                                                                | unique (`trade_id`, `form_key`); index on (`form_key`, `trade_id`) to find open trades holding a form |

- `trade_items.points` copies the roster entry's points when the trade is
  offered, so history shows what was traded even after later trades.
- Completion releases each offered entry (`released_at = now()`) and
  inserts a new `roster_entries` row for the receiving coach with the same
  `form_key` and `points`, `acquired_via = 'trade'`. The unique index on
  active entries makes a form on two rosters impossible.
- Open means `offered` or `awaiting_approval`.

### The rules: `checkTrade()`

```ts
checkTrade({
  season: { status, tradesEnabled, budget, rosterSize },
  from: { memberId, role, roster: RosterEntry[] },
  to: { memberId, role, roster: RosterEntry[] },
  give: FormKey[], // from → to
  get: FormKey[],  // to → from
}): { ok: true; pointsAfter: { from: number; to: number } }
  | { ok: false; problems: TradeProblem[]; pointsAfter?: … }
```

Problems, each with a field and a sentence for the interface:
`not_in_season`, `trades_off`, `not_a_coach`, `same_coach`, `empty_side`,
`unequal_counts`, `too_many` (more than three a side), `duplicate_form`,
`not_on_roster` (names the form and coach), `over_budget` (names the
coach, their points after and the budget).

## API

All under `/api/v1/leagues/:slug/`, signed in, members only; problem
details on refusal (409 for a state that changed, 422 for a rule). Every
child ID (a trade, a member, a roster entry) is looked up with the slug's
`league_id` in the same query, so an ID from another league is a 404.

| Route                          | Who                 | Does                                                                                                     |
| ------------------------------ | ------------------- | -------------------------------------------------------------------------------------------------------- |
| `GET trades?status=open\|past` | members             | Trades with items, names and statuses, newest first; `past` is paginated by cursor (`created_at`, `id`). |
| `POST trades`                  | a coach             | `{ toMemberId, give, get, message? }`: runs `checkTrade` and stores an `offered` trade.                  |
| `POST trades/:id/accept`       | the receiving coach | Completes it, or moves it to `awaiting_approval`.                                                        |
| `POST trades/:id/decline`      | the receiving coach | `declined`.                                                                                              |
| `POST trades/:id/withdraw`     | the offering coach  | `withdrawn`.                                                                                             |
| `POST trades/:id/approve`      | admins              | Completes it.                                                                                            |
| `POST trades/:id/reject`       | admins              | `rejected`.                                                                                              |

Each action transaction:

1. `SELECT … FOR UPDATE` the trade; if its status isn't the one the action
   needs, refuse with 409 ("This trade has already been withdrawn"). Two
   people acting at once queue on this lock; the second sees the new
   status.
2. For accept (when it completes) and approve: lock **both coaches'
   `league_members` rows** (`SELECT … FOR UPDATE … ORDER BY id`), then the
   roster entries named by its items (`ORDER BY id`), load both rosters and
   the season, and run `checkTrade` again. Locking the coaches serialises
   every trade that touches either of them, so two trades by one coach
   with different forms can't each pass the budget check and together
   break it. A failed check sets `lapsed` with the first problem's
   sentence and returns 409.
3. Complete: release and insert the entries as above, set `completed`,
   then **lapse every other open trade holding any moved form** (found
   through `trade_items.form_key`), with the reason naming the form.
4. Commit. A completion that races another on the same form waits at the
   locks, then finds the form gone and lapses the trade; the unique index
   is the last guard.

Every lock in this spec is taken in `id` order (members, then entries), so
two trades can't wait on each other.

## Events

None over the socket. Rosters and trades are read over HTTP; the trades
page re-reads after each action.

## Jobs

None of its own. Spec 011 adds a `discord.post` for each completion, sent
in the completion's transaction.

## Hooks into earlier specs

`lapseOpenTrades(tx, { seasonId, memberId?, reason })` in the trade service,
called inside:

- 009's season end ("The season has ended."),
- 007's settings update when `trades_enabled` becomes false ("Trades were
  turned off."),
- 007's member removal or leaving (that member's trades: "Ash left the
  league."),
- 007's "Replace coach" (that member's open trades lapse: "Ash was
  replaced.").

`registerPersonalData` (spec 006): the export includes a person's trades
(offered, received, decided) and messages; deletion anonymises
`offered_by`, `decided_by` and the offer's message.

## Tests

| Acceptance criterion | Test                                                                                                                                                                                                                                                                          |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1                    | `packages/league/src/trade.test.ts`: every problem, and one, two and three a side; `trades/routes.test.ts`: the server refuses a bad request with 422                                                                                                                         |
| 2                    | `trade.test.ts`: over budget on either side; `routes.test.ts`: refused when sent anyway                                                                                                                                                                                       |
| 3                    | `trades/service.test.ts`: accept without approval moves the entries, marks them `trade`, in one transaction                                                                                                                                                                   |
| 4                    | `service.test.ts`: accept with approval waits; approve completes; reject ends                                                                                                                                                                                                 |
| 5                    | `service.test.ts`: two open trades share a form; completing one lapses the other with the reason; one active entry for the form                                                                                                                                               |
| 6                    | `trades/concurrency.test.ts`: two connections accept two trades sharing a form at once (a barrier, then both commits); exactly one completes. Also two trades by the same coach, with different forms, that each fit the budget alone but not together: exactly one completes |
| 7                    | `service.test.ts`: a moved form and a budget no longer met each lapse at accept and at approve                                                                                                                                                                                |
| 8                    | `service.test.ts`: `lapseOpenTrades` for season end and trades off                                                                                                                                                                                                            |
| 9                    | `routes.test.ts`: the history's fields; a viewer's actions get 403                                                                                                                                                                                                            |
| 10                   | Spec 011's `discord/post.test.ts` (one post per completed trade)                                                                                                                                                                                                              |
| 11                   | `apps/web/e2e/trades.spec.ts`: every state from fixtures, axe at 360 and 1280 px in both themes, keyboard only                                                                                                                                                                |
| 12                   | `trades/scope.test.ts`: trade and member IDs from another league give 404; `trades/personal-data.test.ts`: export and anonymisation                                                                                                                                           |
| 13                   | `e2e/trades-languages.spec.ts`: the trades screen in `/hi`, a refused trade's reason in Hindi; a unit test that every `checkTrade()` reason code has a string in both dictionaries                                                                                            |

## Decisions

| Item        | Options                                | Decision                                                                                                                          |
| ----------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Trade shape | Any counts; equal counts               | Equal counts, one to three a side: rosters stay at the roster size, and no pick-up or drop from the pool is needed (out of scope) |
| Serialising | `SERIALIZABLE` with retries; row locks | Row locks on the trade, both coaches' membership rows and the entries, in `id` order, with the unique index as the last guard     |
| Expiry      | A deadline per trade; lapse on events  | Lapse on events only (a form moves, the season ends, trades off, a coach leaves): no timer to run                                 |

## Tasks

1. **Rules.** `checkTrade` and its tests in `packages/league`. Done when
   every problem in the list has a test and `bun run test` passes.
2. **Schema.** `trades`, `trade_items` and the migration. Done when the
   migration applies to an empty database and to one with 009's data.
3. **Service.** Offer, decline, withdraw, accept, approve, reject,
   complete, `lapseOpenTrades`, with the service tests. Done when tests 3,
   4, 5, 7 and 8 pass.
4. **Concurrency.** The concurrent-completion test. Done when it passes
   repeatedly (run it 20 times in CI's loop).
5. **Routes and contracts.** The routes, schemas in `packages/contracts`,
   roles checked. Done when tests 1, 2 and 9 pass.
6. **Hooks and personal data.** `lapseOpenTrades` called from 009's
   season end and 007's settings, member removal and "Replace coach"; the
   exporter and anonymiser. Done when test 8 covers each call and test 12
   passes.
7. **Fixture screen.** The Trades screen and builder from fixtures, every
   state, reviewed by the owner on a desktop and a phone.
8. **Real data.** The screen on the API; the builder runs `checkTrade` live
   and shows the server's refusal if it differs. Done when the e2e test
   passes and the owner's `/interface-review` passes.
