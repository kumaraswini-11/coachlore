# 008: Draft room

| Status  | Owner             | Written    |
| ------- | ----------------- | ---------- |
| Written | Aswini Kumar Sahu | 2026-10-21 |

## Goal

A live draft that is never wrong: every coach sees every pick at once, no
form is ever taken twice, no coach goes over budget, and a coach who drops
and comes back sees exactly the server's state.

## Where this comes from

The [project doc](../../project-doc.md): "The server decides the draft",
"The draft is a state machine on the server", "The draft room is the
centrepiece", "Where this is likely to go wrong" ("The draft under
pressure") and "What has to be true before this ships" (the draft test and
the reconnect test). The screens are in [spec 001](../001-interface/spec.md)
("Draft room", "A coach's roster"). Words: [the glossary](../../../GLOSSARY.md)
("The draft").

## Requirements

1. **One draft per season.** It's created with the season (spec 007) and
   uses the season's settings: budget, roster size, draft order type
   (snake or linear) and timer.
2. **The draft has four states:** scheduled, live, paused and complete.

   | From      | To       | Who        | When                                              |
   | --------- | -------- | ---------- | ------------------------------------------------- |
   | scheduled | live     | an admin   | the start conditions (rule 1) hold                |
   | live      | paused   | an admin   | any time                                          |
   | paused    | live     | an admin   | any time; the turn gets back the time it had left |
   | live      | complete | the server | the last turn ends                                |

   Nothing leaves complete. The season moves from setup to drafting when
   the draft starts, and to in season when it completes.

3. **The draft order** is set before the start: an admin arranges the
   coaches, or presses "Shuffle" for a random order the server draws. It's
   fixed once the draft starts and shown to everyone.
4. **Turns** follow the order: _snake_ reverses it every second round,
   _linear_ repeats it. A draft has roster size × coaches regular turns,
   plus any make-up turns (rule 6).
5. **A pick** is a form from the pool, chosen by the coach whose turn it
   is (or an admin on their behalf), and allowed by the budget rule
   (rule 3). It's final once the server stores it; only then does anyone
   see it.
6. **The timer.** Each turn lasts the season's timer, from 30 seconds to 24
   hours (so a league can draft live in an evening or slowly over days).
   When it runs out, the server makes an auto-pick.
7. **The wishlist.** Each coach keeps a private, ordered list of up to 50
   forms. Only its owner sees it; the server never sends it to anyone else.
   Forms picked by others drop out of it automatically.
8. **An admin can undo the last pick** while the draft is live or paused:
   the form goes back to the pool, the pick's coach gets the turn back with
   a full timer. Every undo is recorded and shown in the room.
9. **Everyone in the league can watch:** admins, coaches and viewers see the
   board, the pool, whose turn it is and the timer. Only coaches have
   wishlists and turns.
10. **Reconnecting** loads the server's state: the room disables picking
    while disconnected, shows "Reconnecting…", and when the connection is
    back it shows exactly what the server has, saying what changed. It
    works however long the connection was down.
11. **Rosters.** `/l/[league]/rosters` lists every coach with points used
    and left (spec 009 adds the record); `/l/[league]/rosters/[coach]`
    lists the forms a coach owns, each with its points, and links to the
    team check with that roster (`/team-check?team=…`). Spec 009 adds the
    record and stats.
12. **A scheduled start.** An admin may set when the draft is planned to
    start. Everyone sees it in their own time zone, with the league's time
    zone (spec 007) beside it, and a countdown; spec 011 reminds the league.
    The draft still starts only when an admin starts it.
13. **The timer everyone sees** counts down from the server's clock, not
    the device's: a phone whose clock is wrong still shows the right time
    left.
14. **Whose turn, from elsewhere.** While it's a coach's turn, the room's
    browser tab title reads "Your turn · Coachlore", and, signed in,
    `/leagues` (spec 007) and home (spec 003) show "Your turn" on that
    league. Spec 011 posts "{coach}
    is on the clock" to the league channel.
15. **Only members watch.** A member who is removed or leaves loses the
    room at once: their open connection is closed and can't catch up.
