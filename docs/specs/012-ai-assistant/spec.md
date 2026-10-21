# 012: AI assistant

| Status  | Owner             | Written    |
| ------- | ----------------- | ---------- |
| Written | Aswini Kumar Sahu | 2026-10-21 |

## Goal

AI that helps without guessing: plain-language search that turns a
question into filters the person can see and edit, an assistant that looks
facts up and shows its lookups before it answers, and an explanation of a
team's weaknesses. Every name it says is checked against our data, every
number comes from the data or the code, and every page works without it.

## Where this comes from

The [project doc](../../project-doc.md): "The rules everything rests on"
("Code and data decide every number"), "Scope" ("Plain-language search",
"AI that shows its work", the check and the evaluation), "How it works"
("The AI is provider-agnostic, traced and cached"), "Privacy, security and
running it" ("A model gets only what the feature needs") and "What has to
be true before this ships". AGENTS.md: "The AI never decides a number".
Screens: [spec 001](../001-interface/spec.md) ("Ask", "Browse the Dex",
"Team check", "Me", and the "AI unavailable" state).

## Requirements

### 1. One way to reach a model

1. Every AI feature reaches a model through one interface on the server.
   No feature names a provider or a model; the provider and the model for
   each kind of task (reading a question, writing an answer) are
   configuration, changeable without touching a feature.
2. Models run only on the server. The browser never holds a provider key
   and never calls a provider.
3. When the provider fails, times out or refuses, the feature shows the
   "AI unavailable" state and the rest of the page works.
4. A model's output that should be structured (filters, a list of names) is
   checked against its schema like any request; output that fails the
   check is treated as a failure, never shown.

### 2. Plain-language search

