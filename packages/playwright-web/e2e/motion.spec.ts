import { expect, test, type Page } from "@playwright/test"

import { settled } from "./axe"

// Spec 001, criterion 7: with reduced motion on, nothing moves across the
// screen; what opens appears in place.

/** Opens the display menu and samples its position from the click on. */
async function sampleMenuOpening(page: Page) {
  await page.goto("/en")
  const trigger = page.getByRole("button", {
    name: "Display: theme and language",
  })
  // Hydrated first, so the measured click is the one that opens it.
  await expect(async () => {
    await trigger.click()
    await expect(page.getByRole("menu")).toBeVisible({ timeout: 2000 })
  }).toPass()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("menu")).toBeHidden()
  await settled(page)

  await trigger.click()
  const seen = new Set<string>()
  for (let i = 0; i < 12; i++) {
    const box = await page.getByRole("menu").boundingBox()
    if (box) {
      seen.add([box.x, box.y, box.width, box.height].map(Math.round).join(","))
    }
    await page.waitForTimeout(15)
  }
  return seen
}

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" })

  test("the display menu opens in place", async ({ page }) => {
    // Several steps, sampled: a long test.
    test.slow()
    expect((await sampleMenuOpening(page)).size).toBe(1)
  })
})
