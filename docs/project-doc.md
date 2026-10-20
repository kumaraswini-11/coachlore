# Draftboard

| Status | Owner             | Last updated |
| ------ | ----------------- | ------------ |
| Draft  | Aswini Kumar Sahu | 2026-10-20   |

The product decisions behind this build, written before it starts, with the reasoning attached. The reasoning matters more than the decision: you'll hit forks this doesn't cover, and you'll need to know which way the thinking was leaning.

Read the part you need before you build something. Don't read it all at once, and don't paste it into a prompt. The research behind it is in [docs/research/](research/).

## What it is

Two things on one website.

**The Dex.** Open it on a phone, type a name or a question, and find any Pokémon: its stats, what it's weak to, how it evolves, where to catch it in your game, which moves it learns, and how it's used competitively. Build a team of six and see at a glance what it's weak to and what it can't hit. No sign-in, no ads, and it keeps working without a connection.

**Leagues.** Sign in with Discord, create a draft league and invite your friends. Each coach drafts a team of Pokémon in a live draft room, each Pokémon priced in points. Through the season, coaches play their matches on Pokémon Showdown and paste the replay; Draftboard reads the battle, updates the standings and the stats, handles trades, and posts it all to the league's Discord channel.

Where a model helps, it explains: it turns a question into filters, explains why a team is weak to Ice, suggests a pick from options the code worked out, and writes a match recap from what really happened in the battle.

## The problem

**For draft leagues:** they run on spreadsheets and Discord. A commissioner keeps a sheet of tiers and points, a sheet of rosters, a sheet of the schedule, and copies every result in by hand. The draft itself happens in a Discord channel, one message per pick, with someone checking by eye that nobody took a Pokémon twice or went over budget. It works because commissioners are patient. It breaks when they're busy, and every league rebuilds the same sheets from scratch.

**For everyone else:** the good Pokédex sites are dense, desktop-first and carry ads that cover the content; the competitive tools are hard to use on a phone. Finding "where do I catch this in my game" or "what does my team lose to" means three tabs and some arithmetic in your head.

## Who it's for

**A draft league commissioner and their coaches.** Eight to sixteen friends, organised on Discord, playing one match a week. The commissioner wants the league to run itself; the coaches want the draft to feel like an event and the standings to be right without anyone typing them in.

**Anyone who plays the games,** on their phone, mid-game, wanting one answer fast.

This description is the test every feature gets measured against. When something tempting comes up (a tier list of "best Pokémon", a win predictor, a social feed), the question is whether the people above want it. Usually they want the draft to be fair and the standings to be right.

## Goals

How we'll know it worked:

- **A real league runs a season on it:** one league of friends drafts, plays and finishes a season with no spreadsheet beside it.
- **The draft is never wrong:** no Pokémon taken twice, no coach over budget, across every draft run on it.
- **Results need no typing:** most results come from a pasted replay, confirmed by both coaches without a correction.
- **The Dex is quick on a phone:** a Pokémon found and open in a few seconds, meeting Core Web Vitals' "good" thresholds.

And, because this is a personal project built to learn:

- **The hard parts are built for real and written up:** real-time with fairness under concurrency, a state machine, background jobs that retry safely, data imported on a schedule, and AI held to the data by checks and an evaluation. Each with tests and a short note on what it took.

## Why this, and why now

Pokédex sites are a crowded field, and a Pokédex alone is a beginner's project; the Dex here earns its place by being the fastest, calmest one on a phone, and by being the data the Leagues stand on.

League tools are the gap. A few leagues have built their own sites, each for one league. Nothing general has stuck, most likely because the work is in the parts nobody sees: a draft that stays fair when two people pick at the same moment, results that come from the battle rather than from someone's typing, and a bot that posts reliably. That's backend work, and it's the reason this project exists: Draftboard is built to learn and show exactly that kind of work.

That's the bet. It is a bet, and it should be stated as one.

