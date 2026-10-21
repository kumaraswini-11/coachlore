# Plan: scaffold follow-ups

- Status: in progress; what's left is under [Open](#open)
- Checked against the repository: 2026-10-20

What the shadcn monorepo template left that doesn't match the project's
rules, found while setting the repository up. Each item was checked in the
files on the date above; check it again before acting, since the repository
moves on.

## Open

| Item               | The repository now                                                                               | To decide                                                                                                                                                                                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package manager    | Bun 1.3.8 (`packageManager`, `bun.lock`); pnpm traces in `.prettierignore` and an empty `.npmrc` | Bun or pnpm, quoting each one's docs and the shadcn, Turborepo and Next.js docs; then remove the other's traces                                                                                                                                                                                                     |
| Bun version        | 1.3.8; the current line is 1.4 (newest at least two weeks old on 2026-10-20: 1.4.2)              | the upgrade, as its own tested step, once the package manager is decided                                                                                                                                                                                                                                            |
| Test runner        | none; `site.ts` has no logic yet, so nothing needs a unit test                                   | Settled: Vitest from [spec 000](../specs/000-platform/plan.md), Playwright with axe from [spec 001](../specs/001-interface/plan.md), Testcontainers from [spec 006](../specs/006-accounts/plan.md), k6 in [spec 014](../specs/014-production-readiness/plan.md) ([ADR 0006](../adr/0006-architecture-and-stack.md)) |
| Hosting and domain | none; `NEXT_PUBLIC_SITE_URL` defaults to `http://localhost:3000`                                 | Settled: Vercel and an Oracle Cloud VM, no domain (the owner, 2026-10-21) ([ADR 0006](../adr/0006-architecture-and-stack.md), "Hosting"); the site address comes from Vercel ([spec 000](../specs/000-platform/spec.md)); `Strict-Transport-Security` in [spec 014](../specs/014-production-readiness/spec.md)      |
| Share image        | `app/opengraph-image.png`, `apple-icon.png` and `icon.svg` are placeholders                      | the owner supplies or approves the design                                                                                                                                                                                                                                                                           |
| Error reporting    | `error.tsx` and `global-error.tsx` log to the browser console                                    | **Done** for the web app (spec 000); settled: Sentry for the web app in [spec 000](../specs/000-platform/spec.md) and for the server in [spec 006](../specs/006-accounts/spec.md)                                                                                                                                   |

### Repository settings (the owner, on github.com)

