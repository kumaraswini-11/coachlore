# 007: Leagues

| Status  | Owner             | Written    |
| ------- | ----------------- | ---------- |
| Written | Aswini Kumar Sahu | 2026-10-21 |

## Goal

An admin creates a league with sensible defaults, invites friends as
coaches or viewers, and prices every form in a tier list. When this spec is
done, a league is ready to draft (008).

## Where this comes from

The [project doc](../../project-doc.md): "Scope" (creation, invitations,
roles, rules and a points-based tier list), "The rules everything rests on"
(the server decides), "Privacy" (leagues hold only what they need). The
defaults in [the specs README](../README.md#defaults-for-the-owners-calls):
leagues are private; leagues play Generation 9 singles or doubles. The open
question "whether a league's pages can be public" is answered: **no, a
league is seen only by its members** in v1.

## Requirements

### 1. A league

1. A league has a name (3–40 characters), an address made from its name
   (`/l/kanto-cup`, unique, fixed once made), a colour from eight, and a
   format for its season: Generation 9 singles or Generation 9 doubles,
   played on Showdown in its "[Gen 9] Draft" or "[Gen 9] 6v6 Doubles Draft"
   format ([Showdown's formats](https://github.com/smogon/pokemon-showdown/blob/master/config/formats.ts)).
   The forms a format allows are those the dataset marks usable in
   Generation 9 (spec 002). A season also lists the Showdown formats its
   replays may use: the league's format by default, and any an admin adds
   (a custom challenge, say). Spec 009 warns about a replay in another
   format, and an admin can accept it.

   **A league has a time zone** (an IANA name such as `Europe/London`),
   by default the creator's browser's, changed in General. The league's
   week edges, draft start and reminders use it; screens show every time
   in the viewer's zone, with the league's beside it when they differ
   (spec 001).

   **A league has a language**, English or Hindi
   ([ADR 0007](../../adr/0007-languages-and-right-to-left.md)), by default
   the creator's, changed in General. The bot's posts (011) and the AI's
   recaps and digest (013) use it; each person still sees the site in
   their own language. A league's name, and anything else its people
   write, is shown as written, never translated.

2. A league has members. Each member is a **coach** or a **viewer**, and
   any member can also be an **admin**. The person who creates a league is
   its first admin and a coach.
3. A league has between 2 and 16 coaches before its draft can start (008
   checks this); viewers are unlimited.
4. A league has seasons, numbered from 1. v1 creates season 1 with the
   league and never a second; the data allows more later. A **finished**
   season is read-only: its final standings, rosters and results stay
   visible and nothing in it changes; the league home leaves room for
   "Start season 2", which isn't in v1.
5. Only members see anything about a league. To anyone else, a league's
   pages say "This league is private", without its name.

### 2. Creating a league (`/leagues/new`)

6. Four steps, each with defaults, so a league can be made by pressing
   "Next" three times and "Create":

   | Step   | Fields and defaults                                                                                                 |
   | ------ | ------------------------------------------------------------------------------------------------------------------- |
   | Basics | Name; colour (the first); format (Generation 9 singles)                                                             |
   | Draft  | Order: snake; budget: 110 points; roster size: 10 forms; timer: 2 minutes per turn; tier list: "By base stat total" |
   | Season | Battles per match: 1 (or best of 3); trades: on; trades need an admin's approval: off                               |
   | Review | Everything above, each with "Change"                                                                                |

7. Every field is checked on the server with the same rules as in the
   form; a league that fails a rule isn't made, and the step with the
   problem opens with the reason beside the field.

### 3. Invitations (`/join/[invitation]`)

8. An admin makes an invitation link for a role (coach or viewer). A link
   works for anyone who has it until it expires (7 days by default, 1 to
   30), reaches its maximum number of uses (none by default; 1 to 16 if
   set), or an admin withdraws it. Members shows how each person joined
   ("by Brock's link"), and the league home's Recent says "Ash joined".
9. Opening a link shows the league's name and colour, who made the link,
   and the role; "Join" makes the person a member. Signed out, "Join" signs
   them in first (006) and comes back.

   **A coach is asked for their Showdown username** when joining, with
   why: replays are matched to coaches by it (009). It may be left empty;
   a coach changes it from the league home ("Your Showdown username"), and
   before the season starts, admins see which coaches haven't given one.

10. A coach link stops working for new coaches once the draft has started
    or the league has 16 coaches; it says why. A viewer link keeps working.

### 4. Members

11. A member's name in a league is their Discord name when they join; they
    can change it (2–32 characters) for that league.
12. An admin can make a member an admin or stop them being one (a league
    always keeps at least one), change a coach to a viewer or back before
    the draft starts, and remove a member before the draft starts.
13. A member can leave before the draft starts. After it starts, coaches
    stay (a roster needs its coach) unless replaced; viewers can always
    leave.

    **Replacing a coach:** at any time, an admin can hand a coach's place
    to another person in the league (a viewer, or someone who joined by a
    viewer link for it). The new person takes over the coach's roster,
    remaining matches and wishlist, because they belong to the coach's
    place, not the person; the new coach gives their own Showdown username;
    the person replaced stays as a viewer. The replacement is recorded and
    shown in Members and Recent ("Gary took over from Ash").

### 5. The tier list (`/l/[league]/tiers`)

14. The tier list belongs to the season. It has tiers, each a name and a
    points value (1 to the budget), in order, and a "Banned" group.
15. Every form the league's format allows is either in exactly one tier,
    banned, or unpriced. An unpriced form can't be drafted; the draft can't
    start while any form is unpriced (008 checks), so an admin sees how
    many remain.
16. A tier list starts from a template:
    - **By base stat total:** the format's forms sorted by base stat total
      and split evenly into tiers worth 20, 18, 16 … 2 points; forms tagged
      Restricted Legendary or Mythical start banned.
    - **Empty:** every form unpriced.
    - **Copy:** from a season of another league the admin also runs.
17. An admin edits by choosing forms (by search, type or tier) and moving
    them to a tier or to Banned; adding, renaming, re-pricing, reordering
    and removing tiers (a removed tier's forms become unpriced).
18. The tier list is locked when the draft starts. After that, nothing in
    it changes.
19. Everyone in the league sees the tier list, with search and the Dex's
    type filter.

### 6. Settings (`/l/[league]/settings`)

20. Sections: **General** (name, colour, time zone, language), **Members** (the
    list, roles, how each joined, Showdown usernames, invitation links with
    their expiry and uses, replace a coach, remove), **Draft** (order,
    budget, roster size, timer), **Season** (battles per match, trades,
    approval, the formats replays may use), and **Delete league**. 011 adds
    Discord; 013 adds AI.
21. Draft settings lock when the draft starts; season settings lock when
    the first week starts (009). With a timer of 10 minutes or more and no
    linked league channel (always, until spec 011 adds channels), Draft
    settings note: "Coaches won't be told it's their turn outside the
    room."
22. Deleting a league removes everything in it, after the admin types the
    league's name to confirm.

### 7. Elsewhere

23. `/leagues` lists the person's leagues (spec 001's wireframe) with their
    role and the league's state: setting up, drafting, in season, finished.
    Spec 008 adds "Draft live" and, when the draft waits on the person,
    "Your turn" to each card.
24. The sidebar on desktop lists the person's leagues; the search palette
    finds them by name.
25. `/me` lists the person's leagues with their role (006 left this empty).
26. `/l/[league]` before the draft shows the league's state, the members,
    the draft settings, how many forms are unpriced and which coaches have
    no Showdown username (to admins), and links to the tier list and
    settings. 008 adds the draft's scheduled start and order; 009 adds
    standings and this week's match.
27. Deleting an account (006): an account that's the only admin of a
    league can't be deleted until someone else is admin or the league is
    deleted; otherwise its memberships stay as "A former coach" (or "A
    former viewer"), linked to no one.
28. **A demo league** can be made for local development and demos with one
    command: 8 coaches with Showdown usernames, the default settings and a
    tier list from the default template.

## Rules and edge cases

1. **Roles are checked on the server** for every change. A viewer or coach
   who calls an admin's action gets "Only admins can change this", and
   nothing changes.
2. **Two admins edit the tier list at once:** each change applies to the
   forms it names; a move that targets a tier deleted in the meantime is
   refused with a message, and the screen reloads the tier list.
3. **A name that makes an address already taken** gets a number
   (`kanto-cup-2`).
4. **A form the data drops later** (a refresh of 002) stays in tier lists
   already made, shown as "No longer in the Dex", and can be removed.
5. **Feasibility:** the server refuses settings where a full roster can't
   be afforded or can't be filled: the roster size times the cheapest
   tier's points must fit the budget, and the priced forms must number at
   least the roster size times the number of coaches (checked again when
   the draft starts).
6. **An invitation for a deleted league** says the league no longer exists.
7. **Joining twice** shows "You're already in this league" with a link.
8. **The last admin** can't stop being an admin, leave or be removed.
9. **IDs belong to their league.** Every ID in a league's address or
   request (a member, a season, a tier, an invitation) is looked up within
   that league; an ID from another league is "not found". Copying a tier
   list from another league's season needs the person to be an admin of
   that league too.
10. **A replaced coach's history:** results, KOs and trades stay with the
    coach's place; the record names who held it, and since when.

## Screens

Wireframes in spec 001: [Leagues](../001-interface/spec.md#leagues-leagues),
[Create a league](../001-interface/spec.md#create-a-league-leaguesnew),
[Join a league](../001-interface/spec.md#join-a-league-joininvitation),
[League home](../001-interface/spec.md#league-home-lleague),
[Tier list](../001-interface/spec.md#tier-list-lleaguetiers),
[League settings](../001-interface/spec.md#league-settings-lleaguesettings).
This spec adds:

- **League home before the draft:** "Setting up" with a checklist for
  admins (coaches joined: 6 of 2–16; forms unpriced: 12; Showdown
  usernames missing: 2; draft start: not set, from 008), and the members
  list. A coach sees "Your Showdown username" with "Change".
- **Tier list for admins:** an "Unpriced (12)" group at the top until it's
  empty; "Move to…" on the selection; tier headings with "Edit" for name
  and points.
- **No permission:** any league page for a non-member, or a settings page
  for a non-admin.
- **Home (`/`, spec 003):** "Your leagues" for a signed-in person with
  leagues (name, their place or the league's stage); signed out, one card
  says what a draft league is ("Friends draft Pokémon with a points
  budget, then play a season on Showdown; Coachlore keeps the score."),
  with "How leagues work" (a section of `/about`) and "Sign in with
  Discord". The sidebar lists the person's leagues.

## Acceptance criteria

1. A league made with every default is valid, and its tier list from "By
   base stat total" prices or bans every form its format allows.
2. A non-member gets "This league is private" (and the server 404) on
   every league page and API route; the league's name isn't in the
   response.
3. Every admin action, called by a coach or a viewer, is refused by the
   server and changes nothing.
4. An invitation link works for several people, stops after expiry or
   withdrawal, and a coach link stops once the draft has started or the
   league has 16 coaches.
5. A form can't be in two tiers, or in a tier and banned, in the same
   season: the database refuses it.
6. After the draft starts, no change to the tier list or draft settings is
   accepted.
7. Infeasible settings (rule 5) are refused with the reason.
8. Deleting an account that's a league's only admin is refused, naming the
   league; otherwise its memberships show "A former coach" and the league
   still works.
9. Deleting a league removes every row that belongs to it.
10. The leagues appear in `/leagues`, `/me`, the sidebar and the search
    palette for members, and nowhere for anyone else.
11. Every screen of this spec passes Playwright with axe at 360 px and
    1280 px in both themes, and the tier list can be edited by keyboard
    alone.
12. An invitation with a maximum of 2 uses lets two people join and refuses
    the third; Members shows how each joined.
13. A member, season, tier or invitation ID from another league is refused
    as not found on every route that takes one, and copying a tier list
    from a league the person doesn't run is refused.
14. Replacing a coach moves the place, with its roster and matches, to the
    new person in one change; the replaced person becomes a viewer, and the
    record shows both.
15. A league's time zone sets its week edges and draft start; a time shown
    to a viewer in another zone shows both.
16. The demo league command makes a league that can start its draft.
17. A finished season refuses every change.
18. A league's language is stored with it, chosen at creation and in
    General, and every league screen's words come from the dictionaries in
    both languages, passing axe in both and with `dir="rtl"`.
19. Draft settings show the turn note when the timer is 10 minutes or
    more and no league channel is linked, and not otherwise.

## Out of scope

- Public leagues, discovering leagues, league logos.
- More than one season per league (the finished state leaves room for
  "Start season 2"); playoffs (009 default: none).
- Dragging forms between tiers (selection and "Move to…" only).
- Tier lists imported from community sites.

## Changes

- 2026-10-21: written.
- 2026-10-21: a league's language (ADR 0007); its tables in the database package (ADR 0006).
- 2026-10-21: audit. Time zone, allowed formats, Showdown username on
  joining, replacing a coach, invitation uses and how members joined,
  IDs scoped to their league, finished seasons, the demo league.
- 2026-10-21: final audit: the turn note in Draft settings; "Your turn" on `/leagues` comes from spec 008.