## Alternatives considered

Each was weighed in the research, and each could reasonably have been the project:

- **A Pokédex alone.** Quick to build and well served already; shows interface work but little backend. It survives as half of Draftboard, not the whole.
- **A team builder for competitive play, with usage statistics.** Real users and a ready damage calculator, but strong tools already exist, and its backend is mostly data import.
- **A trading-card collection and price tracker.** Real demand, but the price data is paid or closed to new users, and one app dominates.
- **A project outside Pokémon** (an invoicing platform, for example). Would show payments and billing, which a non-commercial Pokémon project can't. Kept for later; this one wins on being something the owner will finish and real people will use.

## Appetite

Part-time, about twelve weeks for the first version: eight for the Dex, Leagues and the draft room, four for the AI features and polish. Time is fixed and scope is not: when something takes longer than planned, the feature shrinks, the deadline doesn't move.

## The rules everything rests on

**Code and data decide every number.** Stats, matchups, points, scores, standings, KOs: each comes from data or arithmetic. The AI may explain, and it may choose among options the code computed. It may never produce a number, invent a Pokémon, or decide a result.

The reason: a league runs on trust. If a recap says a Pokémon got three KOs and it got two, or a suggestion names a Pokémon the league banned, every number on the page becomes a maybe. So every Pokémon, move or ability an answer names is checked against the data before it's shown, and the app works with the AI turned off.

**The server decides the draft.** Whose turn it is, whether a pick is allowed, and what's been taken are decided in one place, by the server, and a Pokémon can be taken once per league. The interface shows the draft; it never decides it. A draft that lets two coaches take the same Pokémon, even once, has failed at the one thing it's for.

**Pokémon belongs to others.** Draftboard is an independent, unofficial, non-commercial project: no ads, no paid tiers, no app-store app, as few official images as possible, a clear notice that it isn't affiliated, and no scraping of game servers. Pressure to break this will come from wanting the app to look more official. It's refused.

## Scope

- **The Dex:** browse and filter every Pokémon (type, weakness, game, generation, ability, stats), a page for each, moves and abilities, a type chart, a game's own Pokédex, and a team checker.
- **Plain-language search,** turned into filters the user can see and edit.
- **Offline Dex and mobile first:** every screen designed at phone width first.
- **Sign-in with Discord,** for identity only; the Dex never needs it.
- **Leagues:** creation, invitations, roles (admin, coach, viewer), rules, and a points-based tier list.
- **The live draft room:** snake or linear order, a timer, a wishlist with auto-pick, every pick seen by everyone at once, and reconnection that catches up from the server.
- **The season:** a schedule, results read from Showdown replays and confirmed by both coaches, trades with approval, standings and stats.
- **A Discord bot** that posts picks, results, trades and reminders.
- **AI that shows its work:** an assistant that looks facts up before it answers, explanations of teams and trades, draft suggestions only the picking coach sees (and a league can switch off), match recaps and a weekly digest written from parsed facts.
- **A check that the AI never names a Pokémon, move or ability that isn't there,** and an evaluation that turns answer quality into a number.
- **Running in public:** limits per user so the AI's quota lasts, error reports that carry no personal data, security headers, and speed and accessibility measured rather than assumed.

## Out of scope, and why

Each of these is something a model will propose, because each sounds like an improvement. The reason matters more than the refusal.

- **Simulating battles.** Showdown does it, and does it well. Draftboard reads the result; it never plays the match.
- **Money.** Ads, subscriptions, tips behind features: the franchise's terms rule them out, and a personal project doesn't need them.
- **A mobile app in the stores.** Pokémon apps get taken down. A website that works well on a phone, and offline for the Dex, is the answer.
- **The trading card game, Pokémon GO, and other games' formats.** Each is a product of its own. Getting the main-series games and draft leagues right is the whole proposition.
- **The AI picking for you.** Auto-pick drafts the first available Pokémon from the coach's own wishlist. A model drafting a team is a different game, and not this one.
- **Win predictions and "best Pokémon" rankings.** Once there's a score, people argue with the score. Draftboard shows usage, records and matchups, and lets coaches decide.
- **Scraping.** Data comes from public sources that allow it, cached as they ask; game servers are never touched.