16. **What we hold is exportable and deletable.** Wishlists and who made
    each pick are included in a person's data download, and anonymised
    when their account is deleted (spec 006).
17. **In the page's language.** Every string comes from the dictionaries
    (English and Hindi), and screen-reader announcements are in the page's
    language; Pokémon names stay English. The scheduled start, the timer and
    pick times are shown in the viewer's time zone with the league's beside
    them (ADR 0007).

## Rules and edge cases

1. **Start conditions.** At least two coaches; a tier list with at least
   as many priced forms as coaches × roster size; an order covering every
   coach. Members who join after the start are viewers for this draft.
2. **Whose turn.** Regular turn _p_ (counting from 1) with _n_ coaches is
   in round ⌈_p_ / _n_⌉; its position in the order is (_p_ − 1) mod _n_,
   counted from the end in even rounds of a snake draft. Make-up turns
   come after the last regular turn.
3. **The budget rule.** A coach may pick a form costing _c_ only if, after
   it, the points they have left cover every empty slot at the league's
   cheapest tier:
   `budget − spent − c ≥ (slots left after this pick) × cheapest tier`.
   So a coach can always fill their roster while forms in the cheapest
   tier remain. The check runs on the server, inside the pick, every time.
4. **Taken once.** A form can be on one roster per season. Two picks of
   the same form at the same moment: one is stored, the other is refused
   ("Garchomp was just taken") and the coach picks again with the time they
   had left.
5. **Two picks in one turn.** If a coach (or a coach and an admin) submits
   twice for the same turn, the first stored wins and the second is
   refused, even if they name different forms. A resubmission of the same
   request (a double tap, a retried request) returns the first result.
6. **Auto-pick and make-up turns.** When the timer runs out, the server
   picks the first form on the coach's wishlist that is still in the pool
   and allowed by the budget rule. If there isn't one, the turn is
   **skipped**: the coach gets a make-up turn after the last regular turn,
   in the order turns were skipped. A make-up turn that also runs out with
   no auto-pick is forfeited: that roster ends one short.
7. **A pick that arrives as the timer ends.** The server decides by the
   time it stores the pick: before the deadline, the coach's pick stands;
   at or after it, the auto-pick stands and the coach's pick is refused
   ("Time ran out; your wishlist's first choice was drafted").
8. **Nothing affordable.** If, on a coach's turn, no form in the pool is
   allowed by the budget rule, the turn is skipped at once, as in rule 6.
9. **Pausing** stops the timer and keeps the remaining time; picks are
   refused while paused, and auto-pick doesn't run.
10. **Undo** applies only to the last stored pick, not a skipped turn. An
    auto-pick can be undone like any pick.
11. **The server restarts mid-draft.** The deadline is stored, not only
    held in memory: on restart the server resumes each live draft's timer
    from its stored deadline, and a deadline that passed while it was down
    is acted on at once. A deploy waits while a draft is live (spec 006).
12. **A coach leaves the league mid-draft.** Their turns continue as
    auto-picks from their wishlist; an admin can pick for them, or use
    "Replace coach" (spec 007), after which the replacement's turns are
    those turns and the roster is theirs.
13. **Order of what everyone sees.** Every change to a draft gets the next
    number in that draft's sequence. Clients apply changes in that order;
    a client that sees a gap asks the server for what it missed.
