# 000: Platform, the plan

## Builds on

- The existing CI (`.github/workflows/ci.yml`), ADR 0002 (toolchain) and
  ADR 0003 (rendering, headers, the content security policy).
- ADR 0006, "Hosting" (Vercel's free plan, no domain) and "Errors and
  logs" (Sentry's free plan).

## Packages and files

| Path                                                        | Change                                                                                                   |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `apps/web/lib/site-url.ts`                                  | New, `import "server-only"`: the site's address (below); `lib/site.ts` keeps the name, line and colours  |
| `apps/web/lib/site.ts`                                      | `SITE_URL` moves out to `site-url.ts`, so client components that import `SITE` don't carry it            |
| `apps/web/instrumentation.ts`                               | New: Sentry's server and edge set-up, and `onRequestError`                                               |
| `apps/web/instrumentation-client.ts`                        | New: Sentry's browser set-up                                                                             |
| `apps/web/sentry.server.config.ts`, `sentry.edge.config.ts` | New, as Sentry's Next.js guide lays them out                                                             |
| `apps/web/next.config.ts`                                   | Wrapped with Sentry's build plugin: source maps uploaded then deleted, and a tunnel route                |
| `apps/web/app/error.tsx`, `global-error.tsx`                | `Sentry.captureException(error)` instead of `console.error`                                              |
| `apps/web/app/(dev)/error-check/page.tsx`                   | New: throws on purpose; `notFound()` in production (`VERCEL_ENV === "production"`)                       |
| `apps/web/.env.example`                                     | Every variable below                                                                                     |
| `turbo.json`                                                | The build task declares the variables below in `env`, so Turborepo's strict environment mode passes them |

## The site's address

`siteUrl()` returns, in order:

1. `NEXT_PUBLIC_SITE_URL`, if set (an explicit override);
2. in production on Vercel (`VERCEL_ENV === "production"`),
   `https://` + `VERCEL_PROJECT_PRODUCTION_URL`;
3. in a preview (`VERCEL_ENV === "preview"`), `https://` +
   `VERCEL_BRANCH_URL`, else `VERCEL_URL`;
4. otherwise `http://localhost:3000`.

Vercel provides these system variables "at both build and runtime"
([system environment variables](https://vercel.com/docs/environment-variables/system-environment-variables)),
so nobody sets the address by hand, and the follow-ups plan's "production
build silently uses localhost" can't happen on Vercel.

## Environment variables

| Name                           | Where set                 | Secret | For                                                     |
| ------------------------------ | ------------------------- | ------ | ------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`         | optional, anywhere        | no     | Overrides the address above                             |
| `NEXT_PUBLIC_SENTRY_DSN`       | Vercel (all environments) | no     | Where error reports go; reports are off when it's unset |
| `SENTRY_AUTH_TOKEN`            | Vercel (all environments) | yes    | Uploads source maps at build; never reaches the browser |
| `SENTRY_ORG`, `SENTRY_PROJECT` | Vercel                    | no     | Names the Sentry project for the upload                 |
| `VERCEL_*`                     | Vercel, automatically     | no     | Read by `siteUrl()`                                     |

## Vercel

- **Project:** imported from GitHub by the owner's personal account
  (`kumaraswini-11`), on the Hobby plan (non-commercial, ADR 0006). Root
  Directory `apps/web`; Vercel detects Turborepo and the build command, and
  installs with Bun because it finds `bun.lock`
  ([monorepos](https://vercel.com/docs/monorepos/turborepo),
  [package managers](https://vercel.com/docs/package-managers)). Node.js
  comes from `engines.node` (`^24`).
- **Production and previews:** Vercel's Git integration builds production
  from `main` and a preview for every pull request; GitHub Actions doesn't
  deploy. Vercel "adds an X-Robots-Tag: noindex HTTP response header to
  every Preview Deployment automatically"
  ([previews and search engines](https://vercel.com/kb/guide/are-vercel-preview-deployment-indexed-by-search-engines)).
- **Ignored build step:** `npx turbo-ignore --fallback=HEAD^1`, the value
  Vercel's Turborepo guide gives, so a pull request that doesn't touch the
  web app or its packages doesn't build.
- **Environment scopes:** every variable here is set for the environments
  its table row names. Spec 006's server variables (`SERVER_ORIGIN`,
  `ORIGIN_SECRET`) are Production only, so previews never reach the server
  or its database.
- **Function region:** left at Vercel's default here; spec 006 sets it to
  the region nearest the VM once the VM exists.
- **Project name:** `coachlore`, for `coachlore.vercel.app`. If the name is
  taken, the address Vercel gives is used instead, and spec 000's text and
  ADR 0006 are updated to it.

## Sentry

- `@sentry/nextjs` on its 11 line (the newest release at least two weeks
  old when added), set up by hand as its
  [Next.js guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
  lays out, not with the wizard (which edits files without review).
- **No personal data:** `dataCollection: { userInfo: false, cookies: false,
httpHeaders: false, httpBodies: [], urlQueryParams: false,
stackFrameVariables: false }`, as
  [ADR 0006](../../adr/0006-architecture-and-stack.md) records from Sentry's
  docs; nothing calls `Sentry.setUser()`; Session Replay not installed; and a
  `beforeSend` that drops `request.cookies`, `request.headers`, `user` and
  `request.data` as a second guard. A test captures an error with the
  transport mocked and checks the outgoing event has no IP, user, cookies,
  headers or stack-frame variables.
- **Traces:** on the server only, a sample rate of 0.1 in production, 1.0 in previews.
- **The browser loads Sentry on the first error.** Next.js runs `instrumentation-client` before hydration and asks: "Keep instrumentation code lightweight" ([instrumentation-client](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client)). Sentry's Loader Script "won't load the full SDK until triggered by" an error, to keep "pageload performance high" ([Loader](https://docs.sentry.io/platforms/javascript/install/loader/)); its tree-shaking options "are not supported for Turbopack builds". So `instrumentation-client.ts` only listens for errors, and `lib/sentry-client.ts` loads a small chunk with `init` and `captureException` on the first one, with tracing, web vitals, sessions and Sentry's own global handlers off. Measured: a normal page load fetches 2 KB more JavaScript than before Sentry, not 59 KB. The trade-off, as Sentry states it: no breadcrumbs before the first error.
- **The content security policy:** the build plugin's tunnel route sends
  reports to a path on our own address, so `connect-src` stays `'self'`
  (ADR 0003).
- **Source maps:** uploaded at build with `SENTRY_AUTH_TOKEN`, then deleted
  from the build output, so the browser never gets them.
- **Placeholders count as unset:** `.env.example` shows required values as
  `<placeholder>`, so a value still in angle brackets (a copied file not yet
  filled in) is treated as unset: no reporting without a real DSN, and no
  source-map upload without a real token. A test covers both.
- **Environments:** `VERCEL_ENV` is the Sentry environment (`production`,
  `preview`, `development`); nothing is sent in development unless the DSN
  is set locally.

## Data model

None.

## API

None.

## Events

None.

## Jobs

None.

## Tests

| Acceptance criterion | Proved by                                                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1                    | `curl` of production after the first deploy: the canonical link, `og:url`, `/robots.txt`, `/sitemap.xml`; output in the task's pull request           |
| 2                    | `curl -I` of a preview shows `x-robots-tag: noindex`; its canonical link uses the preview's address                                                   |
| 3                    | `site-url.test.ts` (Vitest, first added here; later specs add it to their packages): each case of `siteUrl()`                                         |
| 4                    | The owner opens `/error-check` on a preview and finds the event in Sentry: stack trace, digest, no IP, cookie or user; screenshot in the pull request |
| 5                    | Playwright (spec 001) fails on any `securitypolicyviolation` event; until then, the browser console on a preview                                      |
| 6                    | `.env.example` reviewed against `process.env` reads (`git grep "process.env"`)                                                                        |
| 7                    | CI on the pull request                                                                                                                                |

## Decisions

| Item               | The repository now                  | What the docs say (quoted)                                                                                                                                                                                         | Decision                                                  |
| ------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| The site's address | `NEXT_PUBLIC_SITE_URL` or localhost | `VERCEL_PROJECT_PRODUCTION_URL`: "A production domain name of the project", available "at both build and runtime" ([system variables](https://vercel.com/docs/environment-variables/system-environment-variables)) | Derived from Vercel's variables, with the override kept   |
| Deploys            | none                                | Pull requests "create preview deployments" ([environments](https://vercel.com/docs/deployments/environments))                                                                                                      | Vercel's Git integration; no deploy job in GitHub Actions |

## Tasks

1. **Owner: Vercel.** Sign in to Vercel with GitHub as `kumaraswini-11`,
   import the repository, name the project `coachlore`, set Root Directory
   to `apps/web`, keep the detected settings, make sure Environment
   Variables → "Automatically expose System Environment Variables" is on
   (the address helper reads them), and set the Ignored Build Step above.
   Done when the first production deploy is live and test 1 (the production
   canonical link and `og:url`) passes against it.
2. **Tests and the address helper.** Vitest (its version in the workspace
   catalog) in `apps/web`, a `test` task in `turbo.json`, a root `test`
   script and a `bun run test` step in CI: the repository's first tests.
   Then `lib/site-url.ts` with `siteUrl()`, its unit test, and every use of `SITE_URL` moved to it; `turbo.json` declares the
   variables. Done when the test passes and a preview's canonical link uses
   its own address.
3. **Owner: Sentry.** Create a free Sentry account and a Next.js project;
   add `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT` and an auth
   token as `SENTRY_AUTH_TOKEN` in Vercel's settings. Done when the four
   variables are set.
4. **Error reporting.** The Sentry files, the build plugin, the tunnel
   route, the no-personal-data settings, the error pages reporting, and
   `/error-check`. Done when criterion 4 is shown on a preview and the
   checks pass.
5. **Documents.** `.env.example`, `apps/web/README.md` (deploys and
   previews), the scaffold follow-ups plan (production site URL and error
   reporting marked done), AGENTS.md's Stack list (Vercel, Sentry). Done
   when every criterion above is recorded in the pull request.
