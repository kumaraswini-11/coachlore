# 007: Leagues, the plan

How this repository builds [spec 007](spec.md).

## Builds on

- **Specs:** 001 (the shell, states, `EmptyState`), 002 (the dataset in
  `packages/dex`: forms, base stats, each form's `gen9` flag and `tags`), 006 (the server, the database, sign-in,
  `packages/contracts`, the deletion and export lists).
- **ADR 0006 pieces:** nothing new. `packages/league` starts here.

## Packages and files

```text
packages/league/                    the league rules (new): no framework, no storage
  src/settings.ts                   league and season settings: schema, defaults, feasibility
  src/tier-list.ts                  tier list rules: one place per form, unpriced count, locking
  src/templates.ts                  byBaseStatTotal(forms, options), empty(forms)
  src/slug.ts                       slugify(name), withSuffix(slug, n)
  src/invitations.ts                expiry and "can this join as a coach" rules
  src/colours.ts                    the eight league colours
  src/*.test.ts
packages/contracts/src/leagues.ts   league, member, invitation, season, tier list schemas
packages/db/src/
  schema/leagues.ts                 the tables below (re-exported from schema/index.ts)
  seed/leagues.ts                   the demo league, run by `db:seed` (development only)
apps/server/src/
  leagues/access.ts                 loadMembership(slug, user) and requireAdmin(); 404 for non-members
  leagues/routes.ts                 the endpoints below
  leagues/tier-list.ts              tier list reads and moves, in transactions
  leagues/account-hooks.ts          the "only admin" blocker, the "former member" anonymiser, the exporter
  leagues/replace-coach.ts          hands a coach's place to another person, in one transaction
apps/web/app/
  leagues/page.tsx                  /leagues
  leagues/new/page.tsx              /leagues/new (the stepped form is a client component)
  join/[invitation]/page.tsx        /join/[invitation]
  l/[league]/layout.tsx             league shell: membership check, league navigation
  l/[league]/page.tsx               league home (pre-draft state)
  l/[league]/tiers/page.tsx         tier list
  l/[league]/settings/page.tsx      settings, one section per sub-route or tab
apps/web/components/leagues/        league-avatar, member-list, tier-group, move-to-tier, league-form-steps
```

`packages/league` depends on `packages/dex` for form types only; the
server passes it the forms, so it never loads data itself.

## Data model

