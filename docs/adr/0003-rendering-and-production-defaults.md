# 3. Rendering and production defaults

- Status: Accepted
- Date: 2026-10-20

## Context

The app had Next.js's previous rendering model (an empty `next.config.ts`),
no error or not-found pages of its own, no security headers, and the
`x-powered-by` header on. The decisions below come from the docs bundled with
the installed Next.js 16.4.0 (`node_modules/next/dist/docs/`), which AGENTS.md
names as the authority.

## Decision

| Item           | Before (checked 2026-10-20)                         | Official docs (quoted)                                                                                                                                                                                                                                                                                                                                                                                                                              | Decision                                                                                                                                                                                     |
| -------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rendering      | an empty `next.config.ts`: Next.js's previous model | "New App Router apps created with the recommended `create-next-app` defaults already have Cache Components and Partial Prefetching enabled" ([Caching](https://nextjs.org/docs/app/getting-started/caching); [cacheComponents](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents))                                                                                                                                    | `cacheComponents: true` with `partialPrefetching: true`: data dynamic by default, cached where marked `use cache`, each page's static shell prerendered                                      |
| Routes         | links and router calls untyped                      | "Next.js can statically type links to prevent typos and other errors when using `next/link`" ([TypeScript config](https://nextjs.org/docs/app/api-reference/config/typescript#statically-typed-links))                                                                                                                                                                                                                                              | `typedRoutes: true`                                                                                                                                                                          |
| Not found      | Next.js's built-in 404                              | "Next.js injects a `<meta name="robots" content="noindex" />` tag in both cases" ([not-found.js](https://nextjs.org/docs/app/api-reference/file-conventions/not-found))                                                                                                                                                                                                                                                                             | `app/not-found.tsx`, a Server Component with its own metadata                                                                                                                                |
| Errors         | none                                                | "Global error UI must define its own `<html>` and `<body>` tags, global styles, fonts, or other dependencies that your error page requires" ([error.js](https://nextjs.org/docs/app/api-reference/file-conventions/error))                                                                                                                                                                                                                          | `app/error.tsx` for pages, `app/global-error.tsx` for the root layout (its own `<html>`, styles and fonts, and React's `<title>`), both with `retry`                                         |
| Loading        | none                                                | On Suspense boundaries: "don't add one you don't need" ([Streaming](https://nextjs.org/docs/app/guides/streaming))                                                                                                                                                                                                                                                                                                                                  | No root `loading.tsx`: Suspense boundaries go close to the data that waits                                                                                                                   |
| Content policy | none                                                | "For applications that do not require nonces, you can set the CSP header directly in your `next.config.js` file" ([Content Security Policy](https://nextjs.org/docs/app/guides/content-security-policy#without-nonces))                                                                                                                                                                                                                             | Next.js's CSP "without nonces", which keeps pages static (`'unsafe-inline'` for scripts; `'unsafe-eval'` only in development)                                                                |
| Other headers  | none; `x-powered-by` sent                           | "By default Next.js will add the `x-powered-by` header" ([poweredByHeader](https://nextjs.org/docs/app/api-reference/config/next-config-js/poweredByHeader); [headers](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers)); `strict-origin-when-cross-origin` "is the default policy if no policy is specified" ([MDN, Referrer-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy)) | `X-Content-Type-Options: nosniff`, `Permissions-Policy` (camera, microphone, geolocation, browsing-topics off), `Referrer-Policy: strict-origin-when-cross-origin`; `poweredByHeader: false` |

`next.config.ts` exports a function of the phase (Next.js's "Configuration as
a Function") to tell development from the rest, rather than reading
`NODE_ENV`.

## Departures from official guidance

- **Referrer-Policy.** Next.js's headers example uses
  `origin-when-cross-origin`; Coachlore uses
  `strict-origin-when-cross-origin`, the browsers' default, which sends no
  referrer from HTTPS to HTTP ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy)).
- **`global-not-found.tsx`.** The production checklist suggests it, but it's
  experimental, and its docs say it's for apps that "can't build a 404 page
  using a combination of `layout.js` and `not-found.js`" (several root
  layouts, or one under a dynamic segment). Coachlore has one root layout,
  so `not-found.tsx` serves. **Superseded on 2026-10-21 by
  [ADR 0007](0007-languages-and-right-to-left.md):** the root layout moves
  under `app/[lang]`, which its docs name as the second case ("Your root
  layout is defined using top-level dynamic segments"), so spec 001 adds
  `global-not-found.tsx` with the `experimental.globalNotFound` flag, and
  each language keeps its own `not-found.tsx`. **Built on 2026-10-21 ([ADR 0008](0008-translation-library.md)):**
  the Proxy gives every address a language, and one that matches no page
  gets `global-not-found.tsx`, in both languages, as complete HTML. A
  `notFound()` inside a page renders `[lang]/not-found.tsx` only in the
  browser (tested), so pages check unknown values in the Proxy instead.
- **The owner's metadata plan**, where the docs differ: the canonical URL is
  set by each page, not the root layout (metadata merges shallowly, so every
  page would inherit "/"); the home page has no title of its own (a layout's
  template doesn't apply to the page in its own segment, so it shows
  `title.default`); and the share image comes from the `opengraph-image.png`
  file convention rather than a path in `site.ts`. One addition: each page
  also sets `openGraph.url`, since Open Graph lists `og:url` among "the four
  required properties for every page" ([ogp.me](https://ogp.me/)) and Next.js
  doesn't derive it from the canonical URL.

## Alternatives considered

- **Keeping the previous model** (no Cache Components). It works today, but
  Next.js plans to enable Cache Components everywhere in the next major
  release and remove the option, and every route added before then would need
  migrating.
- **A nonce-based CSP.** It removes `'unsafe-inline'`, but "all pages must be
  dynamically rendered" and it's incompatible with Partial Prerendering.
- **Subresource Integrity** (`experimental.sri`), a strict CSP that stays
  static. Experimental; revisit when it's stable.
- **React Compiler** (`reactCompiler`). Stable, but not enabled by default
  ("as we continue gathering build performance data"); a separate decision.

## Consequences

- A component that reads request data or uncached I/O must be inside
  `<Suspense>` or cached with `use cache`, or the build fails. Route segment
  options `dynamic`, `revalidate` and `fetchCache` don't apply.
- Navigation keeps recently visited pages mounted (React's `<Activity>`), so
  component state survives going back.
- Inline scripts are allowed by the CSP; anything that injects one from
  another origin is still blocked.
- Left for when hosting and the domain are chosen: `Strict-Transport-Security`
  (its `includeSubDomains` and `preload` commit the whole domain), an
  error-reporting service for `error.tsx` and `global-error.tsx` (they log to
  the console until then), and analytics for Web Vitals.

## Sources

Linked inline above.
