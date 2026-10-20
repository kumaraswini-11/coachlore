import eslintConfigPrettier from "eslint-config-prettier/flat"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"
import jsxA11y from "eslint-plugin-jsx-a11y"
import { defineConfig, globalIgnores } from "eslint/config"

import { config as baseConfig } from "./base.js"
import { reactVersion } from "./react-version.js"

/**
 * A custom ESLint configuration for libraries that use Next.js.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const nextJsConfig = defineConfig([
  ...baseConfig,
  ...nextVitals,
  ...nextTs,
  {
    // eslint-config-next registers jsx-a11y but turns on only a few of its
    // rules; this turns on the plugin's whole recommended set.
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    rules: jsxA11y.flatConfigs.recommended.rules,
    settings: {
      // Replaces eslint-config-next's `"detect"`; see react-version.js.
      react: { version: reactVersion },
    },
  },
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  eslintConfigPrettier,
])
