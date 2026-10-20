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

| Piece          | Decision                                                                                                                                                                                     | Source                                                                                                                                                                                                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rendering      | `cacheComponents: true` with `partialPrefetching: true`: data dynamic by default, cached where marked `use cache`, each page's static shell prerendered                                      | [cacheComponents](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents); [Caching](https://nextjs.org/docs/app/getting-started/caching): "New App Router apps created with the recommended `create-next-app` defaults already have Cache Components and Partial Prefetching enabled" |
| Routes         | `typedRoutes: true`: links and router calls are type-checked against the routes that exist                                                                                                   | [typedRoutes](https://nextjs.org/docs/app/api-reference/config/typescript#statically-typed-links)                                                                                                                                                                                                               |
| Not found      | `app/not-found.tsx`, a Server Component with its own metadata; Next.js answers 404 and adds `noindex`                                                                                        | [not-found.js](https://nextjs.org/docs/app/api-reference/file-conventions/not-found)                                                                                                                                                                                                                            |
| Errors         | `app/error.tsx` for pages, `app/global-error.tsx` for the root layout (its own `<html>`, styles and fonts, and React's `<title>`), both with `retry`                                         | [error.js](https://nextjs.org/docs/app/api-reference/file-conventions/error)                                                                                                                                                                                                                                    |
| Loading        | no root `loading.tsx`: Suspense boundaries go close to the data that waits                                                                                                                   | [Streaming](https://nextjs.org/docs/app/guides/streaming)                                                                                                                                                                                                                                                       |
| Content policy | Next.js's CSP "without nonces", which keeps pages static (`'unsafe-inline'` for scripts; `'unsafe-eval'` only in development)                                                                | [Content Security Policy](https://nextjs.org/docs/app/guides/content-security-policy#without-nonces)                                                                                                                                                                                                            |
| Other headers  | `X-Content-Type-Options: nosniff`, `Permissions-Policy` (camera, microphone, geolocation, browsing-topics off), `Referrer-Policy: strict-origin-when-cross-origin`; `poweredByHeader: false` | [headers](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers); [poweredByHeader](https://nextjs.org/docs/app/api-reference/config/next-config-js/poweredByHeader); [MDN, Referrer-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy)             |

`next.config.ts` exports a function of the phase (Next.js's "Configuration as
a Function") to tell development from the rest, rather than reading
`NODE_ENV`.

## Departures from official guidance

- **Referrer-Policy.** Next.js's headers example uses
  `origin-when-cross-origin`; Draftboard uses
  `strict-origin-when-cross-origin`, the browsers' default, which sends no
  referrer from HTTPS to HTTP ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy)).
- **`global-not-found.tsx`.** The production checklist suggests it, but it's
  experimental, and its docs say it's for apps that "can't build a 404 page
  using a combination of `layout.js` and `not-found.js`" (several root
  layouts, or one under a dynamic segment). Draftboard has one root layout,
  so `not-found.tsx` serves.
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
