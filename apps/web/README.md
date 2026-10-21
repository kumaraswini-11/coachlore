# web

Coachlore's web app, built with [Next.js](https://nextjs.org) 16 on the App
Router and React 19, in English and Hindi. The Dex and Leagues are planned to
live here (see the [root README](../../README.md)).

## Run

From the repository root:

```bash
bun install
bun run dev
```

The app runs at <http://localhost:3000>, which redirects to `/en` or `/hi`. The checks to run before a change is
done are in [AGENTS.md](../../AGENTS.md), "Commands".

## Folders

| Folder        | What goes in it                                                             | Now                                                                                                                                                                                                                                                                                                                                                                                |
| ------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/`        | routes: layouts, pages and other route files                                | `[lang]/`: every page, under its language, with the root layout, the error and not-found pages and the share image; at the top: `global-error.tsx`, `global-not-found.tsx` and the metadata files (icons, manifest, robots, sitemap)                                                                                                                                               |
| `i18n/`       | languages (next-intl)                                                       | `routing.ts`: the languages and how addresses carry them; `request.ts` and `messages.ts`: each request's language and messages; `locales.ts`: directions and names; `paths.ts`: the pages, their addresses and alternates; `metadata.ts`: a page's title, canonical and hreflang; `error-messages.ts`: the error pages' strings                                                    |
| `messages/`   | every interface string, in ICU, one folder per language                     | `en/` (the source) and `hi/`, each with `main.json` and `errors.json` (the error pages read it alone)                                                                                                                                                                                                                                                                              |
| `components/` | components only this app uses; one feature's own in `components/<feature>/` | `shell/`: the app shell (`app-shell.tsx`), the display menu (theme, language, the `d` key on or off) and the footer's language links; `lang.tsx`: `<Lang>` for text in another language and `<WrittenIn>`; `theme-provider.tsx` and `theme-hotkey.tsx` (the `d` key, which WCAG 2.1.4 requires a way to turn off); `error-state.tsx`: what `error.tsx` and `global-error.tsx` show |
| `hooks/`      | hooks used only by this app                                                 | empty                                                                                                                                                                                                                                                                                                                                                                              |
| `lib/`        | helpers used only by this app                                               | `site.ts`: the site's name and colours; `site-url.ts`: its address; `fonts.ts`: the fonts, loaded once ([font definitions file](https://nextjs.org/docs/app/api-reference/components/font#using-a-font-definitions-file)), and each script's font                                                                                                                                  |

Imports starting with `@/` resolve from this folder, for example
`@/components/theme-provider`. Shared components belong in
[`@workspace/ui`](../../packages/ui). `components.json` is the shadcn CLI's
configuration for the app. Where each kind of component goes, and why:
[ADR 0001](../../docs/adr/0001-ui-component-layout.md).

## Rendering and errors

The app uses Cache Components, Next.js 16's rendering model: data is dynamic
by default and cached where marked with `use cache`, and each page's static
shell is prerendered ([ADR 0003](../../docs/adr/0003-rendering-and-production-defaults.md)).

| File                       | Shows                                                                                                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/global-not-found.tsx` | any address that matches no page (after the Proxy gives it a language), in English and Hindi, with a 404 status and a link to each home page                          |
| `app/[lang]/not-found.tsx` | a page that calls `notFound()`, in its language; under Cache Components it renders only in the browser, so pages check unknown values in the Proxy instead (ADR 0008) |
| `app/[lang]/error.tsx`     | an error in a page, with Try again (`retry`, which fetches and renders the page again)                                                                                |
| `app/global-error.tsx`     | an error in the root layout itself; it replaces the layout, so it brings its own `<html>`, styles and fonts                                                           |

