import eslintConfigPrettier from "eslint-config-prettier/flat"
import jsxA11y from "eslint-plugin-jsx-a11y"
import pluginReact from "eslint-plugin-react"
import pluginReactHooks from "eslint-plugin-react-hooks"
import { defineConfig } from "eslint/config"
import globals from "globals"

import { config as baseConfig } from "./base.js"
import { interfaceTextRules } from "./interface-text.js"
import { reactVersion } from "./react-version.js"

/**
 * A custom ESLint configuration for libraries that use React.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const config = defineConfig([
  ...baseConfig,
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    extends: [
      pluginReact.configs.flat.recommended,
      pluginReact.configs.flat["jsx-runtime"],
      pluginReactHooks.configs.flat.recommended,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    settings: {
      react: { version: reactVersion },
    },
    rules: {
      // TypeScript checks props; prop-types would repeat it at runtime.
      "react/prop-types": "off",
      ...interfaceTextRules,
    },
  },
  eslintConfigPrettier,
])