14. **Announcements for screen readers** (spec 001): each pick once ("Misty
    drafted Kingambit, 17 points"), each change of turn, and the time left
    at 30 and 10 seconds for the coach whose turn it is; never every
    second.
15. **No league channel.** Starting a draft whose timer is 10 minutes or
    more in a league with no linked channel asks the admin to confirm:
    "Coaches won't be told it's their turn outside the room." Until spec
    011 adds channels, every such draft asks.

## Screens

From [spec 001](../001-interface/spec.md), "Draft room" and "A coach's
roster", with:

- **On a phone:** three tabs, Board · Pool · Roster. The app's bottom tabs
  are hidden in the room, the status bar shrinks to one line as the pool
  scrolls, and "Draft" stays within thumb reach.
- **Wishlist:** a star on each pool row adds or removes the form; a
  "Wishlist" filter shows only starred forms, in order, with buttons to
  move each up or down; the Roster tab lists it under the roster.
- **Status bar:** round and pick ("Round 3 · pick 21 of 64"), the timer,
  whose turn it is, and for a coach, their next turn and points left
  ("You: in 2 picks · 48 points left"). A make-up turn says so.
- **Pool:** every available form with its points and types, filtered by
  tier, type and name; forms the coach can't afford under the budget rule
  are marked "Over budget" (in words) and can't be drafted.
- **Board:** a table, coaches by round; each cell the form and its points,
  "skipped" or "auto" in words where it applies.
- **Before the start:** the order (admins can arrange it or shuffle), the
  settings, the scheduled start with its countdown, and for admins "Start
  the draft".
- **Board on a phone:** the coach column stays pinned and the current
  round scrolls into view.
- **Admin controls:** pause, resume, undo the last pick (with a
  confirmation), and "Pick for {coach}" on the current turn.
- **Complete:** every roster with points used, and a link to the season.
- **Home (`/`, spec 003):** the "Draft live" block while one of the
  person's leagues is drafting: the league, the round, and when the person
  picks next, with "Open the draft room".

## Acceptance criteria

1. Under concurrency, a draft is never wrong: in a test where every coach
   in a 16-coach draft submits picks at the same moment, repeatedly, across
   a whole draft, no form is stored twice, no coach breaks the budget rule,
   and every turn has at most one pick.
2. Turn order is right for snake and linear drafts of 2 to 24 coaches,
   including make-up turns, shown by unit tests over the whole sequence.
3. The budget rule refuses a pick that would leave too few points, and
   allows the same form when it would not, with the edge cases above
   tested.
4. When a timer runs out, the auto-pick is the first affordable available
   wishlist form; with none, the turn is skipped and made up at the end; a
   second miss forfeits it. Tested, including a pick arriving at the
   deadline.
5. A server restart mid-turn keeps the deadline: the auto-pick happens at
   the stored time (or at once, if it passed during the restart).
6. A coach who disconnects mid-draft and reconnects sees exactly the
   server's state: shown by a test that drops a client, makes picks, then
   reconnects it, once at once and once after more than a minute, and
   compares its state with the server's.
7. Pause, resume and undo behave as the rules say, and each is recorded
   and shown in the room.
8. A wishlist is never sent to anyone but its owner (a test inspects every
   message another member receives).
9. The draft room and the roster page pass axe at 360 px and 1280 px in
   both themes, work by keyboard alone, and announce picks and turns as
   rule 14 says.
10. A removed member's connection is closed and can't sync; a client whose
    clock is wrong shows the server's time left; child IDs from another
    league are refused.
11. A person's data download includes their wishlists and the picks they
    made; deleting the account anonymises them.
12. The draft room works in English and Hindi: a pick is announced in
    the page's language, and with `dir="rtl"` nothing overlaps or points
    the wrong way.
13. On league pages the room's socket connects under the per-response
    nonce CSP (spec 006), which lists the server in `connect-src`, and
    each page sends one CSP header; a preview build carries no address of
    the production server, and its draft room shows fixtures.
14. Starting a draft whose timer is 10 minutes or more with no linked
    channel needs the admin to confirm the warning; signed in, `/leagues`
    and home show "Your turn" while the draft waits on the person.

## Out of scope

- Auction drafts, trading picks during the draft, keeper rules.
- AI suggestions in the room (spec 013).
- Posting picks to Discord (spec 011).
- Chat in the room (spec 001: leagues talk on Discord).
- A load test of the room (spec 014).

## Changes

- 2026-10-21: written.
- 2026-10-21: audit fixes: a fresh ticket on every reconnect, no deadline job (pg-boss arrives with spec 011), the server's clock for the timer, rosters at `/l/[league]/rosters`, a scheduled start, the phone layout, removed members disconnected, personal data exported and anonymised.
- 2026-10-21: final audit: the CSP on league pages covers the socket, previews show fixtures, the no-channel warning, "Your turn" on `/leagues` and home.
