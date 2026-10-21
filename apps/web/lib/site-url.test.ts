import { describe, expect, it } from "vitest"

import { siteUrl } from "./site-url"

describe("siteUrl", () => {
  it("is the local address with nothing set", () => {
    expect(siteUrl({})).toBe("http://localhost:3000")
  })

  it("uses the override first, without a trailing slash", () => {
    expect(
      siteUrl({
        NEXT_PUBLIC_SITE_URL: "https://example.org/",
        VERCEL_ENV: "production",
        VERCEL_PROJECT_PRODUCTION_URL: "coachlore.vercel.app",
      })
    ).toBe("https://example.org")
  })

  it("is the production address in production", () => {
    expect(
      siteUrl({
        VERCEL_ENV: "production",
        VERCEL_PROJECT_PRODUCTION_URL: "coachlore.vercel.app",
        VERCEL_URL: "coachlore-abc123.vercel.app",
      })
    ).toBe("https://coachlore.vercel.app")
  })

  it("is the branch address in a preview", () => {
    expect(
      siteUrl({
        VERCEL_ENV: "preview",
        VERCEL_BRANCH_URL: "coachlore-git-feat-000-platform.vercel.app",
        VERCEL_URL: "coachlore-abc123.vercel.app",
      })
    ).toBe("https://coachlore-git-feat-000-platform.vercel.app")
  })

  it("falls back to the deployment address in a preview with no branch address", () => {
    expect(
      siteUrl({
        VERCEL_ENV: "preview",
        VERCEL_URL: "coachlore-abc123.vercel.app",
      })
    ).toBe("https://coachlore-abc123.vercel.app")
  })

  it("is the local address in Vercel's development environment", () => {
    expect(
      siteUrl({ VERCEL_ENV: "development", VERCEL_URL: "localhost:3000" })
    ).toBe("http://localhost:3000")
  })
})
