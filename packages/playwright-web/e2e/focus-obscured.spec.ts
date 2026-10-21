import { expect, test } from "@playwright/test"

// Spec 001, criterion 9: at 360 × 640, tabbing down a long list keeps the
// focused row in view, never under the sticky top bar (WCAG 2.4.11).

test.use({ viewport: { width: 360, height: 640 } })

test("tabbing down a long list never hides a row under the top bar", async ({
  page,
  browserName,
}) => {
  // WebKit, like Safari by default, moves focus with Tab through text fields
  // only; the keyboard path is proved in Chromium.
  test.skip(browserName === "webkit", "Tab skips buttons in WebKit")

  await page.goto("/en/fixtures/list")
  const header = await page.locator("header").boundingBox()
  const rows = page.locator("[data-slot=item]")
  await expect(rows).toHaveCount(40)

  await rows.first().focus()
  for (let index = 1; index < 40; index++) {
    await page.keyboard.press("Tab")
    await expect(rows.nth(index)).toBeFocused()
    const box = await rows.nth(index).boundingBox()
    expect(box!.y, `row ${index + 1}`).toBeGreaterThanOrEqual(
      header!.y + header!.height - 1
    )
    expect(box!.y + box!.height, `row ${index + 1}`).toBeLessThanOrEqual(640)
  }

  // And back up: shift-tab keeps rows clear of the top bar too.
  for (let index = 38; index >= 0; index--) {
    await page.keyboard.press("Shift+Tab")
    const box = await rows.nth(index).boundingBox()
    expect(box!.y, `row ${index + 1}`).toBeGreaterThanOrEqual(
      header!.y + header!.height - 1
    )
  }
})
