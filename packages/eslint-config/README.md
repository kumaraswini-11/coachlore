# @workspace/eslint-config

Draftboard's shared ESLint settings:
[flat configs](https://eslint.org/docs/latest/use/configure/configuration-files)
that every app and package extends, so the lint rules are set in one place.

## Why a separate package

It owns the lint rules and nothing else. It's plain JavaScript configuration
with no app code, so it's framework-agnostic itself; the Next.js and React
rules are opt-in exports. A change to the rules is one edit here.

## Use

Add it, with ESLint from the workspace catalog, to the package's
`devDependencies`:

```json
"devDependencies": {
  "@workspace/eslint-config": "workspace:*",
  "eslint": "catalog:"
}
```

Then, in the package's `eslint.config.js`:

```js
import { nextJsConfig } from "@workspace/eslint-config/next-js"

/** @type {import("eslint").Linter.Config} */
export default nextJsConfig
```

For settings only one package needs, spread the shared config and add a block
after it, as
[Turborepo's ESLint guide](https://turborepo.dev/docs/guides/tools/eslint)
shows. `apps/web/eslint.config.js` does this to give Next.js's rules the app's
folder (`settings.next.rootDir`, from
[Next.js's monorepo example](https://nextjs.org/docs/app/api-reference/config/eslint#specifying-a-root-directory-within-a-monorepo)),
so ESLint works from any directory, the repository root included.

Each package's `lint` script is `eslint --max-warnings 0`, so a warning fails
the check as an error does.

## Exports

| Export             | Named export   | Builds on | Adds                                                                                                                                                                                                                                                      | Used by       |
| ------------------ | -------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `./base`           | `config`       | (none)    | ESLint's and [typescript-eslint](https://typescript-eslint.io/getting-started/)'s recommended rules for every JavaScript and TypeScript extension; Turborepo's undeclared-env-var check; ignores `dist/`; Prettier compatibility, last                    | the two below |
| `./next-js`        | `nextJsConfig` | `./base`  | [`eslint-config-next`](https://nextjs.org/docs/app/api-reference/config/eslint)'s `core-web-vitals` and `typescript` configs (Next.js, React, React Hooks, import and accessibility plugins); jsx-a11y's whole recommended set; Next.js's default ignores | `apps/web`    |
| `./react-internal` | `config`       | `./base`  | browser globals; the recommended rules of eslint-plugin-react (with the automatic JSX runtime), React Hooks and jsx-a11y; `react/prop-types` off, since TypeScript checks props                                                                           | `packages/ui` |

## Known workaround

eslint-plugin-react 7.37, the latest release, finds the React version
(`settings.react.version: "detect"`) through `context.getFilename()`, which
ESLint 10 removed
([migration guide](https://eslint.org/docs/latest/use/migrate-to-10.0.0)).
`react-version.js` reads the catalog's React version instead (this package's
own `react` devDependency, resolved from its file, so it works from any
directory), and both React configs pass it explicitly. Remove it once
eslint-plugin-react supports ESLint 10. Next.js notes that some plugins in
`eslint-config-next` don't list ESLint 10 as a peer yet, so `bun install`
prints peer warnings for them
([ESLint plugin](https://nextjs.org/docs/app/api-reference/config/eslint)).

## Status

Internal and private (`"private": true`): never published. Nothing to build.
