# 001: Interface, the plan

## Builds on

- Spec 000 (deploys and previews: the owner reviews fixture screens on a
  phone through a preview as well as over the local network).
- ADR 0001 (where UI code goes), ADR 0003 (rendering), ADR 0006 (Playwright
  with axe from this spec), ADR 0007 (languages and right-to-left).
- Next.js's bundled [internationalization guide](https://nextjs.org/docs/app/guides/internationalization)
  (`node_modules/next/dist/docs/01-app/02-guides/internationalization.md`):
  `app/[lang]`, a Proxy that redirects, and server-only dictionaries.
- The interface standards plan: its rules for AGENTS.md are written as
  part of task 1 here, with the default for registry files (edited where
  the design needs it, as AGENTS.md says).

## Packages and files

| Path                                                                     | What                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui/src/styles/globals.css`                                     | The tokens: `success`, `warning` and their foregrounds in both themes; the 18 type pairs `--type-<name>`, `--type-<name>-foreground`; mapped in `@theme inline` to `bg-type-fire`, `text-type-fire-foreground` and so on; the motion durations      |
| `packages/ui/src/lib/type-colors.ts`                                     | The 18 types in order, with their names, for components that loop over them (the CSS stays the single source of the values)                                                                                                                         |
| `packages/ui/src/lib/contrast.test.ts`                                   | Reads `globals.css`, converts every token pair (hex and OKLCH) to sRGB and checks WCAG contrast: 4.5:1 for text pairs, 3:1 for the ring                                                                                                             |
| `packages/ui/src/components/shadcn-ui/`                                  | Added with the CLI: `sidebar`, `tabs`, `command`, `dialog`, `drawer`, `sheet`, `skeleton`, `alert`, `badge`, `card`, `item`, `kbd`, `separator`, `tooltip`, `avatar`, `scroll-area`, `spinner`, `breadcrumb`, `sonner`                              |
| `packages/ui/src/components/type-badge.tsx`                              | A type's name on its colour: the first shared composition (used by nearly every later screen)                                                                                                                                                       |
| `apps/web/components/shell/`                                             | `app-shell.tsx` (Server Component layout: header, `nav`, `main`, footer), `bottom-tabs.tsx`, `app-sidebar.tsx`, `skip-link.tsx`, `site-footer.tsx`                                                                                                  |
| `apps/web/components/search/`                                            | `search-palette.tsx` (client), `sources.ts` (the registry), `types.ts`                                                                                                                                                                              |
| `apps/web/app/[lang]/layout.tsx`                                         | The root layout, under the language: `<html lang dir>`, the fonts for the language, the shell; `generateStaticParams` returns `[{ lang: "en" }, { lang: "hi" }]`; `notFound()` for any other `lang`                                                 |
| `apps/web/app/[lang]/not-found.tsx`, `apps/web/app/global-not-found.tsx` | Not found inside a language, and for addresses that match no route at all (the root layout is now under a dynamic segment; see Decisions)                                                                                                           |
| `apps/web/proxy.ts`                                                      | The one Proxy (a file exports one function): first the language redirect, then, from spec 006, the nonce CSP for signed-in routes; it skips `/api`, `/_next`, files with an extension and the metadata routes                                       |
| `apps/web/lib/i18n/locales.ts`                                           | `locales = ["en", "hi"] as const`, `Locale`, `defaultLocale = "en"`, `dir(locale)` (`"ltr"` for both; a table, so a right-to-left language is one entry), `hasLocale()`, and `pickLocale(cookie, acceptLanguage)`                                   |
| `apps/web/lib/i18n/dictionaries/en.json`, `hi.json`                      | Every interface string, nested by screen (`shell.*`, `dex.*`, `states.*`, …); English is the source, its type is the dictionary's type                                                                                                              |
| `apps/web/lib/i18n/get-dictionary.ts`                                    | `import "server-only"`; `getDictionary(locale)` as the guide shows; Client Components receive only the strings they render, as props                                                                                                                |
| `apps/web/lib/i18n/format.ts`                                            | `formatNumber`, `formatDate`, `formatTime(date, { locale, zone, leagueZone })`: `Intl` only, cached formatters; every screen uses these                                                                                                             |
| `apps/web/lib/i18n/alternates.ts`                                        | `languageAlternates(path)` for `metadata.alternates.languages` and `canonical`                                                                                                                                                                      |
| `apps/web/lib/fonts.ts`                                                  | Adds Noto Sans Devanagari (`subsets: ["devanagari"]`) as `--font-sans-hi`, applied only when `lang` is `hi`                                                                                                                                         |
| `apps/web/components/shell/language-menu.tsx`                            | The "Language" group in the theme menu: links to the same path in the other language; sets the `lang` cookie                                                                                                                                        |
| `scripts/check-logical-css.ts`                                           | Fails on physical direction utilities (`ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`, `text-left`, `text-right`, `rounded-l`, `rounded-r`, `border-l`, `border-r`, and their `-x` forms are allowed) in `apps/web` and `packages/ui`; run by `lint` |
| `apps/web/components/shortcuts.tsx`                                      | Replaces `theme-hotkey.tsx`: the "Single-key shortcuts" setting, `d` and `/`                                                                                                                                                                        |
| `apps/web/app/[lang]/(site)/about/page.tsx`, `legal/page.tsx`            | Server Components, text only, from the dictionaries                                                                                                                                                                                                 |
| `apps/web/app/[lang]/offline/page.tsx`                                   | Static; the offline Dex (spec 003) serves it for pages it hasn't saved                                                                                                                                                                              |
| `apps/web/app/[lang]/(dev)/fixtures/[screen]/page.tsx`                   | Fixture screens: every state of every screen built so far, from `apps/web/fixtures/`; `notFound()` in production                                                                                                                                    |
| `apps/web/fixtures/`                                                     | Sample data, typed with the real types                                                                                                                                                                                                              |
| `apps/web/e2e/`, `apps/web/playwright.config.ts`                         | Playwright with `@axe-core/playwright`                                                                                                                                                                                                              |
| `.github/workflows/ci.yml`                                               | A Playwright job: build, start, run the tests in Chromium and WebKit                                                                                                                                                                                |

## Data model

None. Types only:

```ts
// apps/web/components/search/types.ts
type SearchResult = {
  id: string // unique across sources, e.g. "form:rotom-wash"
  kind: "pokemon" | "move" | "ability" | "type" | "league" | "ask"
  label: string
  detail?: string // e.g. "#0479 · Electric, Water"
  href: Route // a typed route
}

