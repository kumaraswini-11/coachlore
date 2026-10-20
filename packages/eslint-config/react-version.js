import { createRequire } from "node:module"

/**
 * The repository's React version, from the workspace catalog (this package's
 * `react` devDependency), resolved from this file so that it doesn't depend
 * on the directory ESLint runs from.
 *
 * eslint-plugin-react 7.37's `"detect"` calls `context.getFilename()`, which
 * ESLint 10 removed; an explicit `settings.react.version` skips that call.
 * Remove this once eslint-plugin-react supports ESLint 10.
 */
export const reactVersion = createRequire(import.meta.url)(
  "react/package.json"
).version
