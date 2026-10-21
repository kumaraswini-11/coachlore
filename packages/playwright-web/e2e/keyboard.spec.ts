import { expect, test } from "@playwright/test"

// Spec 001, criterion 6: keyboard-only use reaches everything in the shell,
// in order, and its buttons work from the keyboard.

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
    page.getByRole("button", { name: "Search…", exact: true }),
    page.getByRole("link", { name: "Read in हिन्दी" }),
    page.getByRole("button", { name: "Dark theme" }),
  ]
  for (const target of order) {
    await page.keyboard.press("Tab")
    await expect(target).toBeFocused()
  }

  // The theme button: Space presses it, and focus stays on it.
  const theme = order[4]!
  const pressed = (await theme.getAttribute("aria-pressed")) === "true"
  await page.keyboard.press("Space")
  await expect(theme).toHaveAttribute("aria-pressed", String(!pressed))
  await expect(theme).toBeFocused()

  // The skip link takes focus to the page's content.
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press("Shift+Tab")
  }
  await expect(order[0]!).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(page.locator("main#main")).toBeFocused()
})
