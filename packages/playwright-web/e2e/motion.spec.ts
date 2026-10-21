import { expect, test, type Page } from "@playwright/test"

import { settled } from "./axe"

// Spec 001, criterion 7: with reduced motion on, nothing moves across the
// screen; what opens appears in place.

/** Opens the search palette and samples its position from the click on. */
async function samplePaletteOpening(page: Page) {
  await page.goto("/en")
  const trigger = page.getByRole("button", {
    name: "Search Pokémon, moves, leagues…",
  })
  const palette = page.getByRole("dialog", { name: "Search" })
  // Hydrated and loaded first, so the measured click is the one that opens
  // it.
  await expect(async () => {
    await trigger.click()
    await expect(palette).toBeVisible({ timeout: 5000 })
  }).toPass()
  await page.keyboard.press("Escape")
  await expect(palette).toBeHidden()
  await settled(page)

  await trigger.click()
  const seen = new Set<string>()
  for (let i = 0; i < 12; i++) {
    const box = await palette.boundingBox()
    if (box) {
      seen.add([box.x, box.y, box.width, box.height].map(Math.round).join(","))
    }
    await page.waitForTimeout(15)
  }
  return seen
}

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" })

  test("the search palette opens in place", async ({ page }) => {
    // Several steps, sampled: a long test.
    test.slow()
    expect((await samplePaletteOpening(page)).size).toBe(1)
  })
})
