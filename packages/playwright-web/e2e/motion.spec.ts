import { expect, test, type Locator } from "@playwright/test"

// Spec 001, criterion 7: with reduced motion on, nothing moves across the
// screen; what opens appears in place.

test.use({ reducedMotion: "reduce" })

/** The element's position, sampled while it opens. */
async function positions(locator: Locator) {
  const seen: Array<{ x: number; y: number }> = []
  for (let i = 0; i < 8; i++) {
    const box = await locator.boundingBox()
    if (box) {
      seen.push({ x: Math.round(box.x), y: Math.round(box.y) })
    }
    await locator.page().waitForTimeout(40)
  }
  return seen
}

test("the display menu and the palette open without moving", async ({
  page,
}) => {
  // Two popups, each sampled while it opens: a long test (Playwright's
  // `test.slow()` triples its timeout).
  test.slow()
  await page.goto("/en")

  const trigger = page.getByRole("button", {
    name: "Display: theme and language",
  })
  await expect(async () => {
    await trigger.click()
    await expect(page.getByRole("menu")).toBeVisible({ timeout: 2000 })
  }).toPass()
  const menu = await positions(page.getByRole("menu"))
  expect(new Set(menu.map((p) => `${p.x},${p.y}`)).size).toBe(1)
  await page.keyboard.press("Escape")

  const search = page.getByRole("button", {
    name: "Search Pokémon, moves, leagues…",
  })
  await expect(async () => {
    await search.click()
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 })
  }).toPass()
  const dialog = await positions(page.getByRole("dialog"))
  expect(new Set(dialog.map((p) => `${p.x},${p.y}`)).size).toBe(1)
})
