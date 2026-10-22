# 10. Only real routes: no fixture or test pages in the app

- Status: Accepted (the owner, 2026-10-22)
- Date: 2026-10-22
- Supersedes: step 2 of [How a screen is built](../specs/README.md#how-a-screen-is-built) ("Fixture screen") as it stood, [spec 001](../specs/001-interface/spec.md)'s criteria 4 and 9 as written, and [spec 000](../specs/000-platform/spec.md)'s test-only route in criterion 4

## Context

Specs 000 and 001 added pages that only development and previews served:
`/fixtures/states`, `/fixtures/list`, then `/fixtures/dex` and
`/fixtures/dex-states` (spec 003, task 3), each a screen on sample data for
the owner's review and the end-to-end tests, and `/error-check`, which
throws on purpose to show that errors reach Sentry. Production built each as
a 404.

With `/dex` on real data, the owner asked why the dummy pages stay, and
decided: the app keeps only its real routes, and no code that isn't in real
use.

## Decision

| Item                                           | Before                                                                                                          | Decision                                                                                                                                                                            |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fixture pages                                  | `app/[lang]/(dev)/fixtures/…`, their components (`components/fixtures/`) and sample data (`apps/web/fixtures/`) | Removed. A screen is reviewed on its own route, in development and on a preview, over the local network on a phone (`DEV_ORIGINS`, `apps/web/.env.example`)                         |
| The states (spec 001, "States every view has") | Shown together on `/fixtures/states`                                                                            | Each shown, and tested, on the real view that has it: no match on `/dex` today; offline, no permission and the rest with the screens that have them                                 |
| `/error-check`                                 | A page that throws on purpose                                                                                   | Removed. What reaches Sentry is covered by `lib/sentry-options.test.ts` (personal data stripped before sending); a live check uses a real error on a preview                        |
| End-to-end tests                               | Against the fixture pages                                                                                       | Against real routes: `dex.spec.ts` (`/dex`), `focus-obscured.spec.ts` (the Dex's list, a long table under the sticky bar), `cls.spec.ts` and `rtl.spec.ts` (`/dex` among the pages) |
| Unused code                                    | The fixture-only components, data, skeletons, messages and exports                                              | Removed. The shadcn registry components stay, used or not, until the end of the project (the owner's call), when any still unused are removed                                       |
| Test data inside packages                      | `packages/dex/test/fixtures/`                                                                                   | Kept: the import's tests read it; it's not served                                                                                                                                   |

## Alternatives considered

- **Keep the fixture pages:** every state reviewable in one place, and the
  tests independent of real data; but pages and code that the product never
  serves, which the owner doesn't want.
- **A separate tool for isolated screens** (Storybook or similar): the same
  benefit without routes in the app, but another tool, its configuration and
  its upkeep, for one person's project.

## Consequences

- A state that real data can't reach yet (an error, offline before spec
  003's service worker, AI unavailable) is reviewed when its screen exists.
- Later plans' "fixture screen" tasks (specs 008 to 011) become "the screen
  on its route, reviewed on a desktop and a phone" when their group starts,
  and that plan is updated then.
- The end-to-end tests depend on the real dataset; a data refresh that
  changes a count changes only what the tests compute, since they compute
  counts from the dataset.

## Sources

- The owner's decision, 2026-10-22.
- [docs/specs/README.md](../specs/README.md), "How a screen is built".
