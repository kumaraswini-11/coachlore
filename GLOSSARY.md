# Coachlore

A Pokédex and a home for Pokémon draft leagues. Each term below has one
meaning, used the same way in the specs, the code and the interface; the
words under _Avoid_ name the same thing and aren't used for it. Format:
the `domain-modeling` skill's GLOSSARY-FORMAT.md. "Fixture" is used only
for test data, never for a match.

## Pokémon data

**Pokémon**:
A species, such as Rotom: what the Dex has one page for. The plural is also
"Pokémon".
_Avoid_: species (in the interface), monster, mon

**Form**:
One version of a Pokémon with its own types, stats or abilities, such as
Rotom-Wash; every Pokémon has at least one, its default form. Leagues draft
forms, not Pokémon.
_Avoid_: variant, alt, forme

**Type**:
One of the eighteen elements (Fire, Water, …) that decide matchups. A form
has one or two.
_Avoid_: element, typing (as a noun for one type)

**Move**:
An action a form can use in battle, with a type, a category and a power.
_Avoid_: attack, skill, technique

**Ability**:
A form's passive trait; a form has up to three, one of them possibly hidden.
_Avoid_: trait, passive, skill

**Game**:
A release that shares one Pokédex, such as Scarlet and Violet.
_Avoid_: title, edition; "game" for one battle

**Version**:
One of a game's editions, such as Scarlet, where encounters and exclusives
differ.
_Avoid_: cartridge, edition

**Generation**:
The numbered era a Pokémon, form or move was introduced in, such as
Generation IX.
_Avoid_: gen (in the interface)

**Format**:
The rules a battle is played under on Showdown, such as Gen 9 National Dex;
a season allows one or more, and the first is its default.
_Avoid_: ruleset, tier (for the format), meta

