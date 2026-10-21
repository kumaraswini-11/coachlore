import { defineConfig, devices } from "@playwright/test"

const PORT = 3100
const CI = Boolean(process.env.CI)

// End-to-end tests of apps/web against its production build (spec 001,
// "Tests"). `bun run e2e` from the root builds the app first (turbo.json);
// run alone, it needs `bun run build` before.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  // One worker in CI, as Playwright's own template sets. Two locally: more
  // WebKit instances at once time out at random on a Windows machine.
  workers: CI ? 1 : 2,
  reporter: CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    // The web app's own start script, found by its package name: no path
    // into another package (Turborepo, "Common pitfalls").
    command: "bun run --filter web start",
    env: { PORT: String(PORT) },
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !CI,
    timeout: 120_000,
  },
})
