# 011: Discord bot, plan

## Builds on

- **006:** the server, `packages/db`, `packages/auth`, its origin guard, Sentry, the `account` table
  (`provider_id = 'discord'`, `account_id` is the Discord ID), the Discord
  application created for sign-in, the server's public address
  (`https://coachlore.duckdns.org`).
- **007:** `leagues`, `league_members` (`is_admin`), League settings.
- **007:** `leagues.time_zone` and `leagues.language`.
- **008:** the draft service (scheduled start, start, pick, `expireTurn`,
  turn changes, complete).
- **009:** `weeks` (`starts_at`, `ends_at`, already in the league's time
  zone), `matches` (`status`), the confirm, settle, correct and
  auto-confirm paths.
- **010:** trade completion.
- [ADR 0006](../../adr/0006-architecture-and-stack.md): HTTP interactions
  and Discord's REST API, no Gateway connection; pg-boss for jobs, first
  added here.

## How it works

```text
Discord ──POST /api/v1/discord/interactions──► server  (signed by Discord; /link only)
event (pick, result, trade…) ──same transaction──► pg-boss job discord.post
discord.post ──POST /channels/{id}/messages──► Discord   (bot token, nonce, no mentions)
cron discord.reminders (every 5 minutes) ──► discord.post for weeks and scheduled drafts
turn change (timer ≥ 10 min) ──same transaction──► discord.post "on the clock"
```

