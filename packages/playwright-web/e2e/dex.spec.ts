import { expect, test } from "@playwright/test"

import { filterForms, forms, typeChart } from "@workspace/dex"

import { expectAccessible } from "./axe"

// Spec 003, criteria 1 to 4 and 15, on /dex with the real data: the counts
// come from the dataset, worked out here with the package's own filters.

const count = (filter: Parameters<typeof filterForms>[1]) =>
  new Intl.NumberFormat("en").format(
    filterForms(forms, filter, typeChart).length
  )

test("every form has a card with Forms: all (criterion 1)", async ({
  page,
}) => {
  await page.goto("/en/dex?forms=all")
  await expect(
    page.getByRole("status").filter({ hasText: "Pokémon" })
  ).toHaveText(`${new Intl.NumberFormat("en").format(forms.length)} Pokémon`)
})

test("filters give the dataset's counts, and Back undoes one (criteria 2, 3)", async ({
  page,
}) => {
  await page.goto("/en/dex")
  const status = page.getByRole("status").filter({ hasText: "Pokémon" })
  await expect(status).toHaveText(`${count({})} Pokémon`)

  const types = page.getByRole("group", { name: "Type" })
  // A wide screen shows the panel; a phone, the drawer.
  if (!(await types.isVisible())) {
    await page.getByRole("button", { name: "Filter", exact: true }).click()
  }
  await types.getByText("Steel", { exact: true }).click()
  await expect(status).toHaveText(`${count({ type: ["steel"] })} Pokémon`)
  await expect(page).toHaveURL(/\?type=steel$/)
  await types.getByText("Fairy", { exact: true }).click()
  await expect(status).toHaveText(
    `${count({ type: ["steel", "fairy"] })} Pokémon`
  )

  await page.goBack()
  await expect(page).toHaveURL(/\?type=steel$/)
  await expect(status).toHaveText(`${count({ type: ["steel"] })} Pokémon`)
})

test("a view's address opens the same view (criterion 3)", async ({ page }) => {
  await page.goto("/en/dex?weak=ice&resist=electric&view=list&sort=-spe")
  await expect(
    page.getByRole("status").filter({ hasText: "Pokémon" })
  ).toHaveText(`${count({ weak: ["ice"], resist: ["electric"] })} Pokémon`)
  await expect(page.getByRole("table")).toBeVisible()
})

test("filtering asks the server for nothing (criterion 4)", async ({
  page,
}) => {
  await page.goto("/en/dex?forms=all", { waitUntil: "networkidle" })
  const requests: string[] = []
  page.on("request", (request) => {
    // Newly shown cards' sprites load, lazily; nothing else may.
    if (request.resourceType() !== "image") {
      requests.push(request.url())
    }
  })
  await page
    .getByRole("searchbox", { name: "Filter by name or number" })
    .fill("char")
  await expect(
    page.getByRole("status").filter({ hasText: "Pokémon" })
  ).toHaveText(`${count({ q: "char", forms: "all" })} Pokémon`)
  await page.waitForLoadState("networkidle")
  expect(requests).toEqual([])
})

test("a name in Devanagari says names are searched in English (criterion 15)", async ({
  page,
}) => {
  await page.goto("/hi/dex?q=%E0%A4%97%E0%A4%BE%E0%A4%B0")
  await expect(
    page.getByRole("heading", { name: "नाम अंग्रेज़ी में खोजे जाते हैं" })
  ).toBeVisible()
})

for (const path of ["/en/dex", "/hi/dex?view=list&type=steel"]) {
  test(`${path} is accessible`, async ({ page }) => {
    await page.goto(path)
    await expect(
      page.getByRole("status").filter({ hasText: /\d/ })
    ).toBeVisible()
    await expectAccessible(page)
  })
}
