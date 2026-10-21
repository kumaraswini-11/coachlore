# 010: Trades

| Status  | Owner             | Written    |
| ------- | ----------------- | ---------- |
| Written | Aswini Kumar Sahu | 2026-10-21 |

## Goal

Coaches trade forms between their rosters during the season. Points are
checked before a trade is offered and again when it completes, an admin
approves it if the league asks, and no form ever ends up on two rosters.

## Where this comes from

- [Project doc](../../project-doc.md): "Scope" ("trades with approval"),
  "The server decides the draft" (the same rule holds for rosters: the
  server decides, the interface shows), "Everything a person sends is
  checked on the server".
- [Glossary](../../../GLOSSARY.md): trade, roster, points, budget, coach,
  admin, season.
- [Spec 001](../001-interface/spec.md#trades-lleaguetrades): the Trades screen.

## Requirements

1. **Who trades.** A coach offers a trade to another coach in the same
   league's current season. Admins and viewers who aren't coaches can't
   offer or receive trades.
2. **When.** Trades are possible while the season is in progress: after
   the draft is complete and before the season ends, and only if the
   league has trades on.
3. **What a trade is.** One to three forms from each side, with the same
   number on each side, so every roster stays at the league's roster size.
   A coach can attach a short message (up to 280 characters).
4. **Points.** Each form keeps the points recorded on its roster entry
   (what it cost when it was drafted). After the trade, each coach's points
   used must be within the budget.
5. **The offer.** The person offering sees, before sending, both coaches'
   points used after the trade and whether it's allowed; a trade that isn't
   allowed can't be sent, and the reason is shown.
6. **Answering.** The coach receiving an offer accepts or declines it. The
   coach who offered can withdraw it until it's answered.
7. **Approval.** If the league requires approval, an accepted trade waits
   for an admin, who approves or rejects it. Any admin may decide,
   including one who is a party to the trade; who decided is shown to every
   member.
8. **Completion.** A trade completes when it's accepted (no approval
   needed) or approved. Completing moves the forms between the two rosters
   in one step: either every form moves or none does.
9. **Checked again at completion.** When a trade is accepted or approved,
   the server checks it again: every form is still on the roster it was
   offered from, and both coaches are still within budget. If not, the
   trade lapses, with the reason.
10. **Lapsing.** An open trade (offered, or waiting for approval) lapses
    when a form in it leaves its roster (another trade completed) and when
    the season ends.
11. **History.** Every member sees the league's trades, open and past, with
    their status, the forms, the points, and who answered and approved
    them.
12. **Telling the league.** A completed trade is posted to the league
    channel (spec 011); spec 013 adds an AI explanation of how the trade
    changes both rosters.

### Trade statuses

```text
offered ──accept──► completed                    (no approval needed)
   │      └──────► awaiting approval ──approve──► completed
   │                        └────────reject────► rejected
   ├──decline──► declined
   ├──withdraw─► withdrawn
   └──(a form leaves its roster, the season ends, or the check fails)──► lapsed
awaiting approval ──(same)──► lapsed
```

`completed`, `declined`, `withdrawn`, `rejected` and `lapsed` are final. 13. **In the page's language.** Every string comes from the dictionaries,
including why a trade isn't allowed; Pokémon names stay English; times
are shown in the viewer's time zone with the league's beside them
(ADR 0007).

## Rules and edge cases

- **Two trades with the same form.** Both can be offered. The first to
  complete moves the form; every other open trade with that form lapses in
  the same step, with the reason "Rotom-Wash is no longer on Gary's
  roster."
- **Answering at the same moment.** If two people act on one trade at once
  (an accept and a withdraw), the server applies the first and refuses the
  second with "This trade has already been withdrawn."
- **A coach leaves the league or is replaced** ("Replace coach", spec
  007). Their open trades lapse.
- **Two trades by one coach at once.** Each is checked against the
  roster as the other leaves it: if both together would break the budget,
  the second to complete lapses.
- **Points changed.** Points travel with the form, so a trade can't make a
  form cheaper or dearer; the tier list is locked once the draft starts
  (spec 007).
- **Matches already played** keep their results and KOs: stats belong to
  the battles, not to the roster (spec 009).
- **A trade with oneself, a form not on the roster, a form twice, unequal
  counts** are refused by the server with a field error, whatever the
  interface sent.
- **Trades turned off** mid-season: open trades lapse; history stays.

## Screens

The Trades screen in [spec 001](../001-interface/spec.md#trades-lleaguetrades),
with:

- **Open trades** first: offers to the person (Accept, Decline), offers
  from them (Withdraw), and, for admins, trades awaiting approval (Approve,
  Reject).
- **New trade:** choose a coach, then the forms to give and to get from
  the two rosters (the Command picker), with both coaches' points used
  after the trade, live. "Send offer" is enabled only for an allowed trade.
- **History:** every past trade, newest first, with its status as a word.
- **States:** no trades yet; trades off in this league ("Trades are off in
  this league"); not in season ("Trades open when the draft is complete");
  viewer (sees history, can't trade); offline (Alert, changes disabled).
- **Accessibility:** the points check is announced when it changes; each
  action button names the trade ("Accept Gary's offer: Rotom-Wash for
  Corviknight"); confirmations for decline, withdraw and reject.

## Acceptance criteria

1. A coach can offer a one-, two- or three-for-same-count trade to another
   coach in an in-progress season with trades on; anything else is refused
   by the server with the reason.
2. A trade that would put either coach over budget can't be sent, and the
   server refuses it if sent anyway.
3. Accepting a trade with no approval required completes it: both rosters
   change in one transaction, and the moved forms' new roster entries say
   they came by trade.
4. With approval required, an accepted trade waits; an admin's approval
   completes it, and a rejection ends it.
5. When two open trades share a form and one completes, the other lapses
   with the reason, and the form is on exactly one roster.
6. Under concurrent completion of two trades sharing a form, exactly one
   completes; and of two trades by one coach that each fit the budget
   alone but not together, exactly one completes. Both shown by tests that
   run the trades at once against a real database.
7. A trade whose forms moved or whose points no longer fit lapses at accept
   or approve, with the reason.
8. Open trades lapse when the season ends or trades are turned off.
9. Every member sees the history with statuses, points and who decided;
   viewers can't act.
10. A completed trade sends one post to the league channel (spec 011's
    test proves it appears once).
11. The Trades screen has every state above, passes axe at 360 and 1280 px
    in both themes, and works by keyboard.
12. IDs from another league are refused; a person's data download
    includes their trades, and deleting the account anonymises them.
13. The trades screen works in English and Hindi, and a refused trade's
    reason is shown in the page's language.

## Out of scope

- Trading points, draft picks or anything other than forms.
- Unequal trades (two for one) and dropping a form to the pool or picking
  one up from it (free agency).
- A trade deadline before the season's end.
- Counter-offers: the receiving coach declines and makes a new offer.
- Admins forcing or undoing a trade.

## Changes

- 2026-10-21: written.
- 2026-10-21: audit fixes: both coaches locked before the budget check (two trades by one coach), locks in `id` order, IDs scoped by league, personal data exported and anonymised, "Replace coach" lapses trades.
