# @workspace/eslint-config

Draftboard's shared ESLint settings:
[flat configs](https://eslint.org/docs/latest/use/configure/configuration-files)
that every app and package extends, so the lint rules are set in one place.

## Why a separate package

It owns the lint rules and nothing else. It's plain JavaScript configuration
with no app code, so it's framework-agnostic itself; the Next.js and React
rules are opt-in exports. A change to the rules is one edit here.

## Use

Add it, with ESLint, to the package's `devDependencies`:

```json
"devDependencies": {
  "@workspace/eslint-config": "workspace:*",
  "eslint": "^10"
}
```

Then, in the package's `eslint.config.js`:

```js
import { nextJsConfig } from "@workspace/eslint-config/next-js"

/** @type {import("eslint").Linter.Config} */
export default nextJsConfig
```

## Exports

| Export             | Named export   | Builds on | Adds                                                                                                                                                                                  | Used by       |
| ------------------ | -------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `./base`           | `config`       | (none)    | ESLint's recommended rules; Prettier compatibility; TypeScript parsing (Babel); Turborepo's undeclared-env-var check; every rule reported as a warning (`only-warn`); ignores `dist/` | the two below |
| `./next-js`        | `nextJsConfig` | `./base`  | browser and service-worker globals; Next.js's recommended and Core Web Vitals rules; React Hooks rules; Next.js's default ignores                                                     | `apps/web`    |
| `./react-internal` | `config`       | `./base`  | browser and service-worker globals; React Hooks rules                                                                                                                                 | `packages/ui` |

## Status

Internal and private (`"private": true`): never published. Nothing to build.
