# 009: Season

| Status  | Owner             | Written    |
| ------- | ----------------- | ---------- |
| Written | Aswini Kumar Sahu | 2026-10-21 |

## Goal

After the draft, the season runs itself: a schedule of weeks, results read
from the battles' replays and confirmed by both coaches, and standings and
stats that are right without anyone typing them in.

## Where this comes from

The [project doc](../../project-doc.md): "Results come from the battle
log", "Code and data decide every number", "Where this is likely to go
wrong" ("Reading battle logs"), "What has to be true before this ships"
(five real replays), "Stored replays have rules before they're stored",
and three of its open questions, answered below. Screens: [spec
001](../001-interface/spec.md) ("League home", "Schedule", "A match",
"Stats", "A coach's roster"). Words: [the glossary](../../../GLOSSARY.md)
("The season").

## Requirements

1. **The schedule.** When the draft completes, an admin publishes the
   schedule: the first week's start date, then the generated matches. Each
   week lasts seven days, from midnight in the league's time zone (spec
   007); everyone sees dates in their own time zone with the league's
   beside them. Until a week's first result is reported, an admin can
   change its matches and dates.
2. **Generated fairly.** A round robin: with _n_ coaches, each meets every
   other once in _n_ − 1 weeks (_n_ weeks with a bye each when _n_ is odd).
   A league with fewer weeks plays the first rounds; with more, the round
   robin repeats.
3. **A match** is two coaches' meeting in a week, decided by the season's
   battles per match: one, or best of three.
4. **Showdown names.** Each coach gives their Pokémon Showdown username
   when they join (spec 007) and can change it on their membership; an
   admin can too. Replays are matched to coaches by it.
5. **Reporting a result.** Either coach pastes the replay link of each
   battle, in order. The server checks each link, downloads each replay
   once, while the coach waits, reads its battle log, and fills in each
   battle's winner, the Pokémon left on each side, and each Pokémon's KOs
   and faints. The coach sees the result before sending it.
6. **Confirming.** The other coach confirms or disputes it, with a reason;
   an admin can confirm any reported result. A report nobody disputes
   confirms itself 48 hours after its week ends (in the league's time
   zone), and says so: "Auto-confirms on {date}". A confirmed result
   counts; a disputed one goes to the admins, who confirm it as it is,
   correct it, or enter it by hand. A week is **complete** once each of
   its matches is confirmed or a bye; the confirmation that completes it
   records when.
7. **By hand.** A coach or an admin can enter a result without replays:
   each battle's winner and the Pokémon left on each side, KOs optional.
   It's marked "Entered by hand" everywhere it shows and still needs the
   other coach's confirmation (or an admin's).
8. **Standings** from confirmed results only: wins, losses, differential,
   and the place each coach holds.
9. **Stats** from confirmed battles read from replays: KO leaders (direct
   and passive shown apart), faints, most used forms, each coach's record
   and differential, and on a coach's page each rostered form's battles,
   KOs and faints.
10. **The season ends** when every match of the last week is confirmed, or
    an admin ends it; it's then finished: its standings are final and the
    league becomes read-only (spec 007 shows the finished state).
11. **What we hold is exportable and deletable.** A person's reports,
    confirmations and Showdown name are in their data download (spec 006);
    deleting the account anonymises them and removes the Showdown name.
12. **In the page's language.** Every string comes from the dictionaries,
    errors and warnings included; Pokémon names stay English. Week dates,
    report times and "Auto-confirms on …" are shown in the viewer's time
    zone with the league's beside them (ADR 0007).

## Rules and edge cases

**Links and replays**

1. A link must be a Showdown replay: `replay.pokemonshowdown.com/` followed
   by a replay ID (a format, a number, and for private replays a password
   ending in `pw`), with or without `https://` and `.json`. Anything else
   is refused before any download.
2. Each replay is downloaded once, kept with its battle log, format and
   upload time, and never downloaded again. A replay counts once per
   league: pasting it for a second battle is refused.
3. A private replay's link contains its password. It's shown only to the
   league's members, never written to logs, and never sent to an AI model
   (spec 013).
4. A replay that can't be downloaded (gone, private without its password,
   or Showdown unreachable after one retry) says so, and offers entering
   the battle by hand. Only Showdown's replay server is ever asked, a
   redirect is refused, and an answer that isn't a small JSON document is
   refused.

**Checks on a replay** (errors stop the report; warnings are shown to the
confirming coach and the admins)

5. Error: its two players aren't the two coaches' Showdown names (compared
   as Showdown does, lowercase letters and digits only).
6. Warning: its format isn't one of the season's formats (spec 007).
   Leagues sometimes play a custom challenge; a result with this warning
   needs an admin to confirm it, not only the other coach.
7. Error: a Pokémon in it doesn't map to a form in our data (never guessed:
   the report says which name).
8. Warning: a form used isn't on that coach's roster at the time of the
   match.
9. Warning: it was uploaded before the week started.
10. For best of three: the battles must decide the match in order (no third
    battle after 2–0, no unfinished match).

**Reading a battle log** (all in the battle-log package, each with a test)

11. **Who's who.** A Pokémon in the log is known by its side and nickname;
    its form comes from the details when it switches in. A form change in
    battle (Mega Evolution, Terastallisation, a form that changes on its
    own) stays credited to the form it entered as. Illusion: when the log
    says Illusion ended, every event since that Pokémon switched in
    belongs to the Pokémon revealed, not the one it looked like.
