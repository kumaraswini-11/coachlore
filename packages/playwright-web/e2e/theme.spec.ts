import { expect, test } from "@playwright/test"

// Spec 001, "The app shell": the theme button switches between light and
// dark, the choice survives a reload, and no single key changes it.

test.use({ colorScheme: "light" })

test("switches between light and dark, and is remembered", async ({ page }) => {
  const html = page.locator("html")
  const button = page.getByRole("button", { name: "Dark theme" })
  await page.goto("/en")
  // Until a press, the page follows the device.
  await expect(html).toHaveClass(/\blight\b/)
  await expect(button).toHaveAttribute("aria-pressed", "false")

  // Until React has attached its handler, a click does nothing.
  await expect(async () => {
    await button.click()
    await expect(html).toHaveClass(/\bdark\b/, { timeout: 2000 })
  }).toPass()
  await expect(button).toHaveAttribute("aria-pressed", "true")

  await page.reload()
  await expect(html).toHaveClass(/\bdark\b/)
  await expect(button).toHaveAttribute("aria-pressed", "true")

  await button.click()
  await expect(html).toHaveClass(/\blight\b/)
  await expect(button).toHaveAttribute("aria-pressed", "false")
})

test("no single key changes it", async ({ page }) => {
  const html = page.locator("html")
  await page.goto("/en")
  await expect(
    page.getByRole("button", { name: "Dark theme" })
  ).toHaveAttribute("aria-pressed", "false")
  await page.locator("main").click()
  await page.keyboard.press("d")
  await expect(html).toHaveClass(/\blight\b/)
})
