import { expect, test } from "@playwright/test"

import { expectAccessible } from "./axe"

// Spec 003, task 3: the Dex browse screen on sample data, and its states,
// for the owner's review (spec 001, "How a screen is built"). The real-data
// tests (dex-filters.spec.ts) come with task 4.

const SECTIONS = {
  en: [
    "Loading, grid",
    "Loading, list",
    "No match",
    "Error",
    "A form without an image",
  ],
  hi: [
    "लोड हो रहा है, ग्रिड",
    "लोड हो रहा है, सूची",
    "कुछ नहीं मिला",
    "गड़बड़ी",
    "बिना तस्वीर वाला रूप",
  ],
}

for (const [locale, sections] of Object.entries(SECTIONS)) {
  test(`/${locale}/fixtures/dex-states shows every state, accessibly`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/fixtures/dex-states`)
    for (const section of sections) {
      await expect(
        page.getByRole("heading", { level: 2, name: section })
      ).toBeVisible()
    }
    await expect(page.getByRole("alert")).not.toHaveCount(0)
    await expectAccessible(page)
  })

  test(`/${locale}/fixtures/dex filters, sorts and is accessible`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/fixtures/dex?view=list&type=steel`)
    await expect(page.getByRole("table")).toBeVisible()
    await expectAccessible(page)
  })
}

test("the sample Dex filters in place, and Back undoes a filter", async ({
  page,
}) => {
  await page.goto("/en/fixtures/dex")
  const count = page.getByRole("status").filter({ hasText: "Pokémon" })
  await expect(count).toHaveText("20 Pokémon")

  await page
    .getByRole("searchbox", { name: "Filter by name or number" })
    .fill("rot")
  await expect(count).toHaveText("1 Pokémon")
  await expect(page).toHaveURL(/\?q=rot$/)
  await page.getByRole("searchbox").fill("")

  const types = page.getByRole("group", { name: "Type" })
  // A wide screen shows the panel; a phone, the drawer.
  if (!(await types.isVisible())) {
    await page.getByRole("button", { name: "Filter", exact: true }).click()
  }
  await types.getByText("Steel", { exact: true }).click()
  await expect(count).toHaveText("8 Pokémon")
  await expect(page).toHaveURL(/\?type=steel$/)
  await types.getByText("Fairy", { exact: true }).click()
  await expect(count).toHaveText("1 Pokémon")

  await page.goBack()
  await expect(page).toHaveURL(/\?type=steel$/)
  await expect(count).toHaveText("8 Pokémon")
})

test("a name in Devanagari says names are searched in English", async ({
  page,
}) => {
  await page.goto("/hi/fixtures/dex?q=%E0%A4%97%E0%A4%BE%E0%A4%B0")
  await expect(
    page.getByRole("heading", { name: "नाम अंग्रेज़ी में खोजे जाते हैं" })
  ).toBeVisible()
})