type SearchSource = {
  kind: SearchResult["kind"]
  heading: string // the group's heading in the palette
  search(query: string): SearchResult[] | Promise<SearchResult[]>
}
```

Every route, `href` included, carries the language (`/${lang}/dex/…`); a
helper `localeHref(lang, route)` builds them, so a typed route is checked
without the prefix and the prefix is added in one place.

`sources.ts` exports the list of sources, empty here; specs 003, 004, 007
and 012 each add one. The palette shows at most eight results per group
and searches as the person types, ignoring case and accents ("pokemon"
finds "Pokémon").

## The shell

- **Layout:** the root layout renders `AppShell`. Below 1024 px, the top
  bar and `BottomTabs`; from 1024 px, `AppSidebar` (shadcn's Sidebar, not
  collapsible in v1). The two are swapped by CSS breakpoints, not by
  JavaScript, so nothing shifts on load.
- **Navigation items** are one list, `nav-items.ts`, read by both: Dex,
  Team check, Leagues, Me (Ask joins with spec 012; Types and Moves are in
  the sidebar only). The current item gets `aria-current="page"`.
- **League navigation** is a slot the league layout (spec 007) fills.
- **Footer:** the not-affiliated notice and credits from one constant, with
  links to `/about` and `/legal`.
- **Skip link** to `#main`, the first focusable element.
- **Focus not obscured:** each sticky bar sets a CSS variable with its
  height (`--sticky-top`, `--sticky-bottom`, summed where bars stack), and
  `html` sets `scroll-padding-top: var(--sticky-top)` and
  `scroll-padding-bottom: var(--sticky-bottom)`. A page that hides the
  bottom tabs (the draft room, spec 008) sets its own `--sticky-bottom`.