12. **The winner** is the coach the log names as winner. A tie decides
    nothing: the coaches replay it, or an admin enters the result.
13. **Pokémon left** on a side: the Pokémon it brought (from team preview)
    minus those that fainted. A side that forfeits or loses on time counts
    zero left; the winner counts its own unfainted Pokémon.
14. **A faint** is counted for the Pokémon that fainted, every time.
15. **A KO** is credited to the opposing Pokémon that caused the faint:
    - **Direct:** the faint follows damage from an opposing Pokémon's move.
      The move's user gets the KO.
    - **Passive:** the damage came from an effect the log ties to an
      opposing Pokémon: poison, bad poison or a burn it inflicted; entry
      hazards it set (Stealth Rock, Spikes, Toxic Spikes' poison); Leech
      Seed; weather it set; a trapping or lingering move it used (Bind,
      Salt Cure, Curse and the like); its ability or item hurting an
      attacker (Rough Skin, Rocky Helmet); Destiny Bond or Perish Song it
      used. That Pokémon gets the KO.
    - **No one:** recoil, Life Orb, a self-destructing move (Explosion,
      Memento, Final Gambit, Healing Wish), confusion, Struggle, a move
      hitting its own ally, and any damage whose source the log doesn't
      name. The faint still counts; it's noted as "no KO".
    - A forfeit or a loss on time credits no KOs.
16. **Doubles** follow the same rules, by the Pokémon named in each line.

**Results, standings and stats**

17. A battle's differential for a coach: their Pokémon left minus the
    opponent's. A match's: the sum over its battles. A coach's: the sum
    over their confirmed matches.
18. A bye counts nothing.
19. **Places:** by wins, then differential, then the record between the
    tied coaches (only if every tied coach has played every other the same
    number of times), then direct KOs. Coaches still level share the place,
    shown "3=". There's no coin toss.
20. A correction to a confirmed result (by an admin) recomputes standings
    and stats, and is recorded with who made it and why.
21. Stats count only battles read from replays; by-hand results count in
    standings but add no KOs unless entered.

**The project doc's open questions, answered here**

- KOs no move caused: rule 15. This replaces "How a KO is credited when no
  move caused it".
- Playoffs: not in v1. This replaces "Whether the season has playoffs".
- Keeping data: a finished league's results, replays and stats stay until
  an admin deletes the league; deleting it removes them. A deleted account
  shows as "A former coach" and its Showdown name is removed. Replays are
  visible to the league's members only. This replaces "How long a finished
  league's data is kept" and fills in "Stored replays have rules before
  they're stored".

## Screens

From [spec 001](../001-interface/spec.md), with:

- **Schedule:** each match's status in words: upcoming, reported (waiting
  for {coach}), confirmed, disputed; byes shown as "Bye".
- **A match:** each battle's winner, Pokémon left on each side, each
  Pokémon's KOs (direct and passive) and faints, the replay link, and any
  warnings. "Report a result" for its coaches; "Confirm" and "Dispute" for
  the other coach; "Settle" for admins.
- **Reporting:** paste links (one field per battle), "Read replays", a
  preview of what was read with its warnings, then "Send for
  confirmation". Errors name the battle and the reason.
- **League home:** the standings table and this week's matches.
- **Stats:** one leaderboard at a time on a phone.
- **A coach's roster:** adds the record, differential, and each form's
  battles, KOs and faints.
- **Membership:** a "Showdown username" field on the member's settings in
  the league.

## Acceptance criteria

1. The schedule generator gives every pair one match per round robin, one
   bye per week for odd _n_, for 2 to 24 coaches (unit tests).
2. Five real replays (in the plan), parsed, give the score, Pokémon left,
   KOs and faints that a person counted by watching them, including a
   forfeit, Illusion, Destiny Bond, entry hazards and a doubles battle.
3. Each rule in "Reading a battle log" has a unit test with a log excerpt.
4. A replay with the wrong players or an unknown Pokémon is refused with
   the reason; a wrong format and the other warnings are shown and don't
   block, and a wrong format needs an admin's confirmation.
5. A replay is downloaded once, however many times it's read, and a replay
   reused in the same league is refused; a redirect, an answer over 2 MB or
   one that isn't JSON is refused.
6. Results count in standings only once confirmed; a dispute reaches the
   admins; a by-hand result is marked wherever it shows.
7. Standings follow rule 19, including shared places (unit tests).
8. A private replay's password doesn't appear in server logs or in
   responses to non-members (a test inspects both).
9. The schedule, match, stats and league home pages pass axe at 360 px and
   1280 px in both themes and work by keyboard alone.
10. An undisputed report confirms itself 48 hours after its week ends, in
    the league's time zone; an admin can confirm any reported result.
11. IDs from another league (a match, a member) are refused; a person's
    data download includes their reports and confirmations, and deleting
    the account anonymises them.
12. The schedule, a match and the stats work in English and Hindi, with
    week edges and "Auto-confirms on …" shown in the viewer's and the
    league's time zones.

## Out of scope

- Playoffs, multiple seasons per league, transfer windows.
- Match recaps and the weekly digest (spec 013).
- Posting results to Discord (spec 011).
- Watching a replay inside Coachlore: the link opens Showdown.

## Changes

- 2026-10-21: written.
- 2026-10-21: audit fixes: replays read while the coach waits (no job),
  safe fetching, a wrong format is a warning, admins confirm, reports
  auto-confirm, the league's time zone, the finished season, personal
  data.