**Dex**:
Coachlore's public reference to Pokémon, forms, types, moves and abilities,
open to everyone without signing in.
_Avoid_: Pokédex as the name of our section (it's allowed as a plain noun in
page titles and descriptions, where people search for it, and when quoting
a game's), database, wiki

**Team**:
Up to six forms put together in the team check to see their weaknesses and
coverage. It belongs to no league.
_Avoid_: party; "team" for a coach's league roster

**Team check**:
The Dex's tool that shows what a team is weak to and what it can't hit.
_Avoid_: team builder, team analyser

## Leagues

**League**:
A group that drafts and plays together, with its own rules, tier list and
members.
_Avoid_: group, server, competition

**League time zone**:
The time zone (an IANA name, such as Europe/London) a league's draft start,
weeks and reminders are set in; each time is shown in the viewer's own zone,
with the league's beside it.
_Avoid_: server time, local time (alone)

**Member**:
A signed-in person who belongs to a league, as a coach or a viewer; any
member may also be an admin.
_Avoid_: user (inside a league), participant

**Admin**:
A member who runs the league: its settings, tier list, members, schedule and
approvals. A league has at least one, and an admin may also be a coach.
_Avoid_: commissioner, owner, organiser, mod

**Coach**:
A member who drafts a roster and plays matches.
_Avoid_: player, trainer, manager, drafter

**Viewer**:
A member who can see the league but doesn't draft or play.
_Avoid_: spectator, guest, follower

**Invitation**:
A link an admin shares to let someone join a league in a given role.
_Avoid_: invite code, join link

**Season**:
One draft and the weeks of matches that follow it, ending in final
standings.
_Avoid_: split, cycle, year

**Tier list**:
A league's price list: each form's tier, or that it's banned.
_Avoid_: price list, draft board, rankings

**Tier**:
A named price band in a tier list, such as "S, 18 points"; every form in it
costs that many points.
_Avoid_: rank, bracket, class

**Points**:
What a form costs to draft, set by its tier.
_Avoid_: cost, price, credits, value

**Budget**:
The points a coach may spend on a roster in a season.
_Avoid_: cap, salary cap, wallet

**Pool**:
The forms still available to draft: priced in the tier list, not banned and
not yet picked.
_Avoid_: free agents, available list

## The draft

**Draft**:
The event, run live by the server, in which coaches take turns to pick
forms until every roster is full.
_Avoid_: auction (a different format), selection

**Pick**:
One form taken by one coach in the draft, final once the server stores it.
_Avoid_: selection, choice, draft (for one pick)

**Turn**:
The span in which one coach may pick, ended by a pick or by the timer.
_Avoid_: go, slot

**Make-up turn**:
A turn added at the end of the draft for a coach whose turn passed with no
pick and no auto-pick.
_Avoid_: bonus pick, extra round

**Round**:
One pass through the draft order, in which each coach has one turn.
_Avoid_: lap, cycle

**Draft order**:
The order coaches take their turns in: _snake_ reverses each round
(1→8, then 8→1); _linear_ repeats it (1→8 every round).
_Avoid_: pick order, sequence, serpentine

**Timer**:
How long a turn lasts before auto-pick takes it.
_Avoid_: clock, countdown (as the name of the setting)

**Wishlist**:
A coach's private, ordered list of forms they'd like, used by auto-pick.
_Avoid_: queue, watchlist, shortlist, board

**Auto-pick**:
The pick the server makes when a coach's timer runs out: the first form on
their wishlist they can still afford.
_Avoid_: auto-draft, bot pick, AI pick

**Roster**:
The forms a coach owns in a season, from the draft and trades. The league's
screens for them are "Rosters" (`/l/[league]/rosters` and
`/l/[league]/rosters/[coach]`).
_Avoid_: team, squad, box, party

## The season

**Week**:
A numbered stage of the season's schedule, in which each coach plays their
scheduled match.
_Avoid_: round (that's the draft's), matchday, gameweek

**Match**:
Two coaches' meeting in a week, decided by one or more battles.
_Avoid_: game, fixture, series, set

**Bye**:
A week in which a coach has no match, because the league has an odd number
of coaches.
_Avoid_: rest week, skip

**Battle**:
One Pokémon Showdown battle between two coaches' rosters.
_Avoid_: game (that's a release), fight, duel

**Replay**:
Showdown's saved copy of a battle, at a public address, which a coach
pastes to report it.
_Avoid_: recording, VOD, link (alone)

**Battle log**:
The text inside a replay that records every event of the battle; the parser
reads it.
_Avoid_: protocol, transcript, log (alone)

**Report**:
A coach's submission of a match's replays, or a score typed by hand,
waiting for the other coach to confirm or dispute it.
_Avoid_: submission, claim

**Result**:
The outcome of a match, confirmed by both coaches or settled by an admin:
the winner and each battle's score.
_Avoid_: score (for the whole result), outcome, report

**Dispute**:
A coach's objection to a reported result, which an admin settles.
_Avoid_: appeal, challenge, complaint

**Faint**:
A Pokémon in a battle reaching zero HP.
_Avoid_: death, kill (for the event)

**KO**:
A faint credited to the opposing Pokémon that caused it, by the rules
stated for the cases no move caused.
_Avoid_: kill, K.O., knockout (in the interface)

**MVP**:
A match's most valuable Pokémon, computed by code: the most KOs, then the
fewest faints, then the first KO.
_Avoid_: star, player of the match

**Differential**:
Across a coach's matches, the Pokémon they had left standing minus the
Pokémon their opponents had left: the first tiebreaker after wins.
_Avoid_: diff, margin, goal difference

**Standings**:
The table of coaches ordered by wins, then differential.
_Avoid_: table, ladder, leaderboard, rankings

**Trade**:
An exchange of forms between two coaches' rosters, with points checked and,
if the league asks, an admin's approval.
_Avoid_: swap, transfer, deal

## AI

**Assistant**:
The AI that answers questions about the data, showing the lookups it made
before it answers.
_Avoid_: chatbot, bot (that's Discord's), AI (as a noun for this feature)

**Lookup**:
One query the assistant makes against our data to ground an answer.
_Avoid_: tool call, search (in the interface)

**Grounding check**:
The check that every Pokémon, form, move or ability an answer names exists
in our data; an answer that fails it isn't shown.
_Avoid_: validation, fact check, hallucination filter

**Suggestion**:
A pick the AI recommends from candidates the code worked out, shown only to
the coach whose turn it is.
_Avoid_: recommendation, AI pick, auto-pick

**Write-up**:
A recap or a digest: text the AI writes for a league from its facts.
_Avoid_: article, post (that's Discord's), story

**Recap**:
A short write-up of one match, written by the AI from its parsed battle logs.
_Avoid_: summary, report, story

**Digest**:
A weekly write-up of a league's week, from the results and standings.
_Avoid_: newsletter, roundup, summary

**AI allowance**:
How many AI requests a person may make a day; when it's spent, AI features
say so and everything else works.
_Avoid_: quota (in the interface), credits, limit (alone)

## Discord

**Bot**:
Coachlore's Discord application, which posts a league's picks, results,
trades and reminders to its channel.
_Avoid_: integration, webhook (as the product name), assistant

**League language**:
The language a league's bot posts and AI write-ups use, chosen by its
admins; each person still sees the site in their own language.
_Avoid_: locale (in the interface)

**League channel**:
The Discord channel a league's admin links for the bot's posts.
_Avoid_: server (that's the whole Discord community), feed
