import { defineConfig, globalIgnores } from "eslint/config"

import { config } from "@workspace/eslint-config/base"

// Playwright's own output (traces, reports), gitignored and never source:
// an interrupted run leaves bundled scripts there that would fail lint.
export default defineConfig([
  globalIgnores(["test-results/", "playwright-report/"]),
  config,
])