## How it works

No stack and no folder names here; those are recorded as decisions. These are constraints on behaviour.

**The core is isolated and framework-agnostic.** The league rules (draft order, points, trade validation, standings), the Pokémon data model and the battle-log parser are plain code: no web framework, no interface, no storage. Each must run from a plain script and be tested on its own. If one can't, the layering is wrong.

**Pokémon data is ours once it's imported.** Public data is imported into our own database on a schedule, never fetched from its source while a page loads. That keeps the Dex fast, keeps us within the source's fair use, and lets a gap for a new game be filled by hand.

**A Pokémon and a form are different things.** Rotom and Rotom-Wash are one species and two forms with different types, stats and tiers, and leagues draft forms. The data model gets this right from the start, because everything (search, tier lists, rosters, stats) depends on it.

**The draft is a state machine on the server.** Each pick is a transaction that checks the turn, the points and availability, and the database enforces "one Pokémon, once, per league". The room is told about each pick after it's stored, never before. A coach who reconnects asks the server for the state; the browser never guesses it.

**Results come from the battle log.** A Showdown replay is downloaded once, kept, and parsed by code into the score, each Pokémon's KOs and faints, and the winner. Both coaches confirm. Typing a result by hand stays possible, and says so.

**Anything the outside world hears about goes through a queue.** Discord posts, recaps and reminders are jobs, retried on failure. A retry can't know for certain whether the first try reached Discord before it failed, so each job carries an idempotency key and checks whether its effect already happened before trying again: a retried post appears once. Nothing a coach does waits for Discord to answer.

**The AI is provider-agnostic, traced and cached.** Models are reached through one interface; every call is traced, answers are cached, and a cache hit is a recorded run with no model call. A cached answer is keyed by everything that shaped it, the league and what the asker may see included, and is returned only to someone allowed to see it. Each person has a daily allowance, and when it's spent, the feature says so and everything else works.

## The interface

A calm, fast app for a phone, not a dense desktop tool. Big artwork, clear numbers, and nothing that jumps while it loads.

**Colour comes from the content.** Each Pokémon type has its colour, and it's the accent wherever that Pokémon is: the header, the stat bars, the badges. Everything else is quiet. Every type colour is paired with text that passes contrast, and a type is always named, never shown by colour alone.

**Designed at phone width first.** Main actions within thumb reach, touch targets big enough for a thumb, panels as sheets that slide up. The desktop gets more columns, not a different app.

**Dark and light, and the user's choice wins.** A first visit follows the system; a choice made survives a reload. Both are real palettes.

**Motion has a reason.** A card grows into its page, a pick is revealed to the room, a standings row climbs. Nothing loops or drifts on its own, and every animation has a still version for people who turn motion off.

**Anything the browser can work out is instant.** Filters, the type chart and the team checker are arithmetic over data already loaded: no spinner, no request.

**The draft room is the centrepiece.** It gets the most care: the timer, whose turn it is and the pick reveal, readable at a glance on a phone and announced to screen readers without talking over the user every second.

## Privacy, security and running it

**Collect as little as possible.** The Dex needs no account and stores nothing about its visitors. Sign-in keeps what Leagues need: a Discord ID, a name and an avatar. A person can delete their account and what it holds. Pokémon's audience includes children, which is one more reason the Dex stays account-free and analytics, if any, keep nothing on the device.

**Everything a person sends is checked on the server:** league settings, picks, trades and results, whatever the interface allowed. Text written by users (team names, chat, replay player names) reaches a model as data, never as instructions.

