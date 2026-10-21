import { existsSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server"
import { describe, expect, it } from "vitest"

import { config } from "./proxy"

// Next.js's own test helper for a Proxy's matcher (its proxy docs, "Unit
// testing"). The docs name it `unstable_doesProxyMatch`; Next.js 16.4.1
// still exports it as `unstable_doesMiddlewareMatch`.
const runs = (url: string) =>
  unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })

// The address each file convention at the root of `app/` is served at.
const SERVED_AS: Array<[RegExp, (file: string) => string]> = [
  [/^favicon\.ico$/, () => "/favicon.ico"],
  [/^(icon|apple-icon)\.\w+$/, (file) => `/${file}`],
  [/^manifest\.(ts|js|json|webmanifest)$/, () => "/manifest.webmanifest"],
  [/^robots\.(ts|js|txt)$/, () => "/robots.txt"],
  [/^sitemap\.(ts|js|xml)$/, () => "/sitemap.xml"],
]
// Files at the root of `app/` that aren't served at an address of their own.
const NOT_SERVED = /^global-(?:error|not-found)\.tsx$/

const app = join(import.meta.dirname, "app")
const rootFiles = readdirSync(app, { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
const publicDir = join(import.meta.dirname, "public")
const publicFiles = existsSync(publicDir)
  ? readdirSync(publicDir, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) =>
        `/${join(entry.parentPath, entry.name).slice(publicDir.length + 1)}`.replaceAll(
          "\\",
          "/"
        )
      )
  : []

describe("the site's files skip the Proxy", () => {
  it.each(rootFiles.filter((file) => !NOT_SERVED.test(file)))(
    "app/%s",
    (file) => {
      const served = SERVED_AS.find(([pattern]) => pattern.test(file))
      expect(served, `${file} has no known address; add it here`).toBeDefined()
      expect(runs(served![1](file))).toBe(false)
    }
  )

  it.each(publicFiles)("public%s", (path) => {
    expect(runs(path)).toBe(false)
  })
})

describe("every other address goes through it", () => {
  it.each([
    "/",
    "/about",
    "/en",
    "/hi/dex",
    "/missing.txt",
    "/apiary",
    "/monitoringx",
  ])("%s", (url) => {
    expect(runs(url)).toBe(true)
  })
})

it.each([
  "/api/x",
  "/_next/static/chunk.js",
  "/monitoring",
  "/_vercel/insights",
])("%s is left to Next.js, Vercel and Sentry", (url) => {
  expect(runs(url)).toBe(false)
})
