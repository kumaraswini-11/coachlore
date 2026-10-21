# 7. Languages and right-to-left

- Status: Accepted (the owner, 2026-10-21: English and Hindi in v1, built
  for more, including right-to-left languages)
- Date: 2026-10-21

## Context

The owner decided that v1 speaks English and Hindi, and that later
languages may include ones written right to left, such as Arabic. shadcn is
already set up for that (`"rtl": true` in both `components.json` files).
Building languages in from the first screen costs little; adding them to
finished screens means touching every one.

Two facts shape it: PokéAPI has no Hindi names (its languages, checked on
2026-10-21, are `ja-hrkt`, `ja-roma`, `ko`, `zh-hant`, `fr`, `de`, `es`,
`it`, `en`, `cs`, `ja`, `zh-hans`, `pt-br` and `es-419`), and Inter, the
interface font, has no Devanagari letters.

## Decision

| Item                  | Before (checked 2026-10-21) | Official docs (quoted)                                                                                                                                                                                                                                                                                                                                                                                         | Decision                                                                                                                                                                                                                                                                                                         |
| --------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Routing               | one language, no prefix     | Next.js: "ensure all special files inside `app/` are nested under `app/[lang]`. This enables the Next.js router to dynamically handle different locales in the route" ([Internationalization](https://nextjs.org/docs/app/guides/internationalization), bundled with the installed version)                                                                                                                    | Every route under `/[lang]`: `/en/…` and `/hi/…`. Specs write routes without the prefix                                                                                                                                                                                                                          |
| Choosing the language | –                           | "It's recommended to use the user's language preferences in the browser to select which locale to use" (same guide)                                                                                                                                                                                                                                                                                            | The proxy redirects a request with no language to the browser's preferred one (English if neither matches); a choice made in the language menu is remembered in a cookie and, when signed in, on the account                                                                                                     |
| Interface text        | written in each component   | The guide's "dictionaries", loaded by a `getDictionary` function that starts with `import 'server-only'`                                                                                                                                                                                                                                                                                                       | One dictionary per language (`en.json`, `hi.json`) in the web app; Server Components read it, and pass Client Components only the strings they show. No text is written into components                                                                                                                          |
| Pokémon data          | English names               | –                                                                                                                                                                                                                                                                                                                                                                                                              | Pokémon, form, move and ability names show in English in every language (PokéAPI has no Hindi); names in PokéAPI's other languages are already in the dataset (spec 002). Search matches the English name in every language                                                                                      |
| Static pages          | one per Dex route           | "To generate static routes for a given set of locales, we can use `generateStaticParams`" (same guide)                                                                                                                                                                                                                                                                                                         | Dex pages are generated for each language, so the Dex stays static and offline in both                                                                                                                                                                                                                           |
| Search engines        | –                           | `alternates.languages` renders `<link rel="alternate" hreflang="…">` ([generateMetadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata))                                                                                                                                                                                                                                               | Each page lists its other languages                                                                                                                                                                                                                                                                              |
| Right to left         | –                           | W3C: "Add dir="rtl" to the html tag any time the overall document direction is right-to-left (RTL)" ([W3C](https://www.w3.org/International/questions/qa-html-dir)); shadcn's RTL support "transforms physical positioning classes to logical equivalents" ([shadcn/ui](https://ui.shadcn.com/docs/rtl)); Tailwind: `ms-<number>` sets `margin-inline-start` ([Tailwind](https://tailwindcss.com/docs/margin)) | `<html lang dir>` from the language. Styles use logical properties (`ms`, `me`, `ps`, `pe`, `start`, `end`, `text-start`), never `left` or `right`, and arrows that mean "back" or "next" flip. A lint check finds physical ones. v1 has no right-to-left language, but every screen is checked with `dir="rtl"` |
| Fonts                 | Inter, Geist Mono           | next/font: "CSS and font files are downloaded at build time and self-hosted … **No requests are sent to Google by the browser.**" ([Font](https://nextjs.org/docs/app/api-reference/components/font))                                                                                                                                                                                                          | Noto Sans Devanagari for Hindi, loaded only on Hindi pages; a right-to-left language adds its own Noto font                                                                                                                                                                                                      |
| Dates and numbers     | –                           | –                                                                                                                                                                                                                                                                                                                                                                                                              | Always formatted with `Intl` in the page's language; never built by hand                                                                                                                                                                                                                                         |
| Discord and AI        | English                     | –                                                                                                                                                                                                                                                                                                                                                                                                              | A league has a language (its admins choose); the bot posts in it, and recaps and the digest are written in it. The assistant answers in the asker's language; the grounding check still checks the English names                                                                                                 |

## Alternatives considered

- **A translation library** (such as next-intl): plurals and formatting
  helpers, but another dependency, where Next.js's own pattern and `Intl`
  cover two languages. Revisited when plural rules or a third language make
  the dictionaries hard to keep.
- **English only in v1, languages later:** every finished screen would be
  touched again, and styles written with `left` and `right` would need
  rewriting for right-to-left languages.
- **The language in a cookie only, no address prefix:** one address would
  serve two languages, which search engines and shared links can't tell
  apart.

## Consequences

- Every page exists in both languages, and every string has a key in both
  dictionaries; a test fails when a key is missing in one.
- Specs keep writing routes without the language prefix; the convention is
  in the [specs README](../specs/README.md).
- Adding a language means a dictionary, a font if it needs one, and its
  entry in the language list; a right-to-left one also needs a review of
  every screen with `dir="rtl"`, which is checked from v1.
- The Dex's build makes twice the pages; the offline Dex saves the pages of
  the language in use.

## Sources

Linked inline above; checked on 2026-10-21.