1. On `/dex`, `/moves` and the search palette, a signed-in person can type
   a question ("fast steel types that resist fairy"). The model turns it
   into the same filters the page already has (spec 003's Dex filters;
   spec 004's move filters); the code runs the filters.
2. The filters chosen appear as the same removable chips as hand-picked
   ones, under "AI read this as:", and the address changes to hold them, so
   the result can be shared and corrected.
3. The model never returns Pokémon, forms or moves itself, only filters. A
   filter value that isn't in the data (a type, an ability, a game) is
   dropped and the person is told which.
4. Signed out, the box works as a plain name and number filter, and a line
   offers "Sign in to search in plain words".
5. In the palette, "Ask: …" is the last row and opens `/ask` with the
   question.

### 3. Ask

1. `/ask` is a conversation. The assistant is told to answer only from its
   lookups: each lookup is a query against our data (a Pokémon or form, its matchups,
   moves, abilities, evolutions, the type chart; and for a member, their
   leagues' standings, rosters, tier lists and schedule).
2. The lookups appear first ("Looked up Garchomp", "Checked its matchups"),
   then the answer. An answer with no lookups behind it isn't shown.
3. At most 6 lookups per question. A question that needs more gets
   "That's too broad for one question. Try narrowing it." with what was
   found so far.
4. League lookups return only what the person may see in that league, by
   the same checks as the league's pages. A league they aren't a member of
   doesn't exist to the assistant.
5. Names in an answer (Pokémon, forms, moves, abilities) are links to their
   Dex pages.
6. Every answer is labelled "Written by AI from the Dex's data" (or "… and
   your league's data"), with today's remaining allowance.
7. A follow-up keeps the conversation's earlier questions and lookups.
   The conversation is kept on the server, as the person's own runs: the
   browser sends only which earlier answers it follows, never their text,
   so nobody can put words in the assistant's mouth. "New" starts
   another.
8. A Pokémon page offers "Ask about Garchomp", which opens `/ask` with that
   Pokémon as the subject.

### 4. The grounding check

1. Before any answer is shown, every Pokémon, form, move and ability it
   names is checked against the data, by its name in any form we display.
2. An answer naming something that isn't in the data is retried once, with
   the failing names given back to the model. If the retry fails too, the
   person sees "I couldn't answer that from the data" and the lookups that
   were made.
3. A number in an answer (a stat, a multiplier, a points value, a record)
   must appear in that answer's lookups. An answer with a number that
   doesn't is treated as failing the check.
4. The check's result is recorded with the run.
5. What the check proves, and what it doesn't: it proves every name and
   every number in an answer is in the data and its lookups. Other
   statements (that a Pokémon "walls" another, say) are held to the
   lookups by the model's instructions and measured by the evaluation
   (section 8), not proven answer by answer.

### 5. Team explanation

1. On `/team-check`, "Explain my team" sends the computed weaknesses,
   resistances and coverage (from spec 005's arithmetic), never just the
   names, and the model explains them in a short paragraph.
2. "Suggest a fix for Ice" asks the code for forms that cover the named
   weakness and keep the rest of the team's coverage; the model explains
   the top three the code found. It never suggests a form the code didn't
   propose.
3. Both are labelled as written by AI from the team check.

### 6. Allowance, budget, cache

1. Each signed-in person has a daily AI allowance: 20 requests, counted per
   calendar day in UTC. Plain-language search, Ask and the team
   explanation each count one per request; a cached answer counts too, so
   the number a person sees is easy to follow.
2. A global daily budget caps all model calls across all people, below the
   provider's free limits (configuration). When it's spent, every AI
   feature shows "AI is resting until tomorrow (00:00 UTC)" and the rest of
   the app works.
3. `/me` shows "AI today: 16 of 20 left".
4. A spent allowance shows "Today's AI allowance is used. It resets at
   00:00 UTC." in place of the feature; the plain version (filters, the
   team check's arithmetic) stays.
5. Answers are cached. The cache key holds everything that shaped the
   answer: the feature, the prompt's version, the provider and the model,
   the question as normalised (or, for a team explanation, the computed
   facts about the team and the candidates the code proposed, in order), the language it's answered in, the subject, the
   data's version, the conversation it follows, and for league data the
   league, the person's role in it and, separately, whether they're an
   admin. An answer that read the person's own data (their roster, their
   matches) is never cached. A cached answer is returned only to someone
   the key allows. A cache hit is recorded as a run with no model call,
   and counts against the person's allowance like any other request.

### 7. Privacy and safety

1. No Discord ID, account detail or session data goes to a model. A
   person's own question is sent; their name isn't.
2. Text people wrote (the question, team names, league names) reaches the
   model as data in a marked section, never as instructions. The model's
   instructions say that text in that section is data to answer about.
3. A model's output is shown as text: links come only from the grounding
   check's matches, never from the model's markup.
4. `/legal` names the provider, the model, whether the provider keeps
   requests or trains on them, and what each feature sends (spec 014
   completes the page).

### 8. Tracing and evaluation

1. Every run is recorded: who (an internal ID, never sent anywhere), the
   feature, the model, the prompt's version, a hash of the input, the
   lookups, the output, the grounding result, tokens, whether it came from
   the cache, and how long it took. A person can see their own runs'
   count on `/me`; only the owner sees the rest. A person's questions and
   answers are in their data download (spec 006), and deleting the account
   deletes them.
2. An evaluation set in the repository holds fixed questions with the facts
   their answers must state and the names they must not invent. Running it
   gives a score per feature, compared with a recorded baseline; a drop is
   a failure.
3. The evaluation runs on demand with a provider key, before any change to
   a prompt or a model is merged. The grounding check itself is plain code
   and is tested on every build without a model.

### 9. Languages

1. The assistant answers in the asker's language, taken from the page;
   Pokémon, form, move and ability names stay in English inside the answer
   (ADR 0007).
2. Lookups and the grounding check work on the English names, wherever
   they appear in the text.
3. Plain-language search accepts questions in English or Hindi and returns
   the same filters.
4. The allowance, errors and "AI unavailable" are shown in the page's
   language.
5. The evaluation set includes Hindi questions, scored like the English
   ones.

## Rules and edge cases

- **Ambiguous names.** "Rotom" in an answer is the Pokémon; a form must be
  named as the data names it ("Rotom-Wash"). A name that is both a Pokémon's
  and a move's, or a move's and an ability's, passes if it's in either.
- **A question about something we don't have** (a game whose data is
  incomplete): the lookups return nothing, and the answer says the data
  doesn't have it.
- **The AI off.** With no provider configured, every AI control is hidden
  and nothing else changes.
- **Abuse.** A question over 500 characters is refused before any call.
- **Streaming.** An answer is shown when it's complete and checked, never
  while it's written.

## Screens

- **`/ask`:** [spec 001's Ask](../001-interface/spec.md#ask-ask-spec-012).
  States: signed out ("Sign in to ask"), allowance used, AI unavailable,
  failed the grounding check, too broad.
- **`/dex` and `/moves`:** the search box from spec 001 gains the "AI read
  this as:" chips row.
- **`/team-check`:** a card under coverage with "Explain my team" and one
  "Suggest a fix for …" per uncovered weakness.
- **The shell:** "Ask" joins the bottom tabs (fifth) and the sidebar.
- **`/me`:** "AI today: 16 of 20 left".

## Acceptance criteria

1. With the provider switched by configuration alone, every AI feature
   works with the second provider; no feature's code changed.
2. Plain-language search on `/dex` returns filters only; the chips match
   the address; a filter value not in the data is dropped and named.
3. No answer reaches the page without lookups; a test with a stubbed model
   that answers without lookups shows nothing but the "couldn't answer"
   state.
4. The grounding check rejects an answer naming a Pokémon, form, move or
   ability not in the data, and one with a number not in its lookups; it
   accepts correct answers. Tested on every build with fixed answers.
5. A failing answer is retried once and then refused, shown by a test with
   a stubbed model.
6. League lookups for a non-member return nothing; a member sees only what
   their role allows. Tested against the server's real permission checks.
7. The 21st request of a day is refused with the allowance message; the
   global budget's limit turns every AI feature off with the resting
   message; both reset at 00:00 UTC. Requests arriving at the same moment
   can't together go past either limit.
8. A repeated question returns the cached answer with no model call,
   recorded as a cached run; the same question in another league, by a
   viewer instead of a coach, by an admin instead of a coach who isn't
   one, in the other language, with another provider or another model, for
   a team whose computed facts or proposed candidates differ, or as a follow-up to a different conversation,
   isn't served from that cache entry; an answer that read the asker's own
   data is never served to anyone else; a cached answer requested with the
   allowance used is refused.
9. No request to the provider contains a Discord ID or a session
   identifier, shown by a test that inspects outgoing requests.
10. Every run is recorded with the fields above.
11. The evaluation set runs with one command and reports a score per
    feature against the baseline in the repository.
12. With the AI off, every page passes its own acceptance criteria.
13. `/ask` passes axe and keyboard use; a new answer is announced once,
    when complete.
14. A follow-up whose earlier turns aren't the person's own runs is
    refused; a person's data download includes their questions, lookups
    and answers, and deleting the account deletes all three.
15. A question asked in Hindi gets a Hindi answer that names Pokémon in
    English and passes the grounding check, and a Hindi plain-language
    search returns filters valid against the same schema.
16. `/ask` is served with the per-response nonce CSP (spec 006), and
    sends one CSP header.

## Out of scope

- AI for leagues: suggestions, recaps, the digest, trade and roster
  explanations (spec 013).
- Embeddings or semantic search over descriptions.
- AI without signing in.
- Voice, images or files in a question.

## Changes

- 2026-10-21: written.
- 2026-10-21: audit fixes: the conversation kept on the server, the
  cache key holding the conversation and, for the asker's own data, the
  person; personal data exported and deleted.
- 2026-10-21: final audit: the nonce CSP extended to `/ask`.
- 2026-10-21: review fixes: what the grounding check proves stated
  plainly; the language and admin status in the cache key; limits that
  hold under concurrent requests; lookups deleted with an account.
