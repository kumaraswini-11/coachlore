import { expect, test } from "@playwright/test"

// Spec 001, criterion 6: keyboard-only use reaches everything in the shell,
// in order, and its menu works from the keyboard.

test("the shell, in tab order, from the keyboard alone", async ({
  page,
  browserName,
}) => {
  // WebKit, like Safari by default, moves focus with Tab through fields
  // only; the keyboard path is proved in Chromium.
  test.skip(browserName === "webkit", "Tab skips links in WebKit")

  await page.goto("/en/about")
  const order = [
    page.getByRole("link", { name: "Skip to content" }),
    page.getByRole("link", { name: "Coachlore, home page" }),
    page.getByRole("button", { name: "Search Pokémon, moves, leagues…" }),
    page.getByRole("button", { name: "Display: theme and language" }),
  ]
  for (const target of order) {
    await page.keyboard.press("Tab")
    await expect(target).toBeFocused()
  }

  // The display menu: open, move, close, and back to its button.
  const display = order[3]!
  await expect(async () => {
    await page.keyboard.press("Enter")
    await expect(page.getByRole("menu")).toBeVisible({ timeout: 2000 })
  }).toPass()
  // Opened from the keyboard, the menu puts focus on an item.
  await expect(page.locator("[role^=menuitem]:focus")).toHaveCount(1)
  await page.keyboard.press("ArrowDown")
  await expect(page.locator("[role^=menuitem]:focus")).toHaveCount(1)
  await page.keyboard.press("Escape")
  await expect(page.getByRole("menu")).toBeHidden()
  await expect(display).toBeFocused()

  // The skip link takes focus to the page's content.
  await page.keyboard.press("Shift+Tab")
  await page.keyboard.press("Shift+Tab")
  await page.keyboard.press("Shift+Tab")
  await expect(order[0]!).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(page.locator("main#main")).toBeFocused()
})
