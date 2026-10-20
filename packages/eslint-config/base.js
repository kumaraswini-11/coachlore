import js from "@eslint/js"
import eslintConfigPrettier from "eslint-config-prettier/flat"
import turboPlugin from "eslint-plugin-turbo"
import { defineConfig, globalIgnores } from "eslint/config"
import tseslint from "typescript-eslint"

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const config = defineConfig([
  {
    // ESLint lints only .js, .cjs and .mjs unless `files` names more.
    files: ["**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
  },
  turboPlugin.configs["flat/recommended"],
  globalIgnores(["dist/**"]),
  // Last, so it turns off any rule that conflicts with Prettier.
  eslintConfigPrettier,
])
