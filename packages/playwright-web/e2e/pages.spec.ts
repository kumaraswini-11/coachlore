import { expect, test } from "@playwright/test"

import { expectAccessible } from "./axe"

// Spec 001, criterion 5: /about, /legal and /offline are built, static,
// with their own titles and descriptions, in both languages.

const PAGES = {
  en: [
    { path: "/about", title: "About · Coachlore", h1: "About" },
    { path: "/legal", title: "Legal · Coachlore", h1: "Legal" },
    {
      path: "/offline",
      title: "You’re offline · Coachlore",
      h1: "You’re offline",
    },
  ],
  hi: [
    { path: "/about", title: "परिचय · Coachlore", h1: "परिचय" },
    {
      path: "/legal",
      title: "क़ानूनी जानकारी · Coachlore",
      h1: "क़ानूनी जानकारी",
    },
    {
      path: "/offline",
      title: "आप ऑफ़लाइन हैं · Coachlore",
      h1: "आप ऑफ़लाइन हैं",
    },
  ],
}

for (const [locale, pages] of Object.entries(PAGES)) {
  for (const { path, title, h1 } of pages) {
    test(`/${locale}${path} is static, titled and accessible`, async ({
      page,
      request,
    }) => {
      const response = await request.get(`/${locale}${path}`)
      expect(response.status()).toBe(200)
      // Prerendered: served from the build, cached at the edge.
      expect(response.headers()["cache-control"]).toMatch(/s-maxage=/)
      const html = await response.text()
      expect(html).toContain(`<title>${title}</title>`)
      expect(html).toMatch(/<meta name="description" content="[^"]{40,}"/)

      await page.goto(`/${locale}${path}`)
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(h1)
      await expectAccessible(page)
    })
  }
}

test("the footer leads to About and Legal in the page's language", async ({
  page,
}) => {
  await page.goto("/hi")
  await page
    .getByRole("contentinfo")
    .getByRole("link", { name: "परिचय" })
    .click()
  await expect(page).toHaveURL(/\/hi\/about$/)
  await page.goto("/hi")
  await page
    .getByRole("contentinfo")
    .getByRole("link", { name: "क़ानूनी जानकारी" })
    .click()
  await expect(page).toHaveURL(/\/hi\/legal$/)
})

test("/offline is kept out of search results", async ({ request }) => {
  const html = await (await request.get("/en/offline")).text()
  expect(html).toMatch(/<meta name="robots" content="noindex"/)
})
