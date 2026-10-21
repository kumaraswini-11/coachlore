# 000: Platform

| Status  | Owner             | Written    |
| ------- | ----------------- | ---------- |
| Written | Aswini Kumar Sahu | 2026-10-21 |

## Goal

The web app is live at a public address, rebuilt from `main` after every
merge, with a private preview of every pull request, its secrets kept out
of the repository, and its errors reported where the owner sees them,
without personal data. Nothing here needs the server; that arrives with
spec 006.

## Where this comes from

The project doc: "Running in public", "Failures are seen before users
report them", "It costs nothing to run while it's small"; ADR 0006
("Hosting", "Errors and logs"); the scaffold follow-ups plan (production
site URL, error reporting).

## Requirements

1. **Production.** The web app is served at `https://coachlore.vercel.app`
   (no domain: the owner, 2026-10-21), built from `main` each time `main`
   moves.
2. **Previews.** Every pull request gets its own preview address, linked
   from the pull request, rebuilt on each push to its branch. Previews are
   kept out of search engines.
3. **The checks stay the gate.** The repository's checks (lint, types,
   format, build, the identity check, the advisory audit) run on every pull
   request as they do now. `main` moves only by fast-forward from a branch
   whose checks passed (the git workflow), so production is only ever
   built from checked commits.
4. **The site's address is right everywhere.** Canonical addresses, link
   previews, `robots.txt` and the sitemap use the production address in
   production, the preview's own address in a preview, and the local
   address in development, without anyone setting it by hand. An address
   set explicitly overrides them.
5. **Errors are reported.** An error in the web app, in the browser or on
   the server side of the web app, reaches an error-reporting service the
   owner can see, with the page, the browser and the stack trace, and the
   error reference (`digest`) the error page shows.
6. **No personal data in reports:** no IP addresses, cookies, request
   bodies, user names or session recordings.
7. **Reports work under the content security policy,** without loosening
   it to allow another origin.
8. **Secrets.** Every setting the app reads is listed in
   `apps/web/.env.example` with what it's for and whether it's secret.
   Secret values live only in the host's settings, never in the
   repository, a log or a build output.
9. **$0.** Everything here runs on free plans.

## Rules and edge cases

- A preview that fails to build doesn't affect production.
- **Previews never reach production's data.** From spec 006 on, the settings
  that connect the web app to the server are given to production only; a
  preview has none, so it can't read or change a real league, and its
  league screens show fixtures (spec 006).
- If production is broken by a merge, the previous production build can
  be restored from the host's dashboard; the fix then goes through a pull
  request as usual.
- Reporting must not slow the page: nothing is sent unless an error
  happens, apart from a small sample of performance traces.
- Error reporting may be blocked by a viewer's browser extension; the app
  works the same without it.

## Screens

None. The error pages (`error.tsx`, `global-error.tsx`) keep their look
(spec 001); they now report the error as well as showing its reference.

## Acceptance criteria

1. `https://coachlore.vercel.app` serves the current `main`, and its
   canonical link, `og:url`, `robots.txt` and sitemap all use that
   address. (Checked with `curl` after a deploy; recorded in the task.)
2. A pull request shows a preview link; the preview responds with
   `X-Robots-Tag: noindex`, and its canonical link uses its own address.
3. With no address variable set, a local build uses
   `http://localhost:3000`; with the variable set, the variable wins.
   (Unit test of the address helper.)
4. An error thrown on purpose in a preview (a test-only route that exists
   only outside production) appears in the error-reporting service with
   its stack trace and digest, and with no IP address, cookie or user
   field. (Checked by the owner in the service; screenshot in the pull
   request.)
5. The browser's console shows no content-security-policy violation on any
   page, in production and in a preview.
6. `apps/web/.env.example` lists every variable the app reads; a search of
   the repository finds no secret value.
7. The repository's checks pass on the pull request that adds this.

## Out of scope

- The server, its database and its host (spec 006).
- A custom domain (none, by the owner's decision).
- Uptime monitoring, analytics and Web Vitals reporting (spec 014 measures
  speed).

## Changes

- 2026-10-21: written.
- 2026-10-21: audit: previews never reach production's data.
