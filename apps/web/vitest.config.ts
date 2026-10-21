import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      // The app's "@/" imports, as tsconfig.json maps them.
      "@": fileURLToPath(new URL(".", import.meta.url)),
      // Next.js resolves "server-only" itself; outside Next.js the package
      // throws on import, so tests get an empty module instead.
      "server-only": fileURLToPath(
        new URL("./test/server-only.ts", import.meta.url)
      ),
    },
  },
  test: {
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules/**", ".next/**"],
    // next-intl's files import `next/server` without an extension, which
    // Node's own loader rejects; Vitest bundles it instead.
    server: { deps: { inline: ["next-intl"] } },
  },
})