- **Times:** one helper, `formatTime(date, { locale, leagueZone })` in
  `lib/i18n/format.ts`, built on `Intl.DateTimeFormat`, shows the viewer's
  time and, when the zones differ, the league's beside it; every screen
  uses it.
- **Direction:** the layout sets `dir` from `dir(locale)`; components use
  logical utilities (`ms`, `me`, `ps`, `pe`, `start`, `end`,
  `text-start`, `rounded-s`, `border-s`); back and next icons get
  `rtl:-scale-x-100`. shadcn's `"rtl": true` already makes the registry
  components logical.
- **League tabs:** Home, Draft, Rosters, Schedule, Trades, Stats, and
  Settings for admins; the slot below renders them.

## Languages

- **The redirect:** `proxy.ts` checks whether the path starts with a
  language. If not, `pickLocale` chooses one: the `lang` cookie if it's a
  language we have, else the best match in `Accept-Language` (`en` or
  `hi`, any region), else `en`; the response redirects (307) to
  `/${locale}${path}${search}`. The guide's matcher shape, extended to skip
  `/api`, files and metadata routes.
- **The language switch** is in three places: the display menu (its
  button's accessible name is "Display: theme and language"), the footer
  (the other language, written in that language) and `/me` (spec 006).
  Each links to the current path with the other language and sets the
  `lang` cookie (one year, `SameSite=Lax`, readable by the server only);
  signed-in people's choice is also saved on the account by spec 006.
- **The Hindi term list:** `hi.json` starts with `terms`, one Hindi
  wording for each glossary term the interface shows (coach, roster, pick,
  draft, KO, tier, points and the rest), and every other string uses
  those words, so the Hindi copy doesn't drift. The owner reviews it.
- **Other-language text:** `<Lang lang="en">` wraps text that isn't in the
  page's language (Pokémon names on Hindi pages); `<WrittenIn lang>`
  shows "Written in English" or "Written in Hindi" beside a write-up whose
  language differs from the page's. Spec 013 uses it for recaps and the
  digest.
- **Back and next** are Lucide chevron icons with `rtl:-scale-x-100`; no
  arrow character ("←", "‹", "→") is used as an icon, and
  `check-logical-css` also rejects those characters in JSX.
- **Literals:** ESLint's `react/jsx-no-literals` runs with
  `allowedStrings` for punctuation and symbols that aren't words (`·`,
  `–`, `—`, `×`, `/`, `:`, `(`, `)`, `%`, `#`) and digits, so it flags
  words only, without disables.
- **Dictionaries:** `en.json` is the source and its type; `hi.json` must
  have the same keys (a Vitest test compares them, and the build imports
  both, so a missing key is a type error too). Strings with values use
  `{name}` placeholders, filled by one `t(template, values)` helper; plural
  forms use `Intl.PluralRules`.
- **Metadata:** each page's `generateMetadata` reads its title and
  description from the dictionary, and sets `alternates.canonical` and
  `alternates.languages` (`en`, `hi`, and `x-default` to `en`).
- **Fonts:** `fontSans` (Inter) for both; for `hi`, the layout adds Noto
  Sans Devanagari's variable first in the `--font-sans` stack, so Latin
  text keeps Inter. next/font self-hosts both at build time.
- **Global error:** `global-error.tsx` can't know the language; it uses
  English with `lang="en"`.

## Single-key shortcuts

