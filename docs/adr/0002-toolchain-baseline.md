# 2. Toolchain baseline

- Status: Accepted
- Date: 2026-10-20

## Context

An audit of the scaffold on 2026-10-20 found the checks in AGENTS.md
("Commands") passing without checking much:

- ESLint linted no TypeScript. Flat config lints only `**/*.js`, `**/*.cjs`
  and `**/*.mjs` unless `files` names more
  ([ESLint, configuration files](https://eslint.org/docs/latest/use/configure/configuration-files)),
  and no config named `.ts` or `.tsx`.
- `eslint-plugin-only-warn` turned every rule into a warning, so lint could
  never fail.
- `engines.node` allowed Node.js 20, which is past end of life, and which
  Babel 8 (then the lint parser) does not run on.
- Versions shared by packages were declared in each one, against AGENTS.md
  ("Versions"), and `^` ranges let releases younger than two weeks in.

## Decision

| Piece           | Decision                                                                                                                                                                                                                                                                                                                                                                      | Source                                                                                                                                                                                                                                              |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node.js         | the 24 LTS line: `engines.node` `^24`, which CI also reads                                                                                                                                                                                                                                                                                                                    | [Node.js releases](https://nodejs.org/en/about/previous-releases); [setup-node](https://github.com/actions/setup-node/blob/main/docs/advanced-usage.md) reads `engines.node`                                                                        |
| TypeScript      | 6.0                                                                                                                                                                                                                                                                                                                                                                           | typescript-eslint supports TypeScript `>=4.8.4 <6.1.0` ([dependency versions](https://typescript-eslint.io/users/dependency-versions/))                                                                                                             |
| Lint            | typescript-eslint's recommended rules in every package; `eslint-config-next`'s `core-web-vitals` and `typescript` configs in the app                                                                                                                                                                                                                                          | [typescript-eslint](https://typescript-eslint.io/getting-started/); [Next.js, ESLint plugin](https://nextjs.org/docs/app/api-reference/config/eslint)                                                                                               |
| Lint failing    | `only-warn` removed; every `lint` script runs `eslint --max-warnings 0`                                                                                                                                                                                                                                                                                                       | [ESLint CLI, `--max-warnings`](https://eslint.org/docs/latest/use/command-line-interface#--max-warnings)                                                                                                                                            |
| Accessibility   | jsx-a11y's whole recommended set in both React configs; `eslint-config-next` alone turns on six of its rules                                                                                                                                                                                                                                                                  | [eslint-plugin-jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y)                                                                                                                                                                      |
| Shared versions | defined once in the workspace catalog (`workspaces.catalog` in the root `package.json`) and referenced as `catalog:`                                                                                                                                                                                                                                                          | [Bun, catalogs](https://bun.com/docs/install/catalogs)                                                                                                                                                                                              |
| Release age     | direct dependencies pinned to exact versions (`install.exact` in `bunfig.toml`, so `bun add` writes them exactly); `install.minimumReleaseAge` of 14 days, so every version Bun picks from a range, including transitive ones, is at least that old                                                                                                                           | [bunfig, `install.exact` and `install.minimumReleaseAge`](https://bun.com/docs/runtime/bunfig)                                                                                                                                                      |
| Import order    | sorted by Prettier with `@ianvs/prettier-plugin-sort-imports`, which shadcn's own repository uses, in its groups: React, Next.js, other packages; `@workspace/`; `@/`; relative. It doesn't move imports across side-effect imports, which is why Prettier itself won't sort ("sorting is potentially unsafe because of side effects"); `format:check` catches unsorted files | [plugin README](https://github.com/IanVS/prettier-plugin-sort-imports); [Prettier rationale](https://prettier.io/docs/rationale); [Tailwind plugin, compatibility](https://github.com/tailwindlabs/prettier-plugin-tailwindcss) (it must load last) |
| Bun             | stays on 1.3.8 for now; moving to 1.4 is a separate, tested step                                                                                                                                                                                                                                                                                                              | [Bun 1.4](https://bun.com/1.4)                                                                                                                                                                                                                      |

## Departures from official guidance

- **React version for eslint-plugin-react.** `eslint-config-next` sets
  `settings.react.version` to `"detect"`. eslint-plugin-react 7.37.5, the
  latest release, detects through `context.getFilename()`, which ESLint 10
  removed
  ([migration guide](https://eslint.org/docs/latest/use/migrate-to-10.0.0)),
  so linting crashed. `packages/eslint-config/react-version.js` reads the
  catalog's React version (the config package's own `react` devDependency,
  resolved from its file, so it works from any directory) and both React
  configs pass it explicitly. Remove it once eslint-plugin-react supports
  ESLint 10.
- **Tailwind `@source` paths.** shadcn's `next-monorepo` template has
  `@source "../../../apps/**"` and `@source "../../../components/**"` in
  `packages/ui/src/styles/globals.css`. Tailwind resolves `@source` paths
  "relative to the stylesheet"
  ([Detecting classes in source files](https://tailwindcss.com/docs/detecting-classes-in-source-files)),
  so both pointed into `packages/`, at folders that don't exist; a build with a
  probe class in each place confirmed it. The `apps` line is now
  `../../../../apps/**`, and the `components` line is gone (there is no root
  `components/`). The app's generated CSS was the same before and after.

## Alternatives considered

- **TypeScript 7.** Next.js 16.4 can type-check with it through the `tsc` CLI
  ([TypeScript config](https://nextjs.org/docs/app/api-reference/config/typescript)),
  but it "does not currently provide the JavaScript compiler API", and
  typescript-eslint stops at 6.0. Revisit when typescript-eslint supports it.
- **Keeping the Babel parser.** It has no type information, and the TypeScript
  rules come from typescript-eslint anyway; Babel 8 also needs Node.js
  `^22.18.0 || >=24.11.0`.
- **`^` ranges with only the release-age setting.** The lockfile would still
  pin, but the manifest wouldn't show which version was chosen; exact pins
  make each update a visible, deliberate edit.

## Consequences

- `bun run lint` fails on any warning or error, in TypeScript as well as
  JavaScript.
- `bun install` warns that some plugins don't list ESLint 10 as a peer; Next.js
  documents this.
- `bun add <name>` picks the newest version at least 14 days old and pins it.
  A version requested exactly (`bun add <name>@1.2.3`) is installed whatever
  its age (tested with Bun 1.3.8), so its date is checked by hand first.
- A security fix younger than 14 days is pinned exactly if it's a direct
  dependency; a transitive one needs `minimumReleaseAgeExcludes` for that
  version. Either way, the reason is recorded.

## Sources

Linked inline above.