Both error pages report to Sentry; so do server errors, through `onRequestError` in `instrumentation.ts`. The settings, shared by the browser, server and edge set-ups, are in `lib/sentry-options.ts`: no personal data (ADR 0006), and nothing is sent without a real DSN. In the browser, Sentry loads only on the first error (the strategy of Sentry's Loader Script, served from our own address), so a page without errors pays nothing; it reports errors only, no tracing. Reports go through `/monitoring` on our own address, so the content security policy stays `'self'`; `proxy.ts` leaves that path alone. `/error-check` throws on purpose to test it, and is a 404 in production.

No `loading.tsx`: Next.js advises Suspense boundaries close to the data that
waits, not one around the whole page.

## Titles and descriptions

Every page has a title and a description, written with Next.js's
[Metadata API](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
from the page's language's messages and [`lib/site.ts`](lib/site.ts):

- **The root layout** sets the defaults: the home page's title, the title
  template `%s · Coachlore`, the description, Open Graph and the Twitter card.
  The share image is `app/opengraph-image.png` (with its alt text in
  `opengraph-image.alt.txt`); Twitter's card reuses it.
- **A page** exports `generateMetadata` returning `pageMetadata(path, { title,
description })` from `i18n/metadata.ts`: its title from its messages (just
  the page's name: the template adds `· Coachlore`), a one-sentence
  description of what the page offers, unique across the site, its canonical
  address in its language, `hreflang` for every language plus `x-default`,
  and `og:url` (Open Graph requires it). None of these is set in the layout:
  Next.js merges metadata shallowly, so every page would inherit the
  layout's.
- **A page whose title depends on data** (a Pokémon, a league, a move) uses
  `generateMetadata`, with the data request wrapped in React's `cache()` so
  the page and its metadata fetch once.
- **A page behind sign-in** (a league's settings, `/me`) gets a title only, and
  `robots: { index: false }`.
- **Open Graph:** a page that sets `openGraph` replaces the layout's whole
  object, so it spreads `OPEN_GRAPH` from `lib/site.ts` back in. A page in a
  folder below `app/` also loses the share image that way, so it lists it in
  `images` too, or adds its own `opengraph-image.png`.
- **The sitemap** ([`app/sitemap.ts`](app/sitemap.ts)) lists every public
  page in every language, with its alternates; Dex pages are added from the
  data once it exists.

| Page       | Title                                                                                    | Description                                                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `/`        | `Coachlore · Pokédex and draft leagues` (Hindi: `Coachlore · पोकेडेक्स और ड्राफ़्ट लीग`) | A fast, mobile-first Pokédex and a home for Pokémon draft leagues: live drafts, schedules, trades, standings and match recaps. |
| not found  | `Page not found · Coachlore`                                                             | There’s no page at this address on Coachlore.                                                                                  |
| `/about`   | `About · Coachlore`                                                                      | What Coachlore is: a fan-made Pokédex and a home for Pokémon draft leagues, and the sources it credits.                        |
| `/legal`   | `Legal · Coachlore`                                                                      | Coachlore’s not-affiliated notice, the licences of the data and images it uses, and how it handles your data.                  |
| `/offline` | `You’re offline · Coachlore`                                                             | This page isn’t saved for offline use on Coachlore. (`noindex`)                                                                |

Update the table when a page is added.

## Languages

Every page is served as `/en/…` and `/hi/…` with [next-intl](https://next-intl.dev)
([ADR 0008](../../docs/adr/0008-translation-library.md)). `proxy.ts` sends an
address without a language to the one chosen before (the `lang` cookie), else
the browser's best match, else English. Server Components read messages with
`getTranslations`; Client Components get their strings as props. No text is
written into a component (ESLint's `react/jsx-no-literals`), and no style uses
`left` or `right` (`scripts/check-logical-css.ts`), so a right-to-left
language needs no redesign.

**Adding a language:**

1. Add its tag to `locales` in `i18n/routing.ts`: the redirect, the cookie,
   the static pages, `hreflang` and the sitemap follow.
2. Add its direction to `i18n/locales.ts` (`"rtl"` for Arabic or Urdu);
   `locales.test.ts` checks it against the browser's own data.
3. If Inter lacks its script, add its Noto font to `lib/fonts.ts`
   (`preload: false`) and its entry in `SCRIPT_FONTS`; the theme puts it
   after Inter. A Devanagari language also gets the line height in
   `packages/ui`'s `globals.css`.
4. Add `messages/<tag>/` with `main.json` and `errors.json`, translated
   from `en/` (ICU; a translation platform takes the files as they are),
   and its `errors.json` in `i18n/error-messages.ts`. `messages.test.ts`
   checks the keys, arguments and plural forms.
5. Decide its digits and calendar (Latin digits unless decided otherwise).
6. Run every end-to-end test in it; for a right-to-left language, the
   right-to-left checks too.

## Environment variables

Each one is documented in [`.env.example`](.env.example), as
[AGENTS.md](../../AGENTS.md) ("Files") requires.

| Variable                                            | What it is                                                                                                    |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                              | optional override of the site's address; otherwise `siteUrl()` takes it from Vercel, or uses `localhost:3000` |
| `NEXT_PUBLIC_SENTRY_DSN`                            | where error reports go; unset (or a placeholder), nothing is sent                                             |
| `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | the source-map upload at build; the token is secret, and set only in Vercel                                   |

## Deploys

Vercel builds production from `main` and a private preview of every pull request (signed-in Vercel accounts only, and `noindex`). Its project's Root Directory is `apps/web`; the Sentry variables are set for Production and Preview. A broken production deploy is rolled back from Vercel's dashboard, and the fix goes through a pull request as usual.

## See also

- [README](../../README.md): what Coachlore is.
- [AGENTS.md](../../AGENTS.md): how to work in this repository.
- [`@workspace/ui`](../../packages/ui): the shared components and theme.