**A model gets only what the feature needs.** No Discord ID or other account detail goes to a model provider, and names people wrote (team and player names) only when the feature needs them. Each AI feature names the data it sends; a league can turn its AI features off, and then none of its data is sent. `/legal` names the provider and whether it keeps requests or uses them to improve its products (a free tier may).

**Sign-in is Discord's OAuth, done properly:** the `state` parameter checked on return, as Discord's [OAuth2 documentation](https://docs.discord.com/developers/topics/oauth2) recommends (and PKCE, if Discord's documentation confirms it when sign-in is built); an exact redirect URL; sessions in `httpOnly`, `Secure`, `SameSite` cookies, renewed at sign-in and revocable; and protection against cross-site requests on anything that changes data.

**Stored replays have rules before they're stored.** Who can see a league's replays, what deleting an account or a league removes, and how long a finished league's replays are kept are decided and written here before replay storage is built.

**Failures are seen before users report them:** errors and slow requests are reported without personal data, and every job that fails is visible and retried.

**It costs nothing to run while it's small,** on free tiers where they're fit for the job. When a free tier stops being enough, that's a decision recorded with its cost, not a surprise.

## Assumptions

Each of these could turn out wrong; if one does, the plan changes:

- Draft leagues will try a tool that replaces their sheets, if it's easier than the sheets.
- Showdown replays stay public and downloadable with their battle log. This is unofficial, so each replay is kept once downloaded.
- Public Pokémon data (PokéAPI, Smogon's statistics) stays available under its current terms.
- A free tier of a capable model stays available; if it doesn't, the AI features shrink rather than the app.
- The franchise keeps tolerating non-commercial, unofficial tools that credit it and don't imitate it.
- Coaches are old enough for Discord, the only sign-in.

## Where this is likely to go wrong

**The draft under pressure.** Two coaches picking in the same second, a timer that runs out as a pick arrives, a coach who drops and reconnects mid-turn. Each needs a deliberate answer and a test, not a hope.

**Reading battle logs.** Nicknames, forms that change in battle, a Pokémon disguised as another, a forfeit, a KO from poison or weather rather than a move. Some of these make "who got the KO" ambiguous; the rule is to state how each case is counted, consistently, and never to guess quietly.

**Data for a new game.** Public sources take months to catch up after a release. The Dex has to say what it doesn't know yet rather than show something wrong.

**Two products in one.** The Dex is easy to keep polishing and Leagues is where the hard work is. The order of the specs protects Leagues from being starved.

**The AI's free quota.** Free tiers change and shrink without notice. Every AI feature needs a cheap model where one will do, a cache, a daily allowance, and a version of the page that works without it.

## What has to be true before this ships

Not "it looks right". Specifics:

- Ten Pokémon checked by hand, forms included, match what the Dex shows: types, stats, abilities, evolutions.
- In a draft test with many coaches picking at the same moment, no Pokémon is ever taken twice and no coach goes over budget.
- A coach who disconnects mid-draft and comes back sees exactly the server's state.
- Five real Showdown replays, parsed, give the score and KOs a person counts by watching them, with every ambiguous case counted by the stated rule.
- No AI answer names a Pokémon, move or ability that isn't in the data, shown by a check rather than asserted.
- The assistant shows what it looked up before it answers; an answer with no lookups behind it isn't shown.
- With the AI switched off, every page still works.
- A Discord post retried after a failure appears once.
- On a mid-range phone, the Dex meets Core Web Vitals' "good" thresholds, and every page passes WCAG 2.2 AA.
- Every page carries the not-affiliated notice and credits.

## Open questions

Answered in the spec that needs them, then moved into this document's text:

- Which games and formats the first version supports: the current generation only, or older ones too.
- How a KO is credited when no move caused it (poison, weather, recoil, a forfeit).
- Whether a league's pages can be public, and what a visitor may see.
- Whether the season has playoffs in the first version.
- How long a finished league's data is kept.

## Changes

- 2026-10-20: first draft.