`components/shortcuts.tsx` replaces `components/theme-hotkey.tsx` (ADR
0003's era) with one setting for every single-key shortcut:

- Storage key `single-key-shortcuts` (`on` / `off`); a stored
  `theme-hotkey=off` from before is read once and moved over.
- `d` switches the theme; `/` opens the search palette. Both skip typing
  targets, modifier keys, repeats and events without a `key`, as now.
- The theme menu's checkbox is relabelled "Single-key shortcuts", with
  `D` and `/` shown as Kbd.

## Motion

Durations as tokens (`--duration-fast: 150ms`, `--duration-base: 250ms`)
and the existing reduced-motion rules in `globals.css`, which already turn
off tw-animate's movement; every new animation uses the tokens and is
checked under `prefers-reduced-motion: reduce` in Playwright.

## API

None: the interface calls no server.

## Events

None.

## Jobs

None.

## Tests

| Acceptance criterion | Proved by                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1                    | `contrast.test.ts` (Vitest, first added in 000): every pair ≥ 4.5:1, the ring ≥ 3:1, in both themes                                                                                                                                                                                                                                                                                  |
| 2                    | `e2e/shell.spec.ts`: at 360, 768, 1024 and 1440 px, tabs or sidebar, the skip link first, one `main`, the footer's notice                                                                                                                                                                                                                                                            |
| 3                    | `e2e/palette.spec.ts`: the button, Ctrl K, `/`; the setting off stops `d` and `/`, and survives a reload                                                                                                                                                                                                                                                                             |
| 4                    | `e2e/states.spec.ts` visits every fixture state; the owner's review on a preview, on a phone and a desktop                                                                                                                                                                                                                                                                           |
| 5                    | `e2e/pages.spec.ts`: each page's title and description; built as static (the build's route table shows ○)                                                                                                                                                                                                                                                                            |
| 6                    | Every e2e spec runs axe (WCAG 2.2 A and AA tags) in light and dark; `e2e/keyboard.spec.ts` tabs through the shell                                                                                                                                                                                                                                                                    |
| 7                    | `e2e/motion.spec.ts`: with reduced motion emulated, no element's position changes during a transition                                                                                                                                                                                                                                                                                |
| 8                    | `e2e/cls.spec.ts`: a `PerformanceObserver` for `layout-shift` sums to 0 on each page; the owner's `/interface-review`                                                                                                                                                                                                                                                                |
| 9                    | `e2e/focus-obscured.spec.ts`: at 360 × 640, Tab through a fixture list under the sticky bars; each focused row's box lies inside the viewport minus the bars                                                                                                                                                                                                                         |
| 10                   | `e2e/languages.spec.ts`: `/about` with `Accept-Language: hi-IN` redirects to `/hi/about`, with the cookie set to `en` to `/en/about`, with neither to `/en/about`; `/fr/about` is not found; the menu switches and the choice survives a reload; `<html lang>`, the Devanagari font on `/hi`, and the `hreflang` links. `pickLocale.test.ts` (Vitest) covers the choice              |
| 11                   | `dictionaries.test.ts`: the same keys in both, no empty values, placeholders match; `check-logical-css` and ESLint's `react/jsx-no-literals` in `apps/web/components` and `app` (tests and fixtures excepted)                                                                                                                                                                        |
| 12                   | `e2e/rtl.spec.ts`: the shell and every page this spec builds rendered with `dir="rtl"` forced on `<html>`, at 360 and 1280 px: no horizontal overflow (`scrollWidth` equals `clientWidth`), the sidebar on the start side, back and next icons mirrored, no arrow characters in the page's icons, the display button named "Display: theme and language"; `check-logical-css` passes |
| 2, 6, 8              | Run in both languages: every e2e spec loops over `en` and `hi`                                                                                                                                                                                                                                                                                                                       |

## Decisions

