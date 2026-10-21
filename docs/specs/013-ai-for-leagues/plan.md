# 013: AI for leagues, plan

## Builds on

- [Spec 012](../012-ai-assistant/plan.md): `generateStructured`, the
  grounding check, `ai_runs`, the allowance, the global budget, the cache,
  the evaluation set.
- Specs 006 (`packages/db`, `packages/auth`), 007 (leagues, settings and
  `leagues.language`), 008 (the draft: turns, pool, budget,
  rosters), 009 (results, battle facts, weeks completing, standings, and
  every confirming path: the other coach, an admin, auto-confirm,
  settling and correcting), 010 (trades), 011 (pg-boss and
  `discord.post`).
- `packages/league` (affordability, rosters), `packages/dex` (the type
  chart and the team check's arithmetic).

## Packages and files

```text
packages/league/src/suggest.ts        rankCandidates (pure)
apps/server/src/ai/prompts/
  pick-suggestion.ts
  match-recap.ts
  weekly-digest.ts
  trade-explain.ts
apps/server/src/ai/league-personal-data.ts   anonymises a deleted coach's name in ai_writeups (spec 006)
apps/server/src/ai/league-scope.ts    the league's switches, checked by every feature
apps/server/src/jobs/ai-recap.ts
apps/server/src/jobs/ai-digest.ts
apps/server/src/routes/league-ai.ts
apps/web/components/league-ai/        SuggestPick, WriteupCard, ExplainCard, AiSwitches
packages/db/src/schema/ai.ts           adds ai_writeups and ai_league_days to spec 012's file; migration in packages/db/drizzle/
```

**Languages** ([ADR 0007](../../adr/0007-languages-and-right-to-left.md)):
recaps and the digest are written in the league's language
(`leagues.language`), and each write-up records the language it was
written in; a suggestion or a trade explanation is written in the reader's
language, from the page. Pokémon names stay English, and the grounding
check finds them inside text in any language. Labels such as "Written by
AI from the battle logs" are dictionary strings.

## Data model

```text
leagues (spec 007), three columns added:
  ai_enabled              boolean not null default true
  ai_suggestions_enabled  boolean not null default true
  ai_writeups_enabled     boolean not null default true

ai_writeups
  id            uuid
  league_id     uuid  references leagues on delete cascade
  kind          text  recap | digest
  subject_id    text  the match ID, or "<season ID>:<week number>"
  facts_hash    text  sha-256 of the facts it was written from
  text          text
  run_id        uuid  references ai_runs
  created_at    timestamptz
  unique (kind, subject_id)

ai_league_days
  league_id     uuid
  day           date
  writeups      integer
  primary key (league_id, day)
```

`ai_runs.league_id` (spec 012) is set for every run in a league's scope.
Write-ups have `user_id` null.

## The candidates

```ts
// packages/league/src/suggest.ts
rankCandidates(input: {
  pool: TierForm[];             // available forms with points
  roster: FormKey[];            // the coach's current roster
  pointsLeft: number;
  slotsLeft: number;            // including this pick
  cheapestPoints: number;       // the tier list's lowest points
  typeChart: TypeChart;         // from packages/dex
  formTypes: (key: FormKey) => TypeName[];
  formCoverage: (key: FormKey) => TypeName[];  // types its moves hit super-effectively
}): Candidate[]                  // sorted; each with coversWeaknesses, addsCoverage, points
```

- Affordable: `points + cheapestPoints × (slotsLeft − 1) ≤ pointsLeft`.
- Score order: weaknesses covered, then coverage added, then points.
- The function takes no wishlist, by its type, so criterion 4 is checked
  by the types and by a test of the route's call.

## API

| Method and path                                     | Who                        | Response                                                       |
| --------------------------------------------------- | -------------------------- | -------------------------------------------------------------- |
| `POST /api/v1/leagues/:slug/draft/suggestion`       | the coach whose turn it is | `{ turnNumber, items: [{ form, points, reason }], allowance }` |
| `POST /api/v1/leagues/:slug/trades/:id/explain`     | either coach, or an admin  | `{ text, allowance }`                                          |
| `PATCH /api/v1/leagues/:slug/settings/ai`           | an admin                   | the three switches                                             |
| `GET /api/v1/leagues/:slug/writeups?kind=&subject=` | a member                   | `{ text, createdAt } \| 404`                                   |

- The suggestion route reads the draft's state in one transaction, checks
  the actor is on the clock for `turnNumber`, ranks, then calls the model
  outside the transaction. The web client drops an answer whose
  `turnNumber` isn't the current turn.
- Every route calls `league-scope.ts` first: `ai_enabled`, then the
  feature's own switch; off returns problem details `…/ai-off-in-league`
  and no model call.
- The grounding check for these features takes the computed facts as its
  lookups, and for suggestions also requires every named form to be one of
  the three candidates.

## Events

None.

## Jobs

| Queue       | Sent                                                                                                                                                         | Idempotency key                 | Does                                                                                                                                                                                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ai.recap`  | In every transaction that confirms or corrects a result (spec 009: the other coach, an admin, auto-confirm, settle, correct), through `jobDb(tx)` (spec 011) | `recap:<match ID>:<facts hash>` | Skips if `ai_writeups` has this subject with the same `facts_hash`; checks the switches; checks the league's day and the budget, else re-sends itself with `startAfter` 00:00 UTC; writes; upserts `ai_writeups`; sends `discord.post` (spec 011) in the same transaction, through `jobDb(tx)` |
| `ai.digest` | In the transaction that completes a week (spec 009: `weeks.completed_at` set), through `jobDb(tx)`                                                           | `digest:<season ID>:<week>`     | The same, from the week's facts                                                                                                                                                                                                                                                                |

- Retries: pg-boss's retry with backoff, `retryLimit: 3`; after the last
  failure the job is left failed (visible, spec 014) and the page shows no
  write-up.
- The MVP and every number come from spec 009's battle facts
  (`battle_pokemon_stats`), assembled by `facts.ts` in the job, hashed for
  the key.

## Web

- Draft room: `SuggestPick` renders only when the room's state says it's
  the viewer's turn and the league's switches allow it; three `Item` rows;
  tapping one selects the form in the pool. A polite live region announces
  "Suggestions ready".
- Match page and league home: `WriteupCard` (Card, labelled) from
  `GET …/writeups`, with `lang` set to the write-up's language and "Written
  in English" (or Hindi) when it differs from the page's; nothing while
  there isn't one; "The recap is on its
  way" while the result is newer than a minute and no write-up exists.
- Trades: `ExplainCard` with a button and the text.
- Settings: `AiSwitches` (three `Switch` fields with descriptions); the two
  feature switches are disabled while "AI in this league" is off.

## Tests

| Acceptance criterion | Test                                                                                                                                                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1                    | `league-ai/privacy.test.ts`: every feature with `ai_enabled` off, provider requests intercepted; none sent                                                                                                            |
| 2                    | `routes/league-ai.suggestion.test.ts` (Testcontainers): another coach, a viewer, after the turn                                                                                                                       |
| 3                    | `packages/league/suggest.test.ts` (affordability, order); the route test with a stubbed model naming a fourth form                                                                                                    |
| 4                    | `suggest.test.ts` (no wishlist in the input type) and the route test spying on `rankCandidates`                                                                                                                       |
| 5                    | `jobs/ai-recap.test.ts`: confirm once, run the job twice; one write-up, one `discord.post`                                                                                                                            |
| 6                    | `jobs/ai-recap.test.ts` with a stubbed model naming an absent Pokémon and a wrong number                                                                                                                              |
| 7                    | `jobs/ai-recap.test.ts`: a corrected result's new facts hash replaces the text                                                                                                                                        |
| 8                    | `jobs/ai-budget.test.ts` with a fixed clock                                                                                                                                                                           |
| 9                    | `ai/allowance.test.ts` additions                                                                                                                                                                                      |
| 10                   | `e2e/league-ai.spec.ts` with axe, keyboard                                                                                                                                                                            |
| 11                   | `ai/league-personal-data.test.ts`: a deleted coach's name in a recap and a digest becomes "A former coach"                                                                                                            |
| 5 (paths)            | `jobs/ai-recap.test.ts`: confirming by the other coach, by an admin and by auto-confirm each enqueues one recap                                                                                                       |
| 13                   | `e2e/league-ai.spec.ts`: an English recap on `/hi/l/…/matches/…` has `lang="en"` and the "Written in English" label                                                                                                   |
| 12                   | `jobs/ai-recap.test.ts` with a stubbed model: a league in Hindi gets a recap requested in Hindi and recorded with `language = 'hi'`; the grounding check passes English names in Hindi text and fails an invented one |

The evaluation set (spec 012) gains `evals/cases/recap.jsonl` and
`digest.jsonl`: parsed facts from real replays, with the facts each
write-up must state and the names it must not invent.

## Decisions

| Item                                            | What the docs say (quoted)                                                                  | Decision                                                                                                                        |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| A master switch as well as two feature switches | The project doc: "a league can turn its AI features off, and then none of its data is sent" | Three switches: the master covers every feature, Ask's league lookups included; the two others are the ones leagues argue about |
| Who pays for write-ups                          | –                                                                                           | The league's daily limit and the global budget, never a person's allowance: nobody asked for them                               |
| Write-ups when the budget is spent              | –                                                                                           | Delayed to after 00:00 UTC, not dropped                                                                                         |

## Tasks

1. **The switches.** Migration, `PATCH …/settings/ai`, `league-scope.ts`,
   `AiSwitches` on fixtures then real data. Done when criterion 1's test
   passes for Ask's league lookups (spec 012) and the owner has reviewed
   the settings section.
2. **The candidates.** `rankCandidates` and its tests. Done when
   criteria 3's and 4's unit tests pass.
3. **Pick suggestions.** The prompt, the route, `SuggestPick` on fixtures
   (every state), then the live draft. Done when criteria 2 and 3 pass and
   the owner has tried it in a test draft on a phone.
4. **Recaps.** `ai_writeups`, `ai_league_days`, the facts builder, the job,
   sending `ai.recap` from every spec 009 transaction that confirms or
   corrects a result (auto-confirm included),
   `WriteupCard` on the match page (with its language label), the Discord
   post, every send through `jobDb(tx)`. Done when criteria 5–8 and 13
   pass.
5. **The digest.** The job, sending `ai.digest` from the spec 009
   transaction that completes a week, and the league home card. Done when its tests
   pass.
6. **Trade explanation.** The route and `ExplainCard`. Done when its
   tests pass and the owner has reviewed it.
7. **Evaluation cases** for recaps and the digest. Done when `bun run eval`
   scores them against a recorded baseline.
8. **Personal data.** `league-personal-data.ts`, registered with spec 006.
   Done when criterion 11's test passes.
