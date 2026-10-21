# Internationalization and right to left: research and recommendation

> **A dated snapshot, not maintained.** Research for a decision, kept as it
> was written. Where it and a later document disagree, the later one wins:
> the [project doc](../project-doc.md), then the specs and decision records
> ([ADR 0007](../adr/0007-languages-and-right-to-left.md) in particular).

Research date: 21 October 2026. Every link was checked on that date, except
the npmjs.com package pages, which refuse automated requests. Versions,
release dates and release counts come from the npm registry itself
(`npm view`), read the same day. Next.js facts come from the docs bundled
with the installed 16.4.1 (`apps/web/node_modules/next/dist/docs/`), linked
here at their nextjs.org address. **Not verified** marks a claim whose source couldn't be
read, or a figure the source gives without a method. **Observed** means run
locally in Node 24.13.0 (ICU 77.1, CLDR 47.0), not taken from a document.

---

## Contents

1. [The question, and the owner's criteria](#1-the-question-and-the-owners-criteria)
2. [The options compared](#2-the-options-compared)
3. [How large apps structure it](#3-how-large-apps-structure-it)
4. [Locale routing and negotiation](#4-locale-routing-and-negotiation)
5. [Right to left, end to end](#5-right-to-left-end-to-end)
6. [Hindi specifics](#6-hindi-specifics)
7. [Scaling to many languages](#7-scaling-to-many-languages)
8. [Recommendation](#8-recommendation)
9. [What changes in ADR 0007 and spec 001's plan](#9-what-changes-in-adr-0007-and-spec-001s-plan)
10. [Sources](#10-sources)

---

## 1. The question, and the owner's criteria

What is the best-practice, scalable way to do internationalization and
right-to-left layout for Coachlore: Next.js 16.4.1 App Router with
`cacheComponents: true`, typed routes, static pages and Server Components by
default, shadcn/ui on Base UI and Tailwind 4.3? English and Hindi now, more
later, including Arabic and Urdu.

The owner set the criteria, in this order:

1. Production-ready and enterprise-grade, following each tool's documented
   best practice.
2. Adding a language, including a right-to-left one, is a checklist, not a
   refactor.
3. A translator workflow that scales: files a translation platform takes,
   missing or extra keys caught in CI, plurals and formatting by CLDR rules.

ADR 0007 chose no library: the Next.js guide's `app/[lang]`, a Proxy redirect,
JSON dictionaries, `Intl` and one `t()` helper. This document weighs that
choice against the three criteria, not on dependency count alone.

---

## 2. The options compared

### 2.1 Fit with Next.js 16, Cache Components and static pages

The key fact is new in Next.js 16.3: [`next/root-params`](https://nextjs.org/docs/app/api-reference/functions/next-root-params).
Any Server Component can read `lang` with `await lang()`. Inside `"use cache"`,
"Only those root parameters become part of the cache key". With Cache
Components, `generateStaticParams` is required: "each root parameter must have
at least one value or the build fails". The getters don't work in Client
Components, Server Actions or Route Handlers (same page). A library that reads
the locale through root params stays static. One that reads `headers()` or
`cookies()` makes pages dynamic.

| Option                                                          | Static with Cache Components                                                                                                                                                                                                                                                                               | How it gets the locale in Server Components                                                                                                 | Client cost                                                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| (a) Guide pattern, no library                                   | Yes. It is Next's own pattern ([i18n guide](https://nextjs.org/docs/app/guides/internationalization))                                                                                                                                                                                                      | `getDictionary()` reads `lang()`                                                                                                            | None. Strings are passed as props                                                                                                                                                                                                                                                                                                                         |
| (b) **next-intl** 4.14.9                                        | Yes. With the `next/root-params` setup, the app "is automatically eligible for static rendering". `setRequestLocale` is now "a legacy API" ([routing setup](https://next-intl.dev/docs/routing/setup))                                                                                                     | `getRequestConfig` reads `rootParams.locale()` ([getting started](https://next-intl.dev/docs/getting-started/app-router/with-i18n-routing)) | None in Server Components ("No runtime cost on the client side"). Client Components get messages through `NextIntlClientProvider`, all of them by default ([server and client](https://next-intl.dev/docs/environments/server-client-components)). About 9 KB less with the experimental `precompile` ([blog](https://next-intl.dev/blog/precompilation)) |
| (c) Lingui 6.10.0                                               | Yes, per its RSC tutorial. Needs `setI18n` "not only in layouts, but also in pages", plus `generateStaticParams` ([RSC tutorial](https://lingui.dev/tutorials/react-rsc))                                                                                                                                  | `lang()` from `next/root-params`, then `setI18n`                                                                                            | "around 2 kB", "ships no message parser" ([introduction](https://lingui.dev/introduction)). Needs the SWC plugin under `experimental.swcPlugins`                                                                                                                                                                                                          |
| (d) Paraglide JS 2.29.1                                         | Yes for SSG, but "The Webpack plugin requires `--webpack` for development and builds" ([Next.js guide](https://github.com/opral/paraglide-js/blob/main/docs/getting-started/next-js.md)), so not Turbopack                                                                                                 | The locale is passed to every message call: `m.key(inputs, { locale })`                                                                     | Tree-shaken message functions. Its README claims "up to 70% smaller" ([repo](https://github.com/opral/paraglide-js); not verified)                                                                                                                                                                                                                        |
| (e) next-international 1.3.1                                    | The README says static rendering is supported ([repo](https://github.com/QuiiBz/next-international))                                                                                                                                                                                                       | –                                                                                                                                           | –                                                                                                                                                                                                                                                                                                                                                         |
| (f) i18next 26.5.4 + react-i18next 17.1.0 + next-i18next 16.4.1 | Yes with the locale in the path: `getT()` "reads the language from the `[lng]` root param first", and that "does not opt a route out of static prerendering". Without the locale in the path, `headers()`/`cookies()` make "every route dynamic" ([next-i18next](https://github.com/i18next/next-i18next)) | `getT()`                                                                                                                                    | Resources are serialized to `I18nProvider`. All languages are preloaded by default (same README). Size not verified                                                                                                                                                                                                                                       |
| (g) FormatJS / react-intl 12.1.5                                | Not stated. `react-intl/server` gives `createIntl` for Server Components ([Next.js guide](https://formatjs.github.io/docs/guides/nextjs-app-router)). You supply the locale, so it is as static as (a) (inference)                                                                                         | `createIntl({ locale })`                                                                                                                    | `IntlProvider` is a Client Component. Precompiled messages give "~40% smaller bundles" (same page)                                                                                                                                                                                                                                                        |
| (h) gt-next 11.4.13 / next-intlayer 9.7.0                       | gt-next needs General Translation project and API keys ([quickstart](https://generaltranslation.com/en-US/docs/react/nextjs-quickstart)). Intlayer "does not block static rendering" but doesn't mention Cache Components ([Intlayer](https://intlayer.org/doc/environment/nextjs))                        | –                                                                                                                                           | Intlayer: per-component dictionaries                                                                                                                                                                                                                                                                                                                      |

### 2.2 Messages and translator workflow

| Option                 | ICU MessageFormat (plural, select, number, date)                                                                                                                           | Type-safe keys                                                                                                                                            | Missing or extra keys in CI                                                                                                                                                            | Extraction                                                                                                                                     | Formats and translation platforms                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| (a) Guide pattern      | No. `{name}` placeholders plus `Intl.PluralRules` in code. Plural forms need a home-made JSON convention                                                                   | Yes (JSON import type)                                                                                                                                    | Our own test                                                                                                                                                                           | None                                                                                                                                           | Plain nested JSON. Platforms can't see the plurals                                                                                            |
| (b) next-intl          | Yes: `plural` (zero, one, two, few, many, other; `=0` exact matches), `selectordinal`, `select`, rich text ([translations](https://next-intl.dev/docs/usage/translations)) | Keys **and** arguments, through `AppConfig` and the generated `createMessagesDeclaration` ([TypeScript](https://next-intl.dev/docs/workflows/typescript)) | `eloqnt lint` finds missing translations and inconsistent ICU arguments ([linting](https://next-intl.dev/docs/workflows/messages)). `@eloqnt/cli` is 0.6.33, first published June 2026 | `useExtracted`, "currently experimental". JSON or PO. Keeps target locales in sync ([extraction](https://next-intl.dev/docs/usage/extraction)) | JSON. Crowdin documented ([localization management](https://next-intl.dev/docs/workflows/localization-management))                            |
| (c) Lingui             | Yes, ICU "under the hood". Compilation validates syntax ([introduction](https://lingui.dev/introduction))                                                                  | Typed message IDs since 6.2 ([releases](https://github.com/lingui/js-lingui/releases))                                                                    | `lingui check missing` and `check sync`; `compile --strict` fails on missing translations ([CLI](https://lingui.dev/ref/cli))                                                          | Stable `lingui extract`, `--clean`                                                                                                             | PO by default (comments, origins, context), JSON, CSV ([catalog formats](https://lingui.dev/ref/catalog-formats)). Maintainers are at Crowdin |
| (d) Paraglide          | Variants natively. ICU "Via plugin" ([repo](https://github.com/opral/paraglide-js))                                                                                        | Generated functions                                                                                                                                       | inlang CLI checks                                                                                                                                                                      | –                                                                                                                                              | JSON per locale. XLIFF and others through plugins                                                                                             |
| (e) next-international | "type-safe plurals". ICU not stated                                                                                                                                        | Yes                                                                                                                                                       | –                                                                                                                                                                                      | –                                                                                                                                              | –                                                                                                                                             |
| (f) i18next            | Its own suffix keys `_zero`…`_other` by `Intl.PluralRules` ([plurals](https://www.i18next.com/translation-function/plurals)). ICU through `i18next-icu` 2.6.1              | Yes                                                                                                                                                       | Third-party tools                                                                                                                                                                      | Third-party tools                                                                                                                              | i18next JSON, widely supported (for example [Weblate](https://docs.weblate.org/en/latest/formats.html))                                       |
| (g) FormatJS           | Yes. It is the reference ICU implementation that (b) builds on (`use-intl` depends on `intl-messageformat`, per npm)                                                       | Through its tooling                                                                                                                                       | `formatjs verify --missing-keys --extra-keys --structural-equality` ([CLI](https://formatjs.github.io/docs/tooling/cli/))                                                              | `formatjs extract`                                                                                                                             | Formatters for Crowdin, Lokalise, Smartling and Transifex (same page)                                                                         |
| (h) gt-next / Intlayer | gt-next is built around its own AI translation service. Intlayer uses `.content` files, with JSON/PO sync plugins and an optional paid CMS                                 | Yes                                                                                                                                                       | –                                                                                                                                                                                      | –                                                                                                                                              | –                                                                                                                                             |

### 2.3 Project health (npm registry, 21 October 2026)

| Package                                                                    | Latest  | Released    | Stable releases, last 12 months | Licence      | Maintainers on npm  |
| -------------------------------------------------------------------------- | ------- | ----------- | ------------------------------- | ------------ | ------------------- |
| [next-intl](https://www.npmjs.com/package/next-intl)                       | 4.14.9  | 2 Oct 2026  | 45                              | MIT          | 1 (Jan Amann)       |
| [@lingui/core](https://www.npmjs.com/package/@lingui/core)                 | 6.10.0  | 16 Oct 2026 | 24                              | MIT          | 2 (Crowdin staff)   |
| [@inlang/paraglide-js](https://www.npmjs.com/package/@inlang/paraglide-js) | 2.29.1  | 19 Oct 2026 | 47                              | MIT          | inlang/opral        |
| [next-international](https://www.npmjs.com/package/next-international)     | 1.3.1   | 31 Oct 2024 | **0**                           | MIT          | 1                   |
| [i18next](https://www.npmjs.com/package/i18next)                           | 26.5.4  | 21 Oct 2026 | 74                              | MIT          | 2 (locize)          |
| [react-intl](https://www.npmjs.com/package/react-intl)                     | 12.1.5  | 19 Oct 2026 | 58                              | BSD-3-Clause | 3                   |
| [gt-next](https://www.npmjs.com/package/gt-next)                           | 11.4.13 | 20 Oct 2026 | 166                             | MIT          | General Translation |
| [next-intlayer](https://www.npmjs.com/package/next-intlayer)               | 9.7.0   | 7 Oct 2026  | 171                             | Apache-2.0   | 1                   |

**Ruled out early.** next-international has had no release in two years.
Paraglide's Next.js guide needs webpack, but Next 16 builds with Turbopack.
gt-next ties translation to a hosted AI service with API keys, outside the
owner's control of every string. Intlayer is one maintainer, ships a release
every two days, and its docs don't cover Cache Components. That leaves the
guide pattern, next-intl, Lingui, i18next and FormatJS.

**Cache Components caveats, with dates.** In January 2026, next-intl's
maintainer said it is "currently just unfortunately not really reliable with
`'use cache'`", and that "the real fix here is for Next.js to add support for
`'use cache'` with `rootParams`" ([issue #2229](https://github.com/amannn/next-intl/issues/2229)).
Next.js 16.3 shipped exactly that in August 2026. next-intl 4.14.5
(14 September) "avoids reading the pathname in `useRouter` and `Link` to work
better with Cache Components" ([releases](https://github.com/amannn/next-intl/releases)).
No next-intl page documents `"use cache"` together with `getTranslations`.
**Not verified**: settle it with a build test, as section 8 says.

---

## 3. How large apps structure it

- **Catalogs per feature (namespace).** i18next's docs give the reasons:
  related strings "belong together" (`common`, `validation`, `glossary`);
  "Not every translation needs to be loaded on the first page"; and "You start
  losing the overview having more than 300 segments in a file"
  ([namespaces](https://www.i18next.com/principles/namespaces)). next-intl
  messages can be split "into multiple files and merge[d] … at runtime"
  ([configuration](https://next-intl.dev/docs/usage/configuration)). For
  Coachlore, that means one namespace per screen area (`shell`, `dex`,
  `league`, `states`, `errors`), which is the shape `en.json` already has.
- **Lazy loading per route.** With Server Components, catalogs never reach
  the browser. The guide says "we do not need to worry about the size of the
  translation files affecting our client-side JavaScript bundle size". So
  lazy loading only matters for Client Components. Send each one only the
  namespaces it renders, or better, the translated strings as props, which is
  next-intl's preferred "Option 1" ([server and client](https://next-intl.dev/docs/environments/server-client-components)).
- **Fallback chains.** By default, next-intl prints an error and renders
  `namespace.key` for a missing message. `onError` and `getMessageFallback`
  change that, and request config can merge another locale's messages
  ([configuration](https://next-intl.dev/docs/usage/configuration)). Lingui
  has `fallbackLocales` ([CLI](https://lingui.dev/ref/cli)). The production
  pattern is: CI blocks an incomplete catalog for a released language, and
  the source language is merged in as a last resort for anything that slips
  through.
- **Pseudo-localization.** It shows "how the UI will look after translation"
  and finds hard-coded and concatenated strings. Lingui 6.7 added
  right-to-left pseudolocales ([pseudolocalization](https://lingui.dev/guides/pseudolocalization)).
  Size the expansion from W3C's figures: strings up to 10 characters grow
  200–300%, and strings over 70 characters grow about 130%
  ([text size](https://www.w3.org/International/articles/article-text-size)).
- **Context for translators.** PO files carry comments, origins and context
  ([Lingui formats](https://lingui.dev/ref/catalog-formats)). next-intl
  recommends PO when extracting "because they can store context such as file
  references and descriptions" ([extraction](https://next-intl.dev/docs/usage/extraction)).
  With JSON, context lives in the translation platform, or in key names that
  say where a string appears.
- **CI checks.** Every released language has the source's keys and nothing
  extra. Every message parses as ICU. Each translation keeps the source's
  arguments and structure (FormatJS's `--structural-equality`). Each plural
  has the target language's CLDR categories. The translation platforms check
  the same things on their side: Crowdin's always-on ICU check catches a
  translation that is "missing the other plural form, or uses a different
  structure than the source string" ([Crowdin QA](https://support.crowdin.com/project-settings/qa-checks/)),
  and Weblate has an `icu-message-format` check ([checks](https://docs.weblate.org/en/latest/user/checks.html)).
- **Ownership.** The source catalog belongs to the developers, and changes go
  through review. The target catalogs belong to the translation platform and
  come back as pull requests. The term list (the glossary) belongs to the
  owner.

---

## 4. Locale routing and negotiation

| Topic                             | Source says                                                                                                                                                                                                                                                                                                                                                                                                    | For Coachlore                                                                                                                                                                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Subpath or domain                 | Google: subdirectories are "Low maintenance (same host)". URL parameters are "Not recommended" ([multi-regional](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites))                                                                                                                                                                                             | Subpath (`/en`, `/hi`). There is no domain anyway (ADR 0006)                                                                                                                                                                                                    |
| Different URL per language        | Google recommends "using different URLs for each language version of a page rather than using cookies or browser settings" (same page)                                                                                                                                                                                                                                                                         | Already ADR 0007                                                                                                                                                                                                                                                |
| Auto-redirect                     | "Avoid automatically redirecting users from one language version of a site to a different language version". Googlebot sends requests "without setting `Accept-Language`" and "usually originates from the USA" (same page; [locale-adaptive pages](https://developers.google.com/search/docs/specialty/international/locale-adaptive-pages))                                                                  | Redirect only paths **without** a language. Never redirect `/hi/…` to `/en/…`. Googlebot, with no header and no cookie, gets `en`, which is fine                                                                                                                |
| Matching `Accept-Language`        | Next's guide uses `@formatjs/intl-localematcher` with `negotiator`. next-intl uses its "best fit" algorithm, which "gives better results than the conservative RFC 4647 'lookup'", for example `en-GB` to `en-US` ([middleware](https://next-intl.dev/docs/routing/middleware)). W3C: keep tags "as short as possible" ([language tags](https://www.w3.org/International/questions/qa-choosing-language-tags)) | Today's `pickLocale` drops the region, which is right for `en`/`hi`. It would be wrong for `pt-BR`/`pt-PT` or `zh-Hant`/`zh-Hans`. A matcher library handles those                                                                                              |
| The cookie for an explicit choice | next-intl: cookie checked after the path prefix and before `accept-language`. Default `NEXT_LOCALE`, `sameSite: lax`, a session cookie unless `maxAge` is set ([configuration](https://next-intl.dev/docs/routing/configuration))                                                                                                                                                                              | The plan's `lang` cookie, one year, `SameSite=Lax`. Both name and `maxAge` can be configured. Whether next-intl can set `httpOnly` is **not verified**                                                                                                          |
| Redirect status                   | Next uses 307 for temporary redirects and 308 for permanent ones ([redirect](https://nextjs.org/docs/app/api-reference/functions/redirect)). A 307 transfers no SEO value ([MDN 307](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/307))                                                                                                                                                  | 307: the target depends on the visitor, so it must never be permanent. If any shared cache could store it, add `Vary: Accept-Language, Cookie`, which sets the cache key ([MDN Vary](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Vary)) |
| hreflang and x-default            | "Each language version must list itself as well as all other language versions", or the tags are ignored. x-default "was designed for language selector pages", and Google suggests it for "auto-redirecting home pages" ([localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions))                                                                          | `metadata.alternates.languages` with `en`, `hi` and `x-default`. Pointing x-default at `/en` (the plan) and at the bare, redirecting path are both allowed. Keep one source: next-intl also sends hreflang `Link` headers unless `alternateLinks: false`        |
| Canonical                         | Localized pages "are only considered duplicates if the main content of the page remains untranslated" (same page)                                                                                                                                                                                                                                                                                              | Each language's canonical is itself, never `/en`                                                                                                                                                                                                                |
| Sitemap                           | Next's sitemap takes `alternates.languages` ([sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)). Google's sitemap entries list every version, "including itself"                                                                                                                                                                                                          | As in the plan                                                                                                                                                                                                                                                  |

---

## 5. Right to left, end to end

**Document direction.** W3C: "If the overall document direction is
right-to-left, add `dir="rtl"` to the `html` tag", and "Do _not_ use CSS to
apply base direction" ([W3C](https://www.w3.org/International/questions/qa-html-dir)).
The direction can come from data: `new Intl.Locale("ar").getTextInfo()`
returns `{ direction: "rtl" }`, Baseline 2026, "Newly available"
([MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/getTextInfo)).
Use it to check the `dir()` table in a test, not at runtime, because older
browsers lack it.

**Logical properties.** Logical properties "define direction-relative
equivalents to their corresponding physical properties"
([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Logical_properties_and_values)).
In Tailwind 4.3: `ms-*`/`me-*` (`margin-inline-start`/`end`), `mbs-*`/`mbe-*`
([margin](https://tailwindcss.com/docs/margin)), `text-start`/`text-end`
([text-align](https://tailwindcss.com/docs/text-align)), and for positions
**`inset-s-*`/`inset-e-*`** ([top/right/bottom/left](https://tailwindcss.com/docs/top-right-bottom-left)).
One finding for the plan: the installed Tailwind 4.3.3 still accepts
`start-*`/`end-*`, but its class canonicalization rewrites them to
`inset-s-*`/`inset-e-*` (observed in `tailwindcss/dist/lib.js`), and the docs
list only the new names. The plan's "`start`, `end`" should read
`inset-s`, `inset-e`. The `rtl:`/`ltr:` variants match
`:dir(rtl), [dir="rtl"], [dir="rtl"] *` ([variants](https://tailwindcss.com/docs/hover-focus-and-other-states)).
Use them only for what logical properties can't express, such as
`rtl:-scale-x-100` on an icon.

**Icons: which mirror.**

| Mirror                                                                                                                                                                                                  | Don't mirror                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Back, forward, next and previous; "Flip controls that help people navigate or access items in a fixed order" ([Apple HIG](https://developer.apple.com/design/human-interface-guidelines/right-to-left)) | Checkmarks and other "universal signs and marks", and logos (Apple)                            |
| "An icon that shows forward movement" ([Material](https://m1.material.io/usability/bidirectionality.html))                                                                                              | Clocks and circular refresh or history: "Clocks still turn clockwise" (Material)               |
| Progress and sliders, with their start and end glyphs swapped (Apple)                                                                                                                                   | Media playback and its progress bar, which "refer to the direction of tape" (Material)         |
| Icons of text or reading direction (Apple)                                                                                                                                                              | Real-world objects (Apple), and icons held in the right hand, such as search (Material)        |
| –                                                                                                                                                                                                       | Photos and artwork (Apple), so **Pokémon sprites are never flipped**                           |
| –                                                                                                                                                                                                       | The digits inside a number: "Don't reverse the order of numerals in a specific number" (Apple) |

The current Material 3 page ([bidirectionality](https://m3.material.io/foundations/layout/understanding-layout/bidirectionality-rtl))
renders only with JavaScript and couldn't be read: **not verified**. The
Material quotes above come from the readable Material 1 page.

**Mixed-direction text.** Coachlore will show English Pokémon names inside
Arabic sentences, plus numbers like `#0479`. W3C: "tightly wrap every
opposite-direction phrase in markup that sets its base direction". For text
inserted at run time, add `dir=auto`, or "If there is no markup, wrap the
location with a bdi element". Prefer markup to Unicode control characters
([inline bidi markup](https://www.w3.org/International/articles/inline-bidi-markup/)).
MDN: `<bdi>` "is shorter than `<span dir="auto">` and conveys the author
intent better". `unicode-bidi: isolate` in CSS should not be used instead,
"because it is not semantic and browsers are allowed to ignore CSS styling"
([MDN bdi](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/bdi)).

For Coachlore:

- The plan's `<Lang lang="en">` should also isolate direction: render
  `<bdi lang="en" dir="ltr">`, or `<span lang="en" dir="ltr">`, which MDN
  calls "exactly equivalent". A name such as "Mr. Mime" or "Porygon-Z" next
  to Arabic text otherwise misplaces its punctuation.
- In ICU messages, wrap name arguments in a rich-text tag that renders
  `<bdi>`.
- In plain-text contexts (`<title>`, `aria-label`), use FSI/PDI characters,
  the case W3C keeps them for.

**Numbers, digits and dates.** Always use `Intl`, with the numbering system
chosen on purpose. Observed: `ar` formats 1234567 as `1,234,567` (Latin
digits), but `ar-EG` gives `١٬٢٣٤٬٥٦٧`. W3C's Arabic layout requirements
record Arabic-Indic digits in "Egypt, Saudi Arabia, Iraq" and European digits
in "Algeria or Morocco" ([alreq](https://www.w3.org/TR/alreq/)). So when
Arabic arrives, choosing `ar` alone is a decision about digits. Make it
explicit with `-u-nu-arab` or `-u-nu-latn`. Numbers keep "the lowest
significant digits to the right" even in right-to-left text (alreq).

**Fonts per script.** next/font preloads a font on every route of the layout
that uses it; in the root layout, "it is preloaded on all routes"
([font](https://nextjs.org/docs/app/api-reference/components/font)). The
plan's `preload: false` for the second script is right. Noto Sans Devanagari
and Noto Sans Arabic are OFL variable fonts (`wght` 100–900, `wdth`
62.5–100). Noto Nastaliq Urdu is OFL, `wght` 400–700 (Google Fonts metadata:
[Devanagari](https://github.com/google/fonts/blob/main/ofl/notosansdevanagari/METADATA.pb),
[Arabic](https://github.com/google/fonts/blob/main/ofl/notosansarabic/METADATA.pb),
[Nastaliq](https://github.com/google/fonts/blob/main/ofl/notonastaliqurdu/METADATA.pb)).
"Nasta'līq remains the preferred style for … Urdu", and "Arabic ascenders and
descenders extend much further than those of the Latin script" (alreq). Plan
for more line height, and for Urdu as its own font choice, not "Arabic again".
Apple suggests increasing right-to-left font size "by about 2 points" beside
Latin text.

**Testing right to left.** Keep the plan's `rtl.spec.ts`, which forces
`dir="rtl"` and checks no overflow, the sidebar side and mirrored icons.
Pseudo-RTL pseudolocales (Lingui's `rightToLeft: true`) catch text that
wasn't reversed. Playwright's `locale` option emulates "the browser Locale"
([emulation](https://playwright.dev/docs/emulation)) for negotiation tests.
For the first real right-to-left language, add screenshot comparisons of each
fixture state in both directions.

---

## 6. Hindi specifics

- **Plurals (CLDR).** Hindi cardinals are `one` (`i = 0 or n = 1`) and
  `other`, so **0 takes `one`** ("0 घंटा"). Ordinals have one, two, few, many
  and other ([CLDR plural rules](https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html)).
  A hand-written `count === 1` check is wrong for Hindi; `Intl.PluralRules`
  and ICU are right (observed: `hi` gives 0 → `one`). For comparison: Arabic
  has zero, one, two, few (`n % 100 = 3..10`), many (`11..99`) and other.
  Urdu has only one (`i = 1 and v = 0`) and other (same chart).
- **Grouping.** Observed: `en-IN` and `hi-IN` both format 123456789.5 as
  `12,34,56,789.5`. Plain `hi` also uses Indian grouping (`12,34,567`). Use
  `Intl` with the page's locale, never a hand-built separator.
- **Digits.** Default `hi` formats in Latin digits (observed). Devanagari
  digits need `hi-u-nu-deva` (`१२,३४,५६७`). W3C: "Generally Latin Numerals
  are acceptable in Devanagari text" ([deva-gap #91](https://www.w3.org/TR/deva-gap/)).
  Article 343(1) of the Constitution of India sets "the international form of
  Indian numerals" for the Union's official purposes
  ([Part XVII](https://www.mea.gov.in/Images/pdf1/Part17.pdf)). Keep Latin
  digits. Stats, Dex numbers and points then read the same in both languages.
- **Line height and clipping.** Matras "sometimes join above the shirorekha",
  and underlines must clear them (deva-gap #90). W3C records no specific
  line-height gap. The risk is engineering, not spec: `truncate`,
  `line-clamp-*` and fixed-height boxes with `overflow: hidden` clip marks
  above and below the line. Keep the plan's `leading-relaxed` for Hindi body
  text. Give Hindi headings and badges at least `leading-normal`. Add a
  screenshot of each fixture in Hindi to the visual review.
- **Font.** Noto Sans Devanagari: variable, OFL, with `devanagari`, `latin`
  and `latin-ext` subsets. Put it first in the stack only on `hi` pages, so
  Latin text keeps Inter, as the plan says.

---

## 7. Scaling to many languages

- **Keys in sync.** One source catalog (`en`) generates the type. CI fails
  when a released language has a missing key, an extra key, an ICU parse
  error, different arguments, or a plural without its CLDR categories. A
  language still in translation stays out of `locales` until it passes, so
  nothing ships half-done.
- **Plural and gender.** Use ICU `plural` and `select` inside the message,
  never sentence fragments joined in code. Translators can only reorder a
  whole sentence. Crowdin's "Copy Source" fills in "the number of plural
  categories right for the current target language" ([Crowdin QA](https://support.crowdin.com/project-settings/qa-checks/)).
- **Translation memory and glossary.** These belong to the translation
  platform, not the repository. Crowdin, Lokalise (with "Detect ICU plurals",
  [upload docs](https://docs.lokalise.com/en/articles/1400492-uploading-files)),
  Weblate (JSON, nested JSON, i18next JSON, PO, XLIFF 1.2 and 2.0, ARB and
  Format.JS JSON, [formats](https://docs.weblate.org/en/latest/formats.html))
  and Tolgee ("All Tolgee SDKs are following ICU", [ICU](https://docs.tolgee.io/platform/translation_process/icu_message_format))
  all take ICU JSON. The `terms` list in `hi.json` becomes the platform's
  glossary. ICU messages can't reference other messages, so a `terms`
  namespace can't feed other strings at runtime anyway.
- **Each language's own decisions.** Digits (`-u-nu-`), font, line height,
  direction, and the endonym in the language menu (`Intl.DisplayNames`) are
  decided per language in data, not in components.

---

## 8. Recommendation

**Adopt next-intl (4.14.x), in its `next/root-params` setup, with ICU messages
in JSON. Don't keep the no-library pattern.**

Judged by the owner's criteria:

1. **Production-ready, documented best practice.** next-intl is a Next.js
   library first. Its current setup is the Next 16.3 root-params pattern,
   which keeps pages static without `setRequestLocale`. It is the first
   library in Next's own guide's resource list. It has been released 45
   times in 12 months, with fixes aimed at Cache Components (4.14.5). The
   guide pattern is also Next's own documented approach, but the guide itself
   says it covers routing, and that localization "is not something specific
   to Next.js". It stops before plurals, formatting and translator workflow.
2. **A language is a checklist.** Negotiation with best-fit matching, the
   cookie, the prefix redirect and `generateStaticParams` all come from one
   `routing.locales` list. Plurals for any CLDR language come from ICU with
   no code change. Today's design would need each Arabic plural written as
   code or a home-made JSON convention.
3. **Translator workflow.** ICU JSON is the format Crowdin, Lokalise,
   Weblate and Tolgee all parse and check. The no-library `{name}` plus code
   plurals is invisible to them. Keys **and** ICU arguments are typed.
   - **Bundle size:** Server Components send no library code. In Client
     Components, `precompile` drops "~9KB" of compressed JavaScript and leaves
     about 4 KB for one client-side translation (the maintainer's figures,
     not measured here; experimental, so off at first). Keep the plan's
     rule: Client Components receive strings as props, and
     `NextIntlClientProvider` gets only the `errors` and palette namespaces.
   - **Static rendering:** unchanged. The root layout keeps
     `generateStaticParams`, there is no `dynamicParams`, and nothing reads
     `headers()`.

**Honest trade-offs.**

- One maintainer. Mitigation: next-intl's API is small, and its message
  format is standard ICU (FormatJS's `intl-messageformat` underneath), so the
  catalogs would move unchanged to react-intl if it were ever abandoned.
- `"use cache"` with `getTranslations` isn't documented. Prove it in task 5
  with a cached component that translates, built with Cache Components.
  Until then, keep `next/link` with `localeHref` rather than next-intl's
  `Link` (issue #2229).
- Extraction (`useExtracted`), `precompile` and `@eloqnt/cli` are
  experimental or pre-1.0. Use none of them at first. Keep CI checks in our
  own Vitest test, using `@formatjs/icu-messageformat-parser`. It is already
  in the tree through `icu-minify`, but must be declared as a dev dependency
  to be imported.
- Lingui has the best translator tooling: PO with context, stable extraction,
  `lingui check`, RTL pseudolocales, and Crowdin's backing. But it needs a
  Babel or SWC macro plugin under Next's `experimental.swcPlugins`, and
  `setI18n` in every layout and page. That coupling to Next's SWC version is
  a recurring upgrade risk, and it runs against criterion 1 for this stack.
  Choose it instead only if PO and extraction matter more than that risk.
- FormatJS (react-intl) is the strongest neutral alternative: the reference
  ICU implementation, and `formatjs verify` is the best CI check. But you
  keep the guide's routing code yourself, and its Next.js guide is silent
  on static rendering.

**Timing.** Task 5 is in progress: `locales.ts` and the dictionaries are
staged, not committed. Switching now costs a rename of the dictionaries and
changes to a few files. Switching after every screen uses `dict.x.y` costs a
pass over every screen.

**Adding a language with next-intl (the checklist).**

1. Add the tag to `routing.locales`. Routing, negotiation,
   `generateStaticParams`, hreflang and the sitemap follow from it.
2. Add `dir` to the direction table. A test checks it against
   `Intl.Locale#getTextInfo()`.
3. Choose and record the digits (`-u-nu-…`) and any calendar, in the
   language's format settings.
4. Add the font with its next/font subset, `preload: false`, applied only to
   that language, and set its line height.
5. Create the language in the translation platform. The source's ICU JSON
   flows in, with the glossary and translation memory.
6. Bring the catalog back as a pull request. CI checks keys, ICU parsing,
   arguments and the CLDR plural categories for that language.
7. Add the endonym in the language menu, from `Intl.DisplayNames`.
8. Run every end-to-end spec in the new language. For right to left, also
   run `rtl.spec.ts` in that language, the icon review and bidi checks on
   Pokémon names.
9. Add the language to the Discord bot and AI language lists (ADR 0007).

---

## 9. What changes in ADR 0007 and spec 001's plan

If the owner adopts next-intl, record it as a **new ADR** ("Translation
library"). It supersedes ADR 0007's "Interface text" row and its "A
translation library" alternative. Add a status line to 0007 pointing to it.
In the same commit, add the AGENTS.md "Stack" line, and add next-intl 4.14.9
to the workspace catalog (released 2 October 2026, 19 days old, which passes
the 14-day minimum age).

### ADR 0007

- _Interface text:_ ICU messages in `messages/en.json` and `hi.json`, loaded
  by next-intl's `i18n/request.ts` from `rootParams.lang()`, and read with
  `getTranslations`/`useTranslations`. This replaces "dictionaries … one
  `t()`".
- _Choosing the language:_ next-intl's proxy (`createMiddleware`): prefix,
  then the `lang` cookie (`localeCookie: { name: "lang", maxAge: 31536000 }`),
  then best-fit `Accept-Language`, then `en`.
- _Search engines:_ `alternateLinks: false`. hreflang comes only from
  metadata and the sitemap.
- _Right to left:_ add bidi isolation (`<bdi>`/`dir="ltr"` on other-language
  text) and the icon table from section 5. Change `start`/`end` to
  `inset-s`/`inset-e`.
- _Dates and numbers:_ Latin digits in every language unless a language's
  row says otherwise. `-u-nu-` is decided per language.
- _Alternatives:_ the guide pattern without a library (rejected: no ICU, no
  translation-platform plurals), Lingui (macro plugin), FormatJS (routing
  left to us).
- _Consequences:_ the "adding a language" checklist above replaces "a
  dictionary, a font … and its entry".

### Spec 001's plan

- _Packages and files:_ `lib/i18n/get-dictionary.ts` becomes
  `i18n/request.ts` (`getRequestConfig`, `rootParams.lang()`, `notFound()`
  for an unknown one). Add `i18n/routing.ts` (`defineRouting`: `locales`,
  `defaultLocale`, `localePrefix: "always"`, `localeCookie`,
  `alternateLinks: false`). `lib/i18n/dictionaries/*.json` becomes
  `messages/*.json` in ICU syntax, and `errors.<lang>.json` folds in as the
  `errors` namespace. `locales.ts` keeps `dir()`, `localeHref` and
  `switchLocale`, takes `locales` from `routing`, and loses `pickLocale`.
  `next.config.ts` is wrapped in `createNextIntlPlugin()` with
  `createMessagesDeclaration`, and `tsconfig` gets `allowArbitraryExtensions`.
  A `global.d.ts` declares `AppConfig` (`Locale`, `Messages`). `fonts.ts` is
  unchanged.
- _Languages:_ the redirect is next-intl's middleware, composed first in
  `proxy.ts`, before spec 006's CSP. Drop "one `t(template, values)`
  helper; plural forms use `Intl.PluralRules`" in favour of ICU `plural`.
  `<Lang>` renders isolation (`dir`/`<bdi>`). The `terms` list moves to the
  translation platform's glossary, with the owner's review unchanged. Error
  pages use `useTranslations("errors")` under a provider that carries only
  that namespace. `global-error` stays English.
- _Shell, direction:_ `inset-s`/`inset-e` instead of `start`/`end`, in the
  text and in `check-logical-css`'s allowed list.
- _Tests:_ `dictionaries.test.ts` becomes `messages.test.ts`: same keys, no
  extra keys, every message parses as ICU, the same arguments and
  plural/select structure as `en`, and each plural has
  `Intl.PluralRules(locale).resolvedOptions().pluralCategories` plus `other`.
  `pickLocale.test.ts` goes. Its cases move to `languages.spec.ts`, which
  also checks the `lang` cookie's attributes and that `/hi/…` is never
  redirected. Add a build test: a `"use cache"` component calling
  `getTranslations` builds with Cache Components and renders both languages.
- _Decisions table:_ the "Translation library" row becomes next-intl, citing
  the new ADR.
- _Checked against the installed docs:_ the "Reading the language" row
  becomes next-intl's `request.ts` with root params. "The `lang` cookie" is
  set by next-intl's middleware, configured. "Error pages" uses the `errors`
  namespace.
- _Task 5:_ reworded to match.

Only the `httpOnly` cookie attribute and `"use cache"` with
`getTranslations` are unverified. Both are settled by the tests above, not by
more review.

---

## 10. Sources

Linked inline. All were opened on 21 October 2026, except as marked:

- Next.js 16.4.1 bundled docs: [internationalization](https://nextjs.org/docs/app/guides/internationalization),
  [next/root-params](https://nextjs.org/docs/app/api-reference/functions/next-root-params),
  [font](https://nextjs.org/docs/app/api-reference/components/font),
  [redirect](https://nextjs.org/docs/app/api-reference/functions/redirect),
  [sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap).
- next-intl: [setup](https://next-intl.dev/docs/routing/setup),
  [getting started](https://next-intl.dev/docs/getting-started/app-router/with-i18n-routing),
  [root params post](https://next-intl.dev/blog/nextjs-root-params),
  [middleware](https://next-intl.dev/docs/routing/middleware),
  [configuration](https://next-intl.dev/docs/routing/configuration),
  [TypeScript](https://next-intl.dev/docs/workflows/typescript),
  [extraction](https://next-intl.dev/docs/usage/extraction),
  [precompilation](https://next-intl.dev/blog/precompilation),
  [releases](https://github.com/amannn/next-intl/releases),
  [issue #2229](https://github.com/amannn/next-intl/issues/2229).
- Lingui: [RSC](https://lingui.dev/tutorials/react-rsc),
  [CLI](https://lingui.dev/ref/cli),
  [formats](https://lingui.dev/ref/catalog-formats),
  [releases](https://github.com/lingui/js-lingui/releases).
- i18next: [plurals](https://www.i18next.com/translation-function/plurals),
  [namespaces](https://www.i18next.com/principles/namespaces),
  [next-i18next](https://github.com/i18next/next-i18next).
- FormatJS: [Next.js guide](https://formatjs.github.io/docs/guides/nextjs-app-router),
  [CLI](https://formatjs.github.io/docs/tooling/cli/).
- Standards and platforms: [CLDR plural rules](https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html),
  W3C ([dir](https://www.w3.org/International/questions/qa-html-dir),
  [inline bidi](https://www.w3.org/International/articles/inline-bidi-markup/),
  [deva-gap](https://www.w3.org/TR/deva-gap/), [alreq](https://www.w3.org/TR/alreq/)),
  Google Search Central (linked in section 4), Apple HIG and Material
  (section 5; Material 3 not readable).