| Table            | Columns                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Constraints                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `leagues`        | `id`, `slug`, `name`, `colour` (`red`, `orange`, `amber`, `green`, `teal`, `blue`, `violet`, `pink`), `time_zone` (IANA name, checked against `Intl.supportedValuesOf("timeZone")`), `language` (`en` or `hi`, default the creator's account language), `status` (`active`, `archived`), `created_by` (user, nullable), timestamps                                                                                                                                       | `slug` unique                                                                                  |
| `league_members` | `id`, `league_id`, `user_id` (nullable: null once the account is deleted), `role` (`coach`, `viewer`), `is_admin`, `display_name`, `showdown_name` (nullable; asked on joining as a coach, used by 009), `joined_via_invitation_id` (nullable), `joined_at`, `left_at` (nullable)                                                                                                                                                                                        | unique (`league_id`, `user_id`) where `user_id` is not null and `left_at` is null              |
| `invitations`    | `id`, `league_id`, `token` (32 random bytes, base64url), `role`, `created_by` (member), `expires_at`, `max_uses` (nullable), `uses`, `revoked_at`, `created_at`                                                                                                                                                                                                                                                                                                          | `token` unique                                                                                 |
| `seasons`        | `id`, `league_id`, `number`, `status` (`setup`, `drafting`, `in_season`, `finished`), `format_id` (a Showdown format ID: `gen9draft` or `gen96v6doublesdraft`), `allowed_format_ids` (text array, default `{format_id}`), `budget`, `roster_size`, `draft_order_type` (`snake`, `linear`), `timer_seconds`, `weeks` (nullable: null means one round robin, set by 009), `battles_per_match` (1 or 3), `trades_enabled`, `trade_approval_required`, `tier_list_locked_at` | unique (`league_id`, `number`); checks on ranges                                               |
| `tiers`          | `id`, `season_id`, `name`, `points`, `position`                                                                                                                                                                                                                                                                                                                                                                                                                          | unique (`season_id`, `position`); `points` between 1 and the season's budget (checked in code) |
| `coach_changes`  | `id`, `league_id`, `member_id` (the coach's place), `from_user_id` (nullable), `to_user_id` (nullable), `changed_by` (member), `changed_at`                                                                                                                                                                                                                                                                                                                              | –                                                                                              |
| `tier_forms`     | `season_id`, `form_key`, `tier_id` (nullable), `banned`                                                                                                                                                                                                                                                                                                                                                                                                                  | primary key (`season_id`, `form_key`); check: exactly one of `tier_id` set or `banned` true    |

- **The role model:** `role` is `coach` or `viewer`; `is_admin` is
  separate, so an admin can also coach (most do). The glossary's three
  roles map to these two columns.
- **Unpriced** forms are the format's forms (every form with `gen9`, from 002) with no `tier_forms` row; the
  server works them out from the dataset, so nothing is stored for them.
- **A league's status** is `active` or `archived`; where it is in its life
  (setting up, drafting, in season, finished) is its current season's
  `status`.
- **Deleting a league** deletes its rows by `ON DELETE CASCADE` from
  `leagues`; later specs' tables cascade the same way.
- **Former members:** the anonymiser sets `user_id` to null and
  `display_name` to "A former coach" or "A former viewer", and nulls the
  person's other references in this spec's tables: `leagues.created_by`,
  `coach_changes.from_user_id` and `coach_changes.to_user_id` (each
  nullable, with `ON DELETE SET NULL` as the backstop), so a deleted
  account is never referenced and never blocks deletion, while the
  league's history keeps its rows.
- **A coach's place:** a `league_members` row with `role = 'coach'` is the
  place that rosters (008), matches (009) and trades (010) point at.
  Replacing a coach keeps the place's `member_id`, so nothing that points
  at it moves. In one transaction, in this order: the incoming person's
  viewer row gets `left_at` (so the partial unique index on active rows
  holds); the coach row's `user_id` becomes theirs and `showdown_name` is
  cleared; the person replaced gets a new viewer row (they stay as a
  viewer, and can leave later); `coach_changes` is written. It's refused
  when the season is finished.
  - **What stays with the place:** `id` (`member_id`), `role` and
    `is_admin`.
  - **What moves with the person:** `display_name`,
    `joined_via_invitation_id` and `joined_at`. The coach row takes the
    incoming person's values from their closed viewer row; the replaced
    person's new viewer row takes the values the coach row had, so each
    person keeps the name and joining history they had before.
- **Recent** on the league home is read from the tables' own timestamps
  (joins and coach changes here; picks, results and trades from 008–010),
  newest ten; there's no separate activity table.
- **IDs in a league's routes** are always looked up with the league's
  `id` in the same query (`where league_id = $leagueId and id = $id`),
  through one helper, `inLeague(table, leagueId, id)`.

## API

All under `/api/v1/`, shapes in `packages/contracts/src/leagues.ts`. Every
`/leagues/:slug/...` route first loads the caller's membership; no
membership is 404 (so the league's existence isn't revealed).

| Method and path                                 | Who            | Does                                                                                                                                                            |
| ----------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /leagues`                                  | signed in      | the caller's leagues, with role, admin flag and season status                                                                                                   |
| `POST /leagues`                                 | signed in      | creates the league, the caller as admin and coach, season 1 and its tier list from the chosen template                                                          |
| `GET /leagues/:slug`                            | member         | the league, its current season, the caller's membership, and for admins the unpriced count                                                                      |
| `PATCH /leagues/:slug`                          | admin          | name, colour, time zone                                                                                                                                         |
| `DELETE /leagues/:slug`                         | admin          | deletes the league; body `{ confirmName }` must match                                                                                                           |
| `GET /leagues/:slug/members`                    | member         | members with role and admin flag                                                                                                                                |
| `PATCH /leagues/:slug/members/:memberId`        | admin, or self | admin: `role`, `isAdmin`; self: `displayName`, `showdownName`                                                                                                   |
| `POST /leagues/:slug/members/:memberId/replace` | admin          | `{ toMemberId }` (a viewer in the league): hands the coach's place over                                                                                         |
| `DELETE /leagues/:slug/members/:memberId`       | admin, or self | remove or leave, by the rules in the spec                                                                                                                       |
| `PATCH /leagues/:slug/season`                   | admin          | draft and season settings, while not locked                                                                                                                     |
| `GET /leagues/:slug/invitations`                | admin          | active links                                                                                                                                                    |
| `POST /leagues/:slug/invitations`               | admin          | `{ role, expiresInDays, maxUses? }` → `{ token, url, expiresAt }`                                                                                               |
| `DELETE /leagues/:slug/invitations/:id`         | admin          | withdraws a link                                                                                                                                                |
| `GET /invitations/:token`                       | anyone         | the league's name and colour, who made it, the role, and whether it can be used now                                                                             |
| `POST /invitations/:token/accept`               | signed in      | `{ showdownName? }`; joins and counts a use, in one transaction; 409 if already a member, the coach places are closed or the uses are spent                     |
| `GET /leagues/:slug/tiers`                      | member         | tiers in order with their forms, banned forms, and (admins) unpriced forms                                                                                      |
| `PUT /leagues/:slug/tiers`                      | admin          | the tiers' names, points and order; removed tiers' forms become unpriced                                                                                        |
| `POST /leagues/:slug/tiers/moves`               | admin          | `{ formKeys, to: { tierId } \| "banned" \| "unpriced" }`                                                                                                        |
| `POST /leagues/:slug/tiers/template`            | admin          | `{ template: "by-base-stat-total" \| "empty" \| { copyFromSeasonId } }`, before the lock; copying needs the caller to be an admin of the source season's league |

`GET /invitations/:token` is the one route a non-member may call about a
league; it returns only what the join screen shows.

## Events

None. The tier list doesn't update live; a second admin's change shows on
reload.

## Jobs

None.

## Tests

| Acceptance criterion     | Proved by                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Defaults are valid    | `packages/league/src/settings.test.ts` and `templates.test.ts` against the real dataset: every allowed form priced or banned                                                                                                                                                                                                                                                                                                                                                                          |
| 2. Private to members    | `server/test/leagues-access.test.ts`: every league route as a non-member returns 404 without the name                                                                                                                                                                                                                                                                                                                                                                                                 |
| 3. Admin actions         | `leagues-roles.test.ts`: each admin route called as coach and viewer is 403, and the rows are unchanged                                                                                                                                                                                                                                                                                                                                                                                               |
| 4. Invitations           | `invitations.test.ts`, with a fake clock and a started draft                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 5. One place per form    | `tier-list.test.ts`: inserting a duplicate or a tiered and banned row fails at the database                                                                                                                                                                                                                                                                                                                                                                                                           |
| 6. Lock                  | `tier-list.test.ts` and `season-settings.test.ts` with `tier_list_locked_at` set                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 7. Feasibility           | `packages/league/src/settings.test.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 8. Account deletion      | `server/test/deletion.test.ts` (006's), extended with leagues                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 9. League deletion       | `leagues-delete.test.ts`: no row with the league's ID remains in any table                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 10. Where leagues appear | `packages/playwright-web/e2e/leagues.spec.ts` as a member and as another person                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 11. Screens              | `packages/playwright-web/e2e/leagues.spec.ts`: axe at 360 and 1280 px, both themes; the tier list edited with the keyboard only                                                                                                                                                                                                                                                                                                                                                                       |
| 12. Invitation uses      | `invitations.test.ts`: two accepts in parallel against a limit of 2, then a third refused                                                                                                                                                                                                                                                                                                                                                                                                             |
| 13. IDs in their league  | `leagues-scope.test.ts`: every route that takes an ID, called with another league's ID, is 404; copying from a league not run is 404                                                                                                                                                                                                                                                                                                                                                                  |
| 14. Replacing a coach    | `replace-coach.test.ts`: the place's `member_id` stays and its `user_id` changes, the incoming viewer row is closed, a viewer row appears for the replaced person, `coach_changes` has the row, all in one transaction; the coach row then carries the incoming person's `display_name`, `joined_via_invitation_id` and `joined_at`, and the replaced person's viewer row carries their own former values; refused in a finished season; deleting either person's account leaves no reference to them |
| 15. Time zone            | `packages/league/src/time.test.ts` (week edges across a daylight-saving change); `e2e/leagues.spec.ts` with the browser in another zone                                                                                                                                                                                                                                                                                                                                                               |
| 18. Language             | `leagues.test.ts`: created with the creator's language, changed in General; e2e: league screens at `/en` and `/hi`, axe in both and with `dir="rtl"`                                                                                                                                                                                                                                                                                                                                                  |
| 16. Demo league          | `seed.test.ts`: the seeded league passes the draft's start checks (008's `canStart`)                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 19. Turn note            | `e2e/leagues.spec.ts` with fixtures: Draft settings with a 10-minute timer and no channel show the note; with a 2-minute timer they don't                                                                                                                                                                                                                                                                                                                                                             |
| 17. Finished season      | `season-finished.test.ts`: every change route is refused                                                                                                                                                                                                                                                                                                                                                                                                                                              |

## Decisions

| Item                | The repository now | Decision                                                                                                                                                                                                                                                                           |
| ------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Roles               | –                  | `role` (`coach` or `viewer`) plus `is_admin`, so an admin can coach; the glossary's terms stay as they are                                                                                                                                                                         |
| Tier list templates | –                  | Computed from our own dataset ("By base stat total"), never copied from community tier lists: no one else's work to credit or keep in step, and it works for any format the dataset knows                                                                                          |
| Template tiers      | –                  | Ten tiers worth 20, 18, … 2 points, each with an equal share of the format's forms by base stat total, highest first; forms whose `tags` include "Restricted Legendary" or "Mythical" (002) banned. With the default budget of 110 and 10 forms, an average roster costs about 110 |
| League colours      | –                  | Eight colours, each with white initials at 4.5:1 or more (computed 2026-10-21): red `#B91C1C` 6.47, orange `#C2410C` 5.18, amber `#B45309` 5.02, green `#15803D` 5.02, teal `#0F766E` 5.47, blue `#1D4ED8` 6.70, violet `#6D28D9` 7.10, pink `#BE185D` 6.04                        |
| Non-members         | –                  | 404, not 403, on every league route, so a league's existence isn't revealed                                                                                                                                                                                                        |

## Tasks

1. **`packages/league` settings and slugs.** Schemas, defaults,
   feasibility, `slugify`. Done when its tests pass.
2. **Tier list rules and templates** in `packages/league`, tested against
   the real dataset from `packages/dex`. Done when acceptance 1's test
   passes.
3. **Tables and migrations** in `packages/db/src/schema/leagues.ts` for the
   six tables, with their constraints.
   Done when acceptance 5's database test passes.
4. **Access and roles** in the server (`loadMembership`, `requireAdmin`,
   404 for non-members) and the league endpoints. Done when acceptance 2,
   3 and 9 pass.
5. **Invitations** (endpoints and rules, uses, the Showdown username on
   joining). Done when acceptance 4 and 12 pass.
   5a. **IDs in their league and replacing a coach** (`inLeague`,
   `replace-coach.ts`, `coach_changes`). Done when acceptance 13 and 14
   pass.
6. **Tier list endpoints**, with the lock. Done when acceptance 5 and 6
   pass.
7. **Account hooks:** the blocker, the anonymiser, the exporter; `/me`'s
   memberships. Done when acceptance 8 passes.
   7a. **Time zone, language, finished seasons and the demo league**
   (`packages/db/src/seed/leagues.ts`), and the turn note in Draft
   settings. Done when acceptance 15 to 19 pass.
8. **Screens with fixtures:** `/leagues`, `/leagues/new`,
   `/join/[invitation]`, league home, tier list, settings; the owner's
   review on desktop and phone. Done when the owner has reviewed them.
9. **Screens on real data**, plus the sidebar, the home page's "Your
   leagues" and sign-in card, and the search palette's
   leagues. Done when acceptance 10 and 11 pass.
