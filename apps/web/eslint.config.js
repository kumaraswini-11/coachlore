import { defineConfig } from "eslint/config"

import { nextJsConfig } from "@workspace/eslint-config/next-js"

const eslintConfig = defineConfig([
  ...nextJsConfig,
  {
    // Where the Next.js app is, whatever directory ESLint runs from.
    settings: { next: { rootDir: import.meta.dirname } },
  },
])

export default eslintConfig
