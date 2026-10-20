# Plan: scaffold follow-ups

- Status: in progress; what's left is under [Open](#open)
- Checked against the repository: 2026-10-20

What the shadcn monorepo template left that doesn't match the project's
rules, found while setting the repository up. Each item was checked in the
files on the date above; check it again before acting, since the repository
moves on.

## Open

| Item            | The repository now                                                                               | To decide                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Package manager | Bun 1.3.8 (`packageManager`, `bun.lock`); pnpm traces in `.prettierignore` and an empty `.npmrc` | Bun or pnpm, quoting each one's docs and the shadcn, Turborepo and Next.js docs; then remove the other's traces |
| Bun version     | 1.3.8; the current line is 1.4 (newest at least two weeks old on 2026-10-20: 1.4.2)              | the upgrade, as its own tested step, once the package manager is decided                                        |

### Repository settings (the owner, on github.com)

- **A ruleset on `main`:** none exists and `main` is unprotected (checked
  through GitHub's public API). The recommended rules are in
  [the git workflow](../git-workflow.md#github-settings); the repository is
  public, so they're available on GitHub Free.

### Documents

- In [the research](../research/pokemon-app-research.md), the Bulbagarden
  forum link blocks automated checks and has no archived copy; open it in a
  browser and replace it if it's gone.

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
