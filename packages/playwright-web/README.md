# @workspace/playwright-web

The web app's end-to-end tests: [Playwright](https://playwright.dev) in
Chromium and WebKit, with [axe](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)
checking WCAG 2.2 A and AA on every page, in light and dark.

## Why a separate package

Turborepo's Playwright guide recommends "a Playwright package for each test
suite", per application, and its "Structuring a repository" puts tooling in
`packages/`. The web app stays free of Playwright and its browsers, and
because this package depends on `web`, Turborepo builds the app before the
tests run and re-runs them when either changes.

## Run

From the repository root:

```sh
bunx playwright install chromium webkit   # once, from this folder
bun run e2e                               # builds the web app, then tests it
```

The tests start the built app on port 3100 (`playwright.config.ts`); a
server already on that port is reused locally, never in CI.

## What's here

| Path                   | What                                                                         |
| ---------------------- | ---------------------------------------------------------------------------- |
| `e2e/axe.ts`           | `expectAccessible(page)`: fails on any axe violation, in both colour schemes |
| `e2e/*.spec.ts`        | one file per acceptance criterion it proves (spec 001's plan, "Tests")       |
| `playwright.config.ts` | the browsers, the base address, and the server the tests start               |

The pages the tests visit, including the fixture pages, live in
`apps/web`; this package holds only the tests.
