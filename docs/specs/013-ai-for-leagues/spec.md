# 013: AI for leagues

| Status  | Owner             | Written    |
| ------- | ----------------- | ---------- |
| Written | Aswini Kumar Sahu | 2026-10-21 |

## Goal

AI that adds to a league without deciding anything in it: a suggestion for
the coach whose turn it is, picked from candidates the code worked out; a
recap of each match and a digest of each week, written from the parsed
battle logs and the standings; and an explanation of a trade.
A league can switch each of these off, and with its AI off, none of its
data goes to a model.

## Where this comes from

The [project doc](../../project-doc.md): "The rules everything rests on"
(the AI "may choose among options the code computed"), "Scope" ("draft
suggestions only the picking coach sees (and a league can switch off),
match recaps and a weekly digest written from parsed facts"), "Out of
scope" ("The AI picking for you"), "Privacy, security and running it" ("a
league can turn its AI features off, and then none of its data is sent").
The AI layer, the grounding check, the allowance, the budget, the cache and
the tracing are [spec 012](../012-ai-assistant/spec.md)'s; this spec uses
them. Screens: [spec 001](../001-interface/spec.md) ("Draft room", "A
match", "League home", "Trades", "A coach's roster", "League settings").

## Requirements

### 1. The league's AI switches

1. Each league has three settings, changed by an admin in the settings'
   AI section:
   - **AI in this league** (on by default). Off: nothing below runs, and no
     model receives the league's data, Ask's league lookups included
     (spec 012).
   - **Pick suggestions in the draft room** (on by default). Some leagues
     see suggestions as unfair; off, no coach gets them.
   - **Recaps and the weekly digest** (on by default).
2. Changing a setting takes effect on the next request or job; a job that
   starts after the switch is turned off ends without a model call.
3. Members see which AI features their league has on, in the settings
   page's AI section (read-only for coaches and viewers).

### 2. Pick suggestions

1. In the draft room, the coach whose turn it is can ask for a suggestion.
   No one else sees the button, the request or the answer.
2. The code chooses the candidates: forms in the pool that the coach can
   afford while still filling the rest of their roster at the cheapest
   tier's points, ranked by how many of their roster's uncovered
   weaknesses each covers, then by how many types each adds to the
   roster's coverage, then by points (higher first).
3. The model explains the top three in a sentence each ("Garchomp: covers
   your Electric weakness and adds Ground coverage; 18 of your 48 points").
   It may reorder them, and it may not name a form that isn't one of the
   three.
4. A suggestion never picks. The coach picks, or auto-pick takes their
   wishlist's first affordable form, as spec 008 says.
5. The candidates use only the coach's own roster, budget and the pool.
   Other coaches' wishlists never reach the code that ranks or the model.
6. A suggestion counts against the coach's daily allowance (spec 012).
   When the turn ends, the suggestion disappears.

### 3. Match recaps

1. When a match's result is confirmed (spec 009), a recap is written in the
   background from the parsed facts only: each battle's score, each
   Pokémon's KOs and faints, which side won each battle, and the match's
   MVP, which the code computes (most KOs; then fewest faints; then the
   first KO).
2. The recap is a short paragraph (at most 80 words), names only the two
   coaches (by their names in the league) and Pokémon from those battles,
   and states no number that isn't in the facts. It passes spec 012's
   grounding check, against the facts as its lookups.
3. It appears on the match page labelled "Written by AI from the battle
   logs", and is posted to the league channel with the result if the
   league has one (spec 011).
4. A result entered by hand gets a recap from what was entered (score
   only), labelled the same way.
5. A recap is written once per match. If the result is corrected later
   (spec 009's dispute), the recap is written again from the new facts and
   the old one is replaced. Until the new one is written the page says
   "Recap being updated"; if it can't be written, the page shows no recap.
   The old text is never shown once its facts have changed.
6. If writing fails, the match page shows the result without a recap; the
   job retries, and gives up after three tries.

### 4. The weekly digest

1. When a week is complete (spec 009: each match confirmed or a bye), a digest is written from that week's
   results, the standings before and after, and the week's KO leaders, all
   computed by the code.
2. At most 120 words, labelled "Written by AI from this week's results".
   It names coaches and Pokémon from the facts only, and no number that
   isn't in them.
3. It appears at the top of the league home until the next week's digest,
   and is posted to the league channel.
4. No predictions, rankings of coaches beyond the standings, or
   storylines that aren't in the facts.

### 5. Trade explanations

1. On a trade (spec 010), either coach in it or an admin can ask "Explain
   this trade": the code computes both rosters' weaknesses, coverage and
   points before and after; the model explains the change in two or three
   sentences. It never says whether to accept.
2. A roster isn't explained separately: a coach's roster page links to
   the team check with that roster (spec 008), where "Explain my team"
   (spec 012) explains it.
3. A trade explanation counts against the asker's allowance and is
   labelled.

### 7. Personal data

1. Suggestions and trade explanations are a person's AI runs: spec 012
   exports and deletes them.
2. Recaps and digests belong to the league. When a coach's account is
   deleted, their name in the league's write-ups becomes "A former coach",
   as everywhere else in the league (spec 006).

### 6. Budget

1. Suggestions and explanations are a person's requests: they count
   against that person's daily allowance and the global budget (spec 012).
2. Recaps and digests are the league's: they count against a per-league
   daily limit (20 write-ups) and the global budget, never against a
   person.
3. When the league's limit or the global budget is spent, the write-up
   waits until after 00:00 UTC and is written then; it's never dropped for
   that reason.

### 8. Languages

1. Recaps and the digest are written in the league's language (spec 007);
   a suggestion or a trade explanation in the reader's language.
2. Pokémon, form, move and ability names stay in English, and the grounding
   check still checks them inside text in any language (ADR 0007).
3. A write-up carries its language: on a page in another language it's
   marked as such and labelled "Written in English" (or Hindi).

## Rules and edge cases

- **The draft is never slowed.** Asking for a suggestion never delays a
  pick, the timer or the room's events; a suggestion that arrives after
  the turn ended is discarded.
- **A forfeit or a tie** is described as what it was; KOs from a forfeited
  battle are as spec 009 counts them (none for the forfeit).
- **Names in battle logs** are the forms the parser mapped (spec 009);
  nicknames never reach the model.
- **A league deleted** while a job waits: the job ends without a model
  call.
- **Members who leave** are named as spec 006 says ("A former coach").

## Screens

- **Draft room:** on the coach's turn, a "Suggest a pick" button above
  "Draft …"; the answer is three rows (form, points, one sentence), each
  tappable to select it in the pool. States: AI off in this league
  (button hidden), allowance used, AI unavailable. Announced politely once,
  when it arrives.
- **A match:** the recap card under the KOs, labelled. States: being
  written ("The recap is on its way"), not available (no card).
- **League home:** the digest card at the top, labelled, with its week.
- **Trades:** an "Explain" button and a labelled card.
- **League settings, AI section:** the three switches (Switch), with a line
  each on what it does and what data it sends.

## Acceptance criteria

1. With "AI in this league" off, no request to the provider contains the
   league's data, from any feature, shown by a test that inspects outgoing
   requests while every feature is exercised.
2. Only the coach whose turn it is can request a suggestion; a request from
   anyone else, or after the turn ended, is refused by the server.
3. Every suggested form is one of the code's top three candidates, each
   affordable with the rest of the roster still fillable; a stubbed model
   naming a fourth form is refused by the grounding check.
4. The ranking's inputs contain no other coach's wishlist, shown by a test
   of the ranking function's inputs.
5. Confirming a result enqueues exactly one recap; a retried job writes
   and posts it once.
6. A recap or digest naming a Pokémon not in its facts, or a number not in
   them, is refused and retried, then given up after three tries, with the
   result still shown.
7. A corrected result replaces its recap; while it's being rewritten, and
   if rewriting fails, the old recap isn't shown.
8. The 21st league write-up of a day waits until after 00:00 UTC and is
   then written.
9. Suggestions and explanations count against the asker's allowance;
   write-ups don't count against anyone's.
10. Every screen change passes axe and keyboard use; the draft room's
    suggestion is announced once.
11. Deleting a coach's account replaces their name in the league's
    write-ups with "A former coach".
12. With the league's language set to Hindi, a recap and the digest are
    written in Hindi, name Pokémon in English, and pass the grounding check.
13. A recap written in English, shown on a Hindi page, is marked
    `lang="en"` and labelled "Written in English".

## Out of scope

- The AI picking, trading or reporting for anyone.
- Predictions, power rankings, "best Pokémon" lists.
- Recaps of individual battles separately from their match.
- AI in the Discord bot's commands.
- A separate roster explanation: the team check explains a roster.

## Changes

- 2026-10-21: written.
- 2026-10-21: audit fixes: "Explain this roster" cut (the roster links to
  the team check); write-ups hooked into every confirming path of spec 009,
  including auto-confirm; personal data.
- 2026-10-21: final audit: write-up jobs saved through `jobDb(tx)`; write-ups carry their language and say so on a page in another.
- 2026-10-21: review fixes: write-ups store and return their language; a by-hand result's recap uses only what was entered; three attempts in all.
