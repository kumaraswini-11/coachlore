import { expect, test } from "@playwright/test"

import { expectAccessible } from "./axe"

// Spec 001, criterion 4: every state has a fixture page that shows it.

const SECTIONS = {
  en: [
    "Loading",
    "Empty",
    "Error",
    "Not found",
    "Offline",
    "No permission",
    "AI unavailable",
    "Live update",
    "Type badges",
  ],
  hi: [
    "लोड हो रहा है",
    "खाली",
    "एरर",
    "नहीं मिला",
    "ऑफ़लाइन",
    "अनुमति नहीं",
    "AI उपलब्ध नहीं",
    "लाइव अपडेट",
    "टाइप बैज",
  ],
}

for (const [locale, sections] of Object.entries(SECTIONS)) {
  test(`/${locale}/fixtures/states shows every state, accessibly`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/fixtures/states`)
    for (const section of sections) {
      await expect(
        page.getByRole("heading", { level: 2, name: section })
      ).toBeVisible()
    }
    // The error state is announced as an alert (shadcn's Alert is one too).
    await expect(
      page
        .getByRole("alert")
        .filter({ has: page.getByRole("heading", { level: 3 }) })
    ).not.toHaveCount(0)
    await expect(page.locator("[data-type]")).toHaveCount(18)
    await expectAccessible(page)
  })
}

test("a live update appears in place and is announced once", async ({
  page,
}) => {
  await page.goto("/en/fixtures/states")
  const live = page.locator("section p[aria-live=polite]")
  const next = page.getByRole("button", { name: "Show the next pick" })
  await expect(async () => {
    await next.click()
    await expect(live).toHaveText("Ash picked Garchomp", { timeout: 1000 })
  }).toPass()
  // The Pokémon's name keeps its own language and direction.
  await expect(live.locator("bdi[lang=en]")).toHaveText("Garchomp")
  await next.click()
  await expect(live).toHaveText("Misty picked Rotom-Wash")
})
