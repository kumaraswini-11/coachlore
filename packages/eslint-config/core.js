import { defineConfig } from "eslint/config"
import globals from "globals"

import { config as baseConfig } from "./base.js"

// What a core package never imports: a framework, an interface library, a
// database or sign-in client, or the file system outside its one Node-only
// entry point (AGENTS.md, "The core is framework-agnostic").
const FRAMEWORKS = [
  "react",
  "react-dom",
  "next",
  "next-intl",
  "@workspace/ui",
  "pg",
  "postgres",
  "drizzle-orm",
  "better-auth",
]

/**
 * A custom ESLint configuration for the core packages (the Pokémon data
 * model, the league rules, the battle-log parser): the base rules, Node and
 * browser-neutral globals only, and no framework, interface or storage
 * imports. `node:fs` is allowed only in a package's `src/files.ts`.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const coreConfig = defineConfig([
  ...baseConfig,
  {
    files: ["**/*.{js,mjs,ts,mts}"],
    languageOptions: { globals: globals["shared-node-browser"] },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: FRAMEWORKS.flatMap((name) => [name, `${name}/*`]),
              message:
                "Core packages import no framework, interface or storage code.",
            },
            {
              group: ["node:fs", "node:fs/*", "fs", "fs/*"],
              message:
                "Only src/files.ts reads files, so the rest runs in the browser too.",
            },
          ],
        },
      ],
    },
  },
  {
    // The Node-only entry point, the scripts and the tests may read files.
    files: ["src/files.ts", "scripts/**", "**/*.test.ts"],
    languageOptions: { globals: globals.node },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: FRAMEWORKS.flatMap((name) => [name, `${name}/*`]),
              message:
                "Core packages import no framework, interface or storage code.",
            },
          ],
        },
      ],
    },
  },
])
