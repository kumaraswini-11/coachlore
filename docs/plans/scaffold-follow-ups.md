# Plan: scaffold follow-ups

- Status: not started
- Checked against the repository: 2026-10-20

What the shadcn monorepo template left that doesn't match the project's
rules, found while setting the repository up. Each item was checked in the
files on the date above; check it again before acting, since the repository
moves on.

## Decisions first (each recorded as an ADR)

| Item            | The repository now                                                                                                    | To decide                                                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package manager | Bun 1.3.8 (`packageManager`, `bun.lock`); pnpm traces in `.prettierignore` and an empty `.npmrc`                      | Bun or pnpm, quoting each one's docs and the shadcn, Turborepo and Next.js docs; then remove the other's traces                                          |
| Node.js         | `engines.node` `>=20.9.0`; `@types/node` `^20` in `apps/web` and `packages/ui`                                        | the supported LTS line from the [Node.js releases page](https://nodejs.org/en/about/previous-releases) (24, or 26 once it's LTS); `@types/node` to match |
| TypeScript      | `^5` in the root, `apps/web` and `packages/ui`                                                                        | the current supported line, from TypeScript's own release notes                                                                                          |
| Lint failing    | `./base` loads `eslint-plugin-only-warn`, so every rule is a warning and `bun run lint` exits 0 on any rule violation | whether lint errors should fail the checks (and CI); without that, lint enforces nothing                                                                 |
| Lint parser     | `@babel/eslint-parser` with the TypeScript preset; no `typescript-eslint`, so no type-aware rules                     | keep Babel, or move to `typescript-eslint`                                                                                                               |

## Clean-ups (small, once the decisions above are made)

- **Legacy `.eslintrc.js` at the root.** Every workspace uses a flat
  `eslint.config.js` on ESLint 10; confirm in ESLint's migration guide that
  eslintrc is no longer read, then remove it (the owner's file: ask first).
- **`transpilePackages: ["@workspace/ui"]`** in `apps/web/next.config.ts`.
  Next.js 16: "Turbopack transpiles workspace packages … automatically under
  both routers. Webpack does the same for the App Router"
  ([`transpilePackages`](https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages)).
- **`paths` in `packages/ui/tsconfig.json`.** Turborepo: "A library that is
  being transpiled by its consumer cannot use the `compilerOptions.paths`
  configuration"
  ([Internal packages](https://turborepo.dev/docs/core-concepts/internal-packages)).
  Nothing in `packages/ui` imports through it today.
- **Unused dependencies in `packages/ui`:** `next-themes` and `zod` (nothing
  in `src/` imports them). `shadcn` stays: `globals.css` imports
  `shadcn/tailwind.css`.
- **A `@source` line in `globals.css` that matches nothing:**
  `../../../components/**` (there is no root `components/` folder).
- **`publishConfig.access: "public"`** in `packages/typescript-config`, which
  is `"private": true` and never published.
- **`"workspace:^"`** for `@workspace/eslint-config` in `apps/web`; every
  other reference is `"workspace:*"`.
- **Turborepo's move to `turborepo.dev`:** `turbo.json`'s `$schema` is
  `https://turbo.build/schema.json`, and the README's two `turborepo.com`
  links work only through redirects.
- **The root `tsconfig.json`** extends `base.json`; Turborepo's TypeScript
  guide advises each package to have its own `tsconfig.json` rather than
  relying on a root one ([TypeScript guide](https://turborepo.dev/docs/guides/tools/typescript)).

## Repository settings (the owner, on github.com)

- **A ruleset on `main`:** none exists and `main` is unprotected (checked
  through GitHub's public API). The recommended rules are in
  [the git workflow](../git-workflow.md#github-settings); the repository is
  public, so they're available on GitHub Free.
- **CI:** there's no `.github/` yet. When it's added, it runs the checks in
  AGENTS.md and a check that every commit's author and committer email is the
  owner's.

## Documents

- In [the research](../research/pokemon-app-research.md), the Bulbagarden
  forum link blocks automated checks and has no archived copy; open it in a
  browser and replace it if it's gone.
