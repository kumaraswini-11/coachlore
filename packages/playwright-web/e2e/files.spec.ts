import { expect, test } from "@playwright/test"

// The site's files are served as they are, never redirected to a language:
// the Proxy's matcher names each one (apps/web/proxy.ts).
const FILES = [
  "/favicon.ico",
  "/icon.svg",
  "/apple-icon.png",
  "/manifest.webmanifest",
  "/robots.txt",
  "/sitemap.xml",
]

for (const path of FILES) {
  test(`${path} is served without a redirect`, async ({ request }) => {
    const response = await request.get(path, { maxRedirects: 0 })
    expect(response.status()).toBe(200)
  })
}

test("a mistyped file gets a language, then the not-found page", async ({
  page,
}) => {
  await page.setExtraHTTPHeaders({ "Accept-Language": "en" })
  const response = await page.goto("/missing.txt")
  expect(page.url()).toMatch(/\/en\/missing\.txt$/)
  expect(response?.status()).toBe(404)
})
