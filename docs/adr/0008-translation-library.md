# 8. Translation library: next-intl

- Status: Accepted (the owner, 2026-10-21)
- Date: 2026-10-21
- Supersedes: [ADR 0007](0007-languages-and-right-to-left.md)'s "Interface
  text" and "Choosing the language" rows, and its "A translation library"
  alternative

## Context

ADR 0007 chose Next.js's guide pattern with no library: JSON dictionaries,
`Intl` and one `t()` helper. Before any screen depended on it, the owner set
the bar higher: production-ready and enterprise-grade, adding a language a
routine checklist (right-to-left ones included), and a translator workflow
that scales. The research behind this decision, with every source, is
[Internationalization](../research/internationalization.md) (2026-10-21).

Without a library, plurals for each new language are our own code (Arabic
has six forms), and translation platforms can't read or check a home-made
`{name}` syntax. The guide itself says localization "is not something
specific to Next.js" and stops before plurals, formatting and translator
workflow.

## Decision

| Item                 | Before (checked 2026-10-21)               | Official docs (quoted)                                                                                                                                                                                                  | Decision                                                                                                                                                                                                                                                          |
| -------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Library              | none (ADR 0007)                           | Next.js's i18n guide lists next-intl first under "Resources"; next-intl: with `next/root-params`, "your app is automatically eligible for static rendering" ([routing setup](https://next-intl.dev/docs/routing/setup)) | next-intl 4.14.9 (MIT, released 2026-10-02), in `apps/web` only                                                                                                                                                                                                   |
| Messages             | JSON with `{name}`, plurals in code       | next-intl: "ICU message syntax … cardinal & ordinal plurals, enum-based label selection and rich text" (its README)                                                                                                     | ICU messages in `apps/web/messages/<locale>/`: `main.json`, and `errors.json` apart so the error pages can read it alone (next-intl's "split messages"); English is the source and the type                                                                       |
| Reading the language | `getDictionary()` with `next/root-params` | next-intl's `i18n/request.ts` reads `rootParams.locale()` and calls `notFound()` for an unknown one ([routing setup](https://next-intl.dev/docs/routing/setup))                                                         | `apps/web/i18n/request.ts`, the same with our segment, `lang`                                                                                                                                                                                                     |
| The redirect         | our own `pickLocale` in the Proxy         | `createMiddleware(routing)` in `proxy.ts` ([routing setup](https://next-intl.dev/docs/routing/setup))                                                                                                                   | next-intl's middleware: the prefix, then the `lang` cookie, then the best match in `Accept-Language`, then English; one list, `i18n/routing.ts`, drives it                                                                                                        |
| The cookie           | set by our Proxy, `httpOnly`              | next-intl's `localeCookie` takes `maxAge`, `sameSite` and the like, not `httpOnly` (its `RoutingConfig` type); it's written only for a page the person opens (`Sec-Fetch-Dest: document`)                               | `lang`, a year, `SameSite=Lax`, readable by scripts; it holds a language, nothing private                                                                                                                                                                         |
| Types                | the dictionary's type                     | "`AppConfig`" with `Locale` and `Messages`; `createMessagesDeclaration` types the arguments ([TypeScript](https://next-intl.dev/docs/workflows/typescript))                                                             | `apps/web/global.d.ts`, and the plugin's `createMessagesDeclaration`; the generated `*.d.json.ts` is gitignored                                                                                                                                                   |
| The browser          | strings as props                          | "passing the processed labels as props or `children` from a Server Component" ([server and client components](https://next-intl.dev/docs/environments/server-client-components))                                        | No messages and no next-intl code in the browser: Client Components get strings as props, and the error pages (Client Components on every page) read `errors.json` through `i18n/error-messages.ts`, plain text with `{name}` arguments, which a test keeps plain |
| Checks               | `dictionaries.test.ts`                    | –                                                                                                                                                                                                                       | `apps/web/i18n/messages.test.ts`: the same keys as English, every message valid ICU with English's arguments, and each plural with the categories CLDR gives the language (`Intl.PluralRules`)                                                                    |

next-intl's experimental parts (message extraction with `useExtracted`,
`precompile`) are not used. Links stay `next/link` with `localeHref`, until
next-intl's `Link` is shown to work with `"use cache"`.

## Alternatives considered

- **No library** (ADR 0007): no dependency, but no standard message format;
  every new language's plurals are our own code, and translation platforms
  can't check the messages.
- **Lingui:** the best translator tooling (PO files with context, stable
  extraction, a check command), but on Next.js it needs an experimental SWC
  plugin tied to Next's compiler version, and setup in every layout and
  page.
- **FormatJS (react-intl):** the reference ICU implementation, but routing
  and static rendering are left to us.

## Consequences

- Adding a language is the checklist in [apps/web/README.md](../../apps/web/README.md)
  ("Languages"): one entry in `i18n/routing.ts`, its direction, its font, its
  messages from a translation platform, and the end-to-end tests in it.
- next-intl has one maintainer. The messages are standard ICU, so they would
  move unchanged to another ICU library.
- next-intl 4.14.9 installs its extraction tools (`@swc/core`,
  `@parcel/watcher`, pre-1.0 `@eloqnt/*`) as dependencies though they're
  unused here: a larger install, nothing more in the browser.
- An address without a language is redirected into one; one that then
  matches no page gets `app/global-not-found.tsx`, as complete server HTML
  with a 404, in the language the Proxy chose (next-intl's `requestLocale`).
  Until 2026-10-22 it showed every language at once, which wouldn't scale
  past two; reading the request's language needs `export const instant =
false` (Next.js's "blocking-prerender-runtime" message), so the page
  renders on each request instead of at build time. A `notFound()` inside a page, under
  Cache Components and a root layout under `[lang]`, renders its
  not-found page only in the browser (tested on 2026-10-21), so a page with
  an unknown value (a Pokémon, spec 004) is checked in the Proxy and
  rewritten to an address that matches nothing, as Next.js's "Status codes"
  docs advise.

## Sources

Linked inline above, and in the research; checked on 2026-10-21.
