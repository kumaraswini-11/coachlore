import { expect, test } from "@playwright/test"

import { expectAccessible } from "./axe"

// Spec 001, criteria 10 and 13: addresses, the redirect, the remembered
// language, each page's language and alternates, and the not-found page.

const LOCALES = ["en", "hi"] as const

test.describe("an address without a language", () => {
  const redirect = async (
    request: import("@playwright/test").APIRequestContext,
    path: string,
    headers: Record<string, string>
  ) => {
    const response = await request.get(path, { headers, maxRedirects: 0 })
    expect(response.status()).toBe(307)
    return new URL(response.headers()["location"] ?? "", "http://localhost")
      .pathname
  }

  test("goes to the browser's language", async ({ request }) => {
    expect(
      await redirect(request, "/", { "Accept-Language": "hi-IN,hi;q=0.9" })
    ).toBe("/hi")
  })

  test("goes to the language chosen before", async ({ request }) => {
    expect(
      await redirect(request, "/", {
        "Accept-Language": "hi-IN",
        Cookie: "lang=en",
      })
    ).toBe("/en")
  })

  test("goes to English otherwise, keeping the rest", async ({ request }) => {
    expect(
      await redirect(request, "/fr/about?x=1", { "Accept-Language": "fr" })
    ).toBe("/en/fr/about")
  })
})

test("opening a page in a language remembers it", async ({ request }) => {
  const response = await request.get("/hi", {
    headers: { "Accept-Language": "en", "Sec-Fetch-Dest": "document" },
    maxRedirects: 0,
  })
  const cookie = response.headers()["set-cookie"] ?? ""
  expect(cookie).toMatch(/^lang=hi;/)
  expect(cookie).toMatch(/SameSite=lax/i)
  expect(cookie).toMatch(/Max-Age=31536000/)
})

for (const locale of LOCALES) {
  test.describe(`/${locale}`, () => {
    // The server's HTML, before any JavaScript: what search engines and a
    // slow phone get first.
    test("its HTML names its language and its alternates", async ({
      request,
    }) => {
      const response = await request.get(`/${locale}`)
      expect(response.status()).toBe(200)
      const html = await response.text()
      expect(html).toContain(`<html lang="${locale}" dir="ltr"`)
      expect(html).toMatch(
        new RegExp(`<link rel="canonical" href="[^"]*/${locale}"`)
      )
      for (const lang of [...LOCALES, "x-default"]) {
        expect(html).toMatch(new RegExp(`hrefLang="${lang}"`))
      }
      expect(html).toMatch(/<meta property="og:image" content="[^"]+"/)
      expect(html).toMatch(
        /<meta property="og:locale" content="[a-z]{2}_[A-Z]{2}"/
      )
    })

    test("has the shell, in its language, and is accessible", async ({
      page,
      browserName,
    }) => {
      await page.goto(`/${locale}`)
      await expect(page.locator("main#main")).toHaveCount(1)
      await expect(page.locator("h1")).toHaveCount(1)
      // The skip link comes first in the tab order (WCAG 2.4.1). Chromium
      // proves it with the keyboard; WebKit, like Safari, skips links on Tab
      // unless the person turns that on, so there it's the first focusable
      // element in the page's order.
      if (browserName === "webkit") {
        await expect(
          page
            .locator(
              "a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])"
            )
            .first()
        ).toHaveAttribute("href", "#main")
      } else {
        await page.keyboard.press("Tab")
        await expect(page.locator(":focus")).toHaveAttribute("href", "#main")
      }
      await expectAccessible(page)
    })
  })
}

test("Hindi pages use the Devanagari font; English pages don't", async ({
  page,
}) => {
  await page.goto("/hi")
  expect(
    await page.evaluate(() => getComputedStyle(document.body).fontFamily)
  ).toMatch(/Noto Sans Devanagari/)
  await page.goto("/en")
  expect(
    await page.evaluate(() => getComputedStyle(document.body).fontFamily)
  ).not.toMatch(/Noto Sans Devanagari/)
})

test("the display menu and the footer switch the language", async ({
  page,
}) => {
  await page.goto("/en")
  await page
    .getByRole("button", { name: "Display: theme and language" })
    .click()
  await page.getByRole("menuitem", { name: "हिन्दी" }).click()
  await expect(page).toHaveURL(/\/hi$/)
  await expect(page.locator("html")).toHaveAttribute("lang", "hi")

  // Remembered: the address without a language now opens in Hindi.
  await page.goto("/")
  await expect(page).toHaveURL(/\/hi$/)

  await page
    .getByRole("contentinfo")
    .getByRole("link", { name: "English" })
    .click()
  await expect(page).toHaveURL(/\/en$/)
})

test("the sitemap lists each page in each language with its alternates", async ({
  request,
}) => {
  const xml = await (await request.get("/sitemap.xml")).text()
  for (const locale of LOCALES) {
    expect(xml).toMatch(new RegExp(`<loc>[^<]*/${locale}</loc>`))
  }
  expect(xml).toMatch(/hreflang="x-default"/)
})

test.describe("an address that matches no page", () => {
  for (const path of ["/en/nothing-here", "/hi/a/b/c"]) {
    test(`${path} answers 404 with the page in every language`, async ({
      request,
    }) => {
      const response = await request.get(path)
      expect(response.status()).toBe(404)
      const html = await response.text()
      expect(html).toContain(`<html lang="en"`)
      expect(html).toMatch(/<h1[^>]*>Page not found<\/h1>/)
      expect(html).toContain("पेज नहीं मिला")
      expect(html).toMatch(/<title>[^<]*Page not found[^<]*<\/title>/)
    })
  }

  test("is accessible", async ({ page }) => {
    await page.goto("/en/nothing-here")
    await expectAccessible(page)
  })
})