- **A ruleset on `main`:** none exists and `main` is unprotected (checked
  through GitHub's public API). The recommended rules are in
  [the git workflow](../git-workflow.md#github-settings); the repository is
  public, so they're available on GitHub Free.
- **Secret scanning push protection and Dependabot alerts** (alerts only, no
  pull requests, as the git workflow requires): both free for public
  repositories.

### From the skills audit (2026-10-21)

Found by the installed skills (`better-interface`, `core-web-vitals`,
`security-and-hardening`, `turborepo`, `codebase-design`); the fixes made
that day are under [Done](#done-2026-10-21). Still open:

| Item                         | Found                                                                                                                                                                                                                                            | When                                                                                                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Theme control's first open   | **Done**: opening the theme menu the first time took 712–1,392 ms at 4× CPU slowdown (INP "poor" is over 500 ms), mostly Base UI positioning and animating the popup. Keeping the popup mounted didn't help (824–1,320 ms) and slowed page load. | Settled (2026-10-21): the owner chose two one-press buttons, language and theme, instead of the menu ([spec 001](../specs/001-interface/spec.md), "The app shell")                     |
| Production site URL          | **Done** (spec 000): a production build without `NEXT_PUBLIC_SITE_URL` silently used `http://localhost:3000` for canonical URLs and link previews.                                                                                               | Settled: the address comes from Vercel's own variables ([spec 000](../specs/000-platform/spec.md))                                                                                     |
| CSP `'unsafe-inline'`        | Safe while the site shows no user content.                                                                                                                                                                                                       | Settled in [spec 006](../specs/006-accounts/spec.md) and [spec 014](../specs/014-production-readiness/spec.md): the signed-in pages that render user and AI text get a stricter policy |
| Theme colours in two places  | `apps/web/lib/site.ts` copies `--background` from `globals.css` as hex.                                                                                                                                                                          | When the palette is designed: `@workspace/ui` owns them                                                                                                                                |
| App-wide components' home    | ADR 0001 names `components/<feature>/` only; the theme and error components sit at `components/`.                                                                                                                                                | With the first feature folder: a row in ADR 0001                                                                                                                                       |
| Core packages' conventions   | No naming or rules yet for the framework-agnostic packages; `typescript-config/base.json` includes `DOM`, and no lint rule keeps React or Next.js out.                                                                                           | Settled: the core presets in [spec 002](../specs/002-pokemon-data/plan.md)                                                                                                             |
| `eslint-config` isn't linted | The package has no `lint` script.                                                                                                                                                                                                                | Minor, any time                                                                                                                                                                        |
| CI speed                     | Every CI run starts with an empty Turborepo cache; the steps run one at a time.                                                                                                                                                                  | When CI time matters: remote cache (an account decision) or `actions/cache`                                                                                                            |
| Button `transition-all`      | The registry Button transitions every property.                                                                                                                                                                                                  | With the interface plan's decision on editing registry files                                                                                                                           |
| The placeholder home page    | No `<main>`, a button that does nothing, a 14 px title.                                                                                                                                                                                          | Settled: replaced by the real home page in [spec 003](../specs/003-dex-browse/spec.md)                                                                                                 |

### Documents

- In [the research](../research/pokemon-app-research.md), the Bulbagarden
  forum link blocks automated checks and has no archived copy; open it in a
  browser and replace it if it's gone.

## Done (2026-10-21)

From the skills audit, each checked in a browser or against its source:

- **Security:** Next.js 16.4.1, which fixes three advisories against 16.4.0
  (two remote code execution, one denial of service), exempted from the
  14-day rule in `bunfig.toml` with the reason (ADR 0002);
  `"trustedDependencies": []`, so no package's install scripts run unless
  listed; `bun audit` in CI, with the one advisory that has no fix ignored
  and dated; `*.key` gitignored; `eslint-config-next` 16.4.0, now two weeks
  old, matching `next`.
- **Focus:** the `--ring` token reaches 3:1 against the background (3.40:1
  light, 4.48:1 dark, from 1.55:1 and 1.89:1); a focus outline in forced
  colours; theme menu items show a focus outline (17.93:1) and are 44 px tall.
- **Motion:** with reduced motion, the menu's open and close animations fade
  without moving or scaling.
- **Copy and type:** the error page's title says what failed ("This page
  couldn’t load"); typographic apostrophes; an `EmptyState` page title is
  larger than its description; the shortcut switch reads "Switch theme with
  D".
- **Code:** the `d` key, its on/off preference and its listener live in one
  module (`apps/web/components/theme-hotkey.tsx`).

## Done (2026-10-20)

Decisions, recorded in [ADR 0002](../adr/0002-toolchain-baseline.md):

- **Node.js:** the 24 LTS line (`engines.node` `^24`, `@types/node` 24).
- **TypeScript:** 6.0, the newest line typescript-eslint supports.
- **Lint parser:** typescript-eslint, with `eslint-config-next` in the app.
- **Lint failing:** `only-warn` removed; `eslint --max-warnings 0`.

Clean-ups:

- **Legacy `.eslintrc.js`** removed: "Starting with ESLint v10.0.0, the old
  configuration format is no longer supported"
  ([migration guide](https://eslint.org/docs/latest/use/migrate-to-10.0.0)).
- **`transpilePackages`** removed from `apps/web/next.config.ts`.
- **`paths`** removed from `packages/ui/tsconfig.json`, and the
  `@workspace/ui/*` path from `apps/web/tsconfig.json`, which reached into
  `packages/ui/src` around the package's `exports`.
- **Unused dependencies** removed from `packages/ui`: `next-themes` (the app
  uses it, and keeps it), `zod` and `@turbo/gen`, with its unused
  `tsconfig.lint.json`. `lucide-react` stays in both, from the catalog:
  `components.json` names Lucide as the icon library, and registry components
  import it (`dialog` imports `XIcon`) without the CLI installing it.
- **`@source` lines in `globals.css`:** both `../../../` lines pointed into
  `packages/`; see ADR 0002.
- **`publishConfig.access`** removed from `packages/typescript-config`.
- **`"workspace:^"`** is now `"workspace:*"`.
- **`turborepo.dev`:** `turbo.json`'s `$schema` and the README's links.
- **The root `tsconfig.json`** removed.
- **CI:** [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) runs
  the checks in AGENTS.md and checks every commit's author and committer
  email.