| Item                     | The repository now                                                                                                  | What the docs say (quoted)                                                                                                                                                                          | Decision                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contrast check           | none                                                                                                                | Playwright: "many accessibility problems can only be discovered through manual testing" ([accessibility testing](https://playwright.dev/docs/accessibility-testing))                                | A unit test over the tokens themselves, beside axe on the pages; OKLCH converted with Björn Ottosson's published [OKLab formulas](https://bottosson.github.io/posts/oklab/), no new dependency                                                                                                                                                                         |
| Fixture screens          | none                                                                                                                | –                                                                                                                                                                                                   | Routes under `(dev)/fixtures/`, built into previews for the owner's phone review, `notFound()` in production                                                                                                                                                                                                                                                           |
| One Proxy                | none                                                                                                                | Proxy: "The file must export a single function … multiple proxy from the same file are not supported" (bundled `proxy.md`)                                                                          | One `proxy.ts`, with the language redirect first and spec 006's CSP after it, each a plain function the Proxy calls in order                                                                                                                                                                                                                                           |
| Not found under `[lang]` | `app/not-found.tsx`; ADR 0003 turned `global-not-found` down because the root layout wasn't under a dynamic segment | `global-not-found.js` is for when "Your root layout is defined using top-level dynamic segments (e.g. `app/[country]/layout.tsx`)"; it needs `experimental.globalNotFound` (bundled `not-found.md`) | The root layout is now `app/[lang]/layout.tsx`, so: `app/[lang]/not-found.tsx` for `notFound()` inside a language, and `app/global-not-found.tsx` (English, its own `<html>`, styles and theme) for addresses that match nothing. A departure from ADR 0003's earlier choice, for the reason the docs give; ADR 0003 gets a line under Consequences when this is built |
| Translation library      | none                                                                                                                | ADR 0007                                                                                                                                                                                            | None: the guide's dictionaries, `Intl` and one `t()` helper                                                                                                                                                                                                                                                                                                            |

## Tasks

1. **Rules.** AGENTS.md's interface lines and `packages/ui/README.md`'s
   element-to-component table, from the interface standards plan (its
   section 2 and 3); that plan marked done. Done when the owner has audited
   the wording.
2. **Tokens.** `success`, `warning`, the 18 type pairs, the durations;
   `type-colors.ts`; `contrast.test.ts` (Vitest in `packages/ui`). Done
   when the test passes in both themes.
3. **Registry components.** Add the components listed with the CLI into
   `shadcn-ui/`; `TypeBadge`. Done when lint, types and build pass.
4. **Playwright.** Config, axe helper (fails on any violation), the CI job.
   Done when an empty smoke test runs in CI.
5. **Languages.** `app/[lang]` (moving `app/`'s pages and layout under
   it), `proxy.ts` with the redirect, `lib/i18n/` (locales, dictionaries
   with every string the shell and pages use, `t()`, `format.ts`,
   alternates, the `terms` list at the top of `hi.json`), the Devanagari
   font, the language switch in the display menu and the footer,
   `<Lang>` and `<WrittenIn>`, `global-not-found` with
   `experimental.globalNotFound: true` added to `next.config.ts` beside
   `cacheComponents`, `check-logical-css` and `react/jsx-no-literals`
   (with its `allowedStrings`) in `lint`. Done when
   `languages.spec.ts`, `dictionaries.test.ts` and `pickLocale.test.ts`
   pass, and the existing pages work under `/en` and `/hi`.
6. **The shell.** `AppShell`, tabs, sidebar, skip link, footer, landmarks;
   the root layout uses it; the not-found and error pages render inside it.
   The scroll-padding variables and `formatTime` with its unit test.
   Done when `shell.spec.ts`, `keyboard.spec.ts` and
   `focus-obscured.spec.ts` pass in both languages, and `rtl.spec.ts`
   passes for the shell.
7. **Shortcuts and the palette.** `shortcuts.tsx` replacing
   `theme-hotkey.tsx`; the palette with an empty source list and its empty
   state ("Type to search"). Done when `palette.spec.ts` passes.
8. **States.** Fixtures and fixture pages for loading, empty, error, not
   found, offline, no permission, AI unavailable and a live update, built
   from `EmptyState`, Skeleton and Alert. Done when `states.spec.ts` passes
   and the owner has reviewed them on a phone.
9. **Pages.** `/about`, `/legal` (notice, credits, licences: PokéAPI's BSD
   3-Clause, Pokémon Showdown's and `@pkmn`'s MIT, Smogon's statistics,
   sprites © The Pokémon Company), `/offline`. Done when `pages.spec.ts`,
   `motion.spec.ts` and `cls.spec.ts` pass and the owner's
   `/interface-review` passes.
