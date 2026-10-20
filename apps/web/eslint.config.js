import { nextJsConfig } from "@workspace/eslint-config/next-js"
import { defineConfig } from "eslint/config"

const eslintConfig = defineConfig([
  ...nextJsConfig,
  {
    // Where the Next.js app is, whatever directory ESLint runs from.
    settings: { next: { rootDir: import.meta.dirname } },
  },
])

export default eslintConfig