No process connects to Discord's Gateway: Discord's docs say an app can
"opt-in to HTTP-based interactions by adding a **Interactions Endpoint
URL**" ([overview](https://github.com/discord/discord-api-docs/blob/main/developers/interactions/overview.mdx)),
and posting is one REST call,
`POST /channels/{channel.id}/messages` ([Create Message](https://github.com/discord/discord-api-docs/blob/main/developers/resources/message.mdx)).

## Packages and files

| Path                                                                                   | What                                                                                                                                                                                                                                                               |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/server/src/jobs/boss.ts`                                                         | pg-boss, created here: its schema migrated on start, workers started with the server and stopped (`boss.stop()`, waiting for active jobs) on shutdown. Its connection comes from `packages/db` (`jobConnection()`); the server imports no PostgreSQL driver.       |
| `apps/server/src/discord/verify.ts`                                                    | Ed25519 signature check of `X-Signature-Timestamp` + raw body, with Node's `crypto` (no dependency); timestamps more than 5 minutes from now are refused.                                                                                                          |
| `apps/server/src/discord/personal-data.ts`                                             | Registers this spec's exporter and anonymiser with spec 006.                                                                                                                                                                                                       |
| `apps/server/src/discord/interactions.ts`                                              | The route: `PING` → `PONG`; `/link` → link or refuse.                                                                                                                                                                                                              |
| `apps/server/src/discord/rest.ts`                                                      | `createMessage()` with `fetch`: bot token, `nonce`, `enforce_nonce`, `allowed_mentions`; maps Discord's answers to results.                                                                                                                                        |
| `apps/server/src/discord/messages/{en,hi}.ts`                                          | One file per language, each with one function per post kind: event data in, message content out (plain text, at most 2,000 characters).                                                                                                                            |
| `apps/server/src/discord/notify.ts`                                                    | `notifyLeague(tx, { leagueId, key, kind, data })`: sends a `discord.post` job inside the caller's transaction, with pg-boss's `db` option set to `jobDb(tx)`, if the league is linked. The payload carries the link it was queued for (`channel_id`, `linked_at`). |
| `apps/server/src/jobs/discord-post.ts`                                                 | The `discord.post` handler.                                                                                                                                                                                                                                        |
| `apps/server/src/jobs/discord-reminders.ts`                                            | The `discord.reminders` handler, every 5 minutes.                                                                                                                                                                                                                  |
| `apps/server/src/discord/routes.ts`                                                    | The league settings routes below.                                                                                                                                                                                                                                  |
| `apps/server/scripts/discord-register.ts`                                              | Registers the `/link` command (`bun run discord:register`), run by the owner once and after the command changes.                                                                                                                                                   |
| `packages/db/src/schema/discord.ts`                                                    | Adds `league_discord` and `discord_posts`; a migration.                                                                                                                                                                                                            |
| `packages/db/src/jobs.ts`                                                              | `jobDb(tx)`: pg-boss's `executeSql` adapter over a Drizzle transaction, so a job is saved in the caller's transaction; `jobConnection()`: the connection settings pg-boss uses. Added here, with pg-boss, to the package that owns the connection.                 |
| `packages/contracts/src/discord.ts`                                                    | Settings request and response schemas.                                                                                                                                                                                                                             |
| `apps/web/app/[lang]/l/[league]/settings/discord-section.tsx`                          | The Discord section (`"use client"` only for copy, the switch and the buttons).                                                                                                                                                                                    |
| `apps/web/fixtures/discord.ts`, `packages/playwright-web/e2e/discord-settings.spec.ts` | Fixtures for each state; the screen's tests.                                                                                                                                                                                                                       |

**Languages** ([ADR 0007](../../adr/0007-languages-and-right-to-left.md)):
posts, reminders and slash-command replies use the league's language
(`leagues.language`, spec 007), rendered by that language's
`messages/` file; Pokémon, form, move and coach names are never
translated; times in posts are formatted with `Intl` in the league's
language and time zone. A test fails when a post kind has no function in a
language. The Discord section of League settings follows the page's
language like every screen.

## Data model

| Table            | Columns                                                                                                                                                                                                        | Constraints                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `league_discord` | `league_id` (primary key), `guild_id`, `channel_id`, `channel_name`, `linked_by_member_id` (nullable), `linked_at`, `post_picks` (default true), `status` (`active`, `stopped`), `last_error`, `last_error_at` | deleted with the league                             |
| `discord_posts`  | `id`, `idempotency_key`, `league_id`, `channel_id`, `message_id`, `posted_at`                                                                                                                                  | unique (`idempotency_key`); deleted with the league |
| `league_members` | adds `turn_pings` (bool, default true): "on the clock" may mention this coach                                                                                                                                  | –                                                   |

**Idempotency keys**, one per event: `linked:<league_discord.linked_at>`,
`draft-started:<draftId>`, `pick:<pickId>`, `draft-complete:<draftId>`,
`week-start:<weekId>`, `week-ending:<weekId>`,
`draft-soon:<draftId>:<day|hour>:<scheduled_at>` (a new time posts again),
`on-clock:<draftId>:<turnNumber>:<turn_deadline>` (an undone turn posts
again),
`result:<matchId>:<result_confirmations.id>` (a correction is a new
confirmation row, so it posts again), `trade:<tradeId>`,
`test:<uuid>` (each test post is new).

## API

| Route                                     | Who               | Does                                                                                                                   |
| ----------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `POST /api/v1/discord/interactions`       | Discord, directly | Exempt from the origin guard (Discord calls the server's own address); refused with 401 unless the signature is valid. |
| `GET /api/v1/leagues/:slug/discord`       | admins            | `{ linked, channelName, postPicks, status, lastError, installUrl, linkCommand }`                                       |
| `PATCH /api/v1/leagues/:slug/discord`     | admins            | `{ postPicks }`                                                                                                        |
| `POST /api/v1/leagues/:slug/discord/test` | admins            | Sends a `test` post; sets `status = active` first, so a test after fixing permissions resumes posting.                 |
| `DELETE /api/v1/leagues/:slug/discord`    | admins            | Unlinks; queued posts for the league find no link and finish without posting.                                          |

### The interactions route

1. Fastify keeps the raw body for this route only (a content-type parser
   scoped to it), because the signature covers the exact bytes.
2. `verify.ts` checks the signature with the application's public key;
   Discord: "If the signature fails validation, your app should respond
   with a `401` error code" ([overview](https://github.com/discord/discord-api-docs/blob/main/developers/interactions/overview.mdx)).
   A timestamp more than 5 minutes from the server's clock also gets 401,
   so a captured request can't be replayed later.
3. `type: 1` (PING): reply `{ type: 1 }` (PONG), as Discord requires when
   the endpoint is saved.
4. `/link` (an application command named `link`, one string option
   `league`): look up the league by slug and the invoking user's Discord ID
   (`interaction.member.user.id`) in `account`, joined to `league_members`
   with `is_admin`, and checks that `interaction.member.permissions` (the
   member's permissions in that channel) includes Manage Channels
   (`1 << 4`). If all match and the interaction came from a server:
   upsert `league_discord` (`guild_id`, `channel_id`, `channel.name`,
   `status = active`), send the `linked` post through `notifyLeague` in the
   same transaction, and reply with type 4 and the flag `EPHEMERAL`
   (`1 << 6`): "Linked. Kanto Cup's posts will appear in #draft-league."
   Otherwise reply ephemerally "Only an admin of kanto-cup can link it
   here." Every path is a few database reads, well inside Discord's rule
   that "you must send an initial response within 3 seconds"
   ([receiving and responding](https://github.com/discord/discord-api-docs/blob/main/developers/interactions/receiving-and-responding.mdx));
   nothing here needs a deferred response.

## Events

None.

## Jobs

| Queue                 | Sent                                                                                                              | Options                                                                                                                                                     | Does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord.post`        | By `notifyLeague`, inside the transaction of the event through `jobDb(tx)` (so a rolled-back event posts nothing) | `retryLimit: 8`, `retryDelay: 5`, `retryBackoff: true`, `retryDelayMax: 600`, `singletonKey` = the idempotency key; dead letter queue `discord.post.failed` | 1. If `discord_posts` has the key, finish. 2. Load `league_discord`; if none, `stopped`, or its `channel_id` and `linked_at` differ from the payload's, finish (the link changed). 3. Render with the league language's `messages/` file. 4. On a retry, look for the post first: read the channel's 50 most recent messages and, if one is the bot's with the same content, insert `discord_posts` for it and finish. 5. `createMessage()`. 6. On success, insert `discord_posts` (`ON CONFLICT DO NOTHING`). On 429, reschedule the job to run after the full `retry_after` (no cap) and finish this attempt. On 401, 403 or 404, report the status code and key (no content) to the sanitised failure reporter, set `status = stopped` with the reason and finish (no retry). Anything else throws, so pg-boss retries. |
| `discord.reminders`   | `boss.schedule('discord.reminders', '*/5 * * * *')` at start                                                      | –                                                                                                                                                           | For each linked league: weeks whose `starts_at` falls inside the reminder window (the last 60 minutes: `now` − 60 min < `starts_at` ≤ `now`), that started after the league was linked (`linked_at` ≤ `starts_at`), and have no `week-start` post, send one, so a week that started before the league was linked, or while the server was down for longer than the window, is never announced late; weeks with `ends_at` − 24 h ≤ now < `ends_at` and a match not confirmed, send `week-ending`; scheduled drafts within a day or an hour of `scheduled_at`, send `draft-soon`. Times are instants already computed in the league's time zone; the post shows them in it. The keys make repeats harmless.                                                                                                                  |
| `discord.post.failed` | pg-boss, after the last retry                                                                                     | –                                                                                                                                                           | Records `last_error` on `league_discord` and reports the job (queue, key, status code, no message content) to Sentry.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

**At least once, with duplicates removed.** Delivery is at least once:
Discord can accept a post and the server fail before recording it, so no
check can promise exactly once. Three layers keep a retry from posting
again:

1. `discord_posts` records every post the server saw succeed, and
   pg-boss's `singletonKey` stops the same event being queued twice.
2. The post sends a `nonce` (the first 25 characters of the base64url
   SHA-256 of the idempotency key) with `enforce_nonce: true`: "If another
   message was created by the same author with the same nonce, that message
   will be returned and no new message will be created", but only "in the
   past few minutes" ([Create Message](https://github.com/discord/discord-api-docs/blob/main/developers/resources/message.mdx)).
3. A retry first reads the channel's recent messages (Get Channel Messages,
   "Max number of messages to return (1-100)", default 50, needing
   `READ_MESSAGE_HISTORY`: "If the current user is missing the
   `READ_MESSAGE_HISTORY` permission in the channel, then no messages will
   be returned", [same page](https://github.com/discord/discord-api-docs/blob/main/developers/resources/message.mdx)) and records the bot's earlier post
   if it's there. A message counts as that post only if its author is our
   bot (`author.id` equals the application's bot user ID) and it ends with
   the post's marker: a last line in Discord's small text, `-# ref <first
12 characters of the nonce>`, written into every post. Content alone
   never matches, so two events with the same wording can't be confused.

The case left: a crash after Discord accepted the post, then a retry after
the nonce window when the post is no longer among the 50 most recent
messages. The post can then appear twice; spec 011's acceptance criterion
says so.

**No mentions.** Every post sends `allowed_mentions: { parse: [] }`, which
Discord's Create Message warning recommends when "passing user-generated
strings into message content". The "on the clock" post adds
`users: [<that coach's Discord ID>]` and nothing else, and only when the
coach's `turn_pings` is on; otherwise it names them without a mention.
It's sent on each turn change of a draft whose timer is 10 minutes or more
(shorter drafts are live, and everyone is in the room).

**Rate limits.** Discord says "Your application should rely on the
`Retry-After` header or `retry_after` field to determine when to retry the
request" ([rate limits](https://github.com/discord/discord-api-docs/blob/main/developers/topics/rate-limits.mdx)).
A 429 reschedules the job for the full `retry_after`, however long, so
no request is sent early and no worker waits; no rate-limit library.

**Hooks into earlier specs** (each a `notifyLeague` call inside the
existing transaction): 008's start (`draft-started`), pick and `expireTurn`
when `post_picks` is on (`pick`), every turn change (`on-clock`),
completion (`draft-complete`); 009's confirm, settle and auto-confirm
(`result`); 010's completion (`trade`).

**Personal data** (spec 006): the export includes the leagues a person
linked and their `turn_pings`; deletion sets `linked_by_member_id` to null
and clears nothing else, since the channel link belongs to the league.

## Configuration

| Variable                          | Where  | Value                                                         |
| --------------------------------- | ------ | ------------------------------------------------------------- |
| `DISCORD_APPLICATION_ID`          | server | The application's ID (the same application as sign-in)        |
| `DISCORD_PUBLIC_KEY`              | server | The application's public key, for signatures                  |
| `DISCORD_BOT_TOKEN`               | server | The bot's token; a secret                                     |
| `NEXT_PUBLIC_DISCORD_INSTALL_URL` | web    | The install link from the Developer Portal (public by nature) |

### The owner's steps in the Discord Developer Portal

1. **Bot:** reset and copy the token into the server's environment. Keep
   "Public Bot" on, so admins of other servers can add it. Turn on no
   privileged intents: the bot reads nothing.
2. **General Information:** copy the application ID and public key.
3. **Interactions Endpoint URL:**
   `https://coachlore.duckdns.org/api/v1/discord/interactions`, saved after
   the server is deployed (Discord sends a PING to check it).
4. **Installation:** guild install only; scopes `bot` and
   `applications.commands`; permissions View Channels (`1 << 10`), Send
   Messages (`1 << 11`), Embed Links (`1 << 14`) and Read Message History
   (`1 << 16`), together `84992`
   ([permissions](https://github.com/discord/discord-api-docs/blob/main/developers/topics/permissions.mdx)).
   Copy the install link into `NEXT_PUBLIC_DISCORD_INSTALL_URL`.
5. Run `bun run discord:register` once against production.

Local development can't receive interactions without a public address;
`/link` is tested with signed requests (below) and tried on the deployed
server. Posting works locally against a test server's channel.

## Tests

| Acceptance criterion | Test                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1                    | `discord/install-url.test.ts`: the configured URL's `scope` and `permissions` are exactly `bot applications.commands` and `84992`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2                    | `discord/interactions.test.ts`: a test key pair signs requests; `/link` by an admin with Manage Channels links and queues `linked`; by a non-admin, an admin without Manage Channels, an unknown league and a DM, the same refusal and no change                                                                                                                                                                                                                                                                                                                                                                                   |
| 3                    | `interactions.test.ts`: a bad or missing signature, and a valid signature on a timestamp 6 minutes old, get 401; PING gets PONG; each reply is sent without waiting on any network call                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 4                    | `jobs/discord-post.test.ts` with Discord's REST faked at `fetch`: the same key queued twice posts once; a failure after Discord accepted the message, then a retry, gives one message (the fake honours `nonce`); a retry after the nonce window finds the earlier post among the recent messages by the bot's author ID and its `ref` marker and records it, while a message by another author, or the bot's message for a different event with the same wording, is not taken for it; a job queued before an unlink or a relink to another channel posts nothing; a 401, 403 or 404 reaches the failure reporter without content |
| 5                    | `discord-post.test.ts`: with the fake returning errors, picks, results and trades still commit; the jobs post when it recovers                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 6                    | `discord-post.test.ts`: a 429 with a `retry_after` of 90 s reschedules the job for 90 s, sends nothing earlier, then posts                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 7                    | `discord-post.test.ts`: 403 stops the league's posting and records the reason; a test post resumes it                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 8                    | `jobs/discord-reminders.test.ts`: a week that started 10 minutes before the league was linked gets no `week-start`; two runs in a row and the next day send each reminder once; a week that started three days ago with no `week-start` post (the league was linked since) gets no reminder; no `week-ending` when every match is confirmed; a league far from UTC gets its reminders at its own times; a scheduled draft gets its day and hour reminders, and again after it's rescheduled                                                                                                                                        |
| 9                    | `discord/messages.test.ts`: `@everyone` and `<@123>` in a team name are sent as text, with `allowed_mentions.parse` empty                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 10                   | `discord-post.test.ts`: after the last retry, `last_error` is set and Sentry receives the event without content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 11                   | `packages/playwright-web/e2e/discord-settings.spec.ts`: every state from fixtures, axe at 360 and 1280 px in both themes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 12                   | `discord/on-clock.test.ts`: a 10-minute draft queues one `on-clock` per turn with `allowed_mentions.users` holding only that coach; with `turn_pings` off, the name without a mention; a 2-minute draft queues none                                                                                                                                                                                                                                                                                                                                                                                                                |
| 13                   | `discord/personal-data.test.ts`: export and deletion                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 14                   | `discord/messages.test.ts`: every post kind renders in `en` and `hi` with the Pokémon's English name, under 2,000 characters; a league in Hindi gets a Hindi pick post and reminder (stubbed Discord)                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 15                   | `jobs/outbox.test.ts`: a pick's transaction rolled back after `notifyLeague` leaves no `discord.post` job; a committed one leaves exactly one                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

## Decisions

| Item                            | Options                                                                                                                                                 | Decision                                                                                                                                                                                                    | Sources                                                                                                                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Linking a channel               | Install with a redirect, then pick a channel on the site; a one-time code typed in the channel; `/link <league>` checked against the admin's Discord ID | `/link <league>`: Discord tells us the channel and who typed it, signed; the person is already known by their Discord sign-in. No redirect to handle, no channel list to fetch, no codes to store or expire | [Interactions](https://github.com/discord/discord-api-docs/blob/main/developers/interactions/overview.mdx); ADR 0006 (Discord bot)                                                                               |
| Posting                         | discord.js with a Gateway; `@discordjs/rest`; `fetch`                                                                                                   | `fetch`: one endpoint, few posts, and retries are already pg-boss's job                                                                                                                                     | [Create Message](https://github.com/discord/discord-api-docs/blob/main/developers/resources/message.mdx); ADR 0006 (Discord bot)                                                                                 |
| Telling a coach it's their turn | In-app notifications; a direct message; a mention in the league channel                                                                                 | A mention in the league channel, for slow drafts only, with an opt-out: no new channel to build, and no direct messages to read permission for                                                              | [Create Message, `allowed_mentions`](https://github.com/discord/discord-api-docs/blob/main/developers/resources/message.mdx); spec 001 (no in-app notifications)                                                 |
| Sending a job in a transaction  | pg-boss on its own connection; pg-boss's `db` option bound to the transaction                                                                           | `jobDb(tx)`: pg-boss lets "you … send one in the same transaction as the data change it belongs to: the job exists if, and only if, the change commits" ([pg-boss](https://github.com/timgit/pg-boss))      | [pg-boss](https://github.com/timgit/pg-boss); ADR 0006 (Jobs)                                                                                                                                                    |
| Signature check                 | A package; Node's `crypto`                                                                                                                              | Node's `crypto` (Ed25519 is built in): no dependency                                                                                                                                                        | [Interactions](https://github.com/discord/discord-api-docs/blob/main/developers/interactions/overview.mdx); [Node.js crypto](https://nodejs.org/api/crypto.html)                                                 |
| Message format                  | Embeds; plain text                                                                                                                                      | Plain text with links: readable everywhere, nothing to design. Embed Links stays in the permissions so the links preview                                                                                    | [Create Message](https://github.com/discord/discord-api-docs/blob/main/developers/resources/message.mdx); [permissions](https://github.com/discord/discord-api-docs/blob/main/developers/topics/permissions.mdx) |

## Tasks

1. **Jobs.** pg-boss in the server (`boss.ts`): its schema migrated on
   start, started with the server, stopped on shutdown after active jobs
   finish; `jobDb(tx)` and `jobConnection()` in `packages/db`. Done when a
   test job round-trips, a shutdown waits for it, and test 15 passes.
2. **Schema.** `league_discord`, `discord_posts`, `turn_pings`, the
   migration. Done when it applies on top of 010's.
3. **Messages.** `messages.ts` for every kind, with the mention test. Done
   when test 9 passes and each kind has a snapshot.
4. **Posting.** `rest.ts`, `notifyLeague`, the `discord.post` handler and
   its dead letter queue. Done when tests 4, 5, 6, 7 and 10 pass.
5. **Interactions.** `verify.ts` (with the timestamp check), the route
   (raw body, origin-guard exemption), `/link` with Manage Channels,
   `discord-register.ts`. Done when tests 2 and 3 pass.
6. **Hooks.** `notifyLeague` calls in 008 (including `on-clock`), 009 and 010. Done when each service's tests assert the job is queued in its
   transaction, and test 12 passes.
7. **Reminders.** The schedule and its handler. Done when test 8 passes.
8. **Personal data.** The exporter and anonymiser, and the "on the clock"
   switch on the member's league settings. Done when test 13 passes.
9. **Settings.** Routes, contracts, the Discord section from fixtures,
   reviewed by the owner on a desktop and a phone, then on real data. Done
   when test 11 passes.
10. **Production.** The owner's portal steps; the variables in Coolify and
    Vercel; `discord:register`; `/link` in a test server; a draft, a result
    and a trade posted once each. Done when the owner has seen each post.
