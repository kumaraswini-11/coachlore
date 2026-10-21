import { expect, test, type Page } from "@playwright/test"

import { expectAccessible } from "./axe"

// Spec 001, criterion 3: the search palette opens with its button, Ctrl K or
// ⌘ K, and `/`; the "Single-key shortcuts" setting turns `d` and `/` off,
// and is remembered.

const palette = (page: Page) => page.getByRole("dialog", { name: "Search" })
const searchButton = (page: Page) =>
  page.getByRole("button", { name: "Search Pokémon, moves, leagues…" })
const status = (page: Page) => palette(page).locator("p[aria-live=polite]")

// Until React has attached its handlers, a click or a key does nothing, so
// the action is retried until it takes (Playwright's `toPass`). Each try
// waits 5 s: the dialog loads on first open, and a second click before it
// shows would land outside it and close it.
async function untilOpen(page: Page, action: () => Promise<void>) {
  await expect(async () => {
    await action()
    await expect(palette(page)).toBeVisible({ timeout: 5000 })
  }).toPass()
}

test.beforeEach(async ({ page }) => {
  await page.goto("/en")
  await expect(searchButton(page)).toBeVisible()
})

test("opens from its button, and Escape returns focus to it", async ({
  page,
}) => {
  await untilOpen(page, () => searchButton(page).click())
  await expect(page.getByRole("combobox")).toBeFocused()
  await expect(status(page)).toHaveText("Type to search")

  await page.keyboard.press("Escape")
  await expect(palette(page)).toBeHidden()
  await expect(searchButton(page)).toBeFocused()
})

test("opens with Ctrl K or ⌘ K", async ({ page }) => {
  await untilOpen(page, async () => {
    await page.locator("main").click()
    await page.keyboard.press("ControlOrMeta+K")
  })
})

test("opens with /", async ({ page }) => {
  await untilOpen(page, async () => {
    await page.locator("main").click()
    await page.keyboard.press("/")
  })
})

test("says when nothing matches", async ({ page }) => {
  await untilOpen(page, () => searchButton(page).click())
  await page.getByRole("combobox").fill("zzz")
  await expect(status(page)).toHaveText("Nothing matches “zzz”")
})

test("is accessible while open", async ({ page }) => {
  await untilOpen(page, () => searchButton(page).click())
  await expectAccessible(page)
})

test("fills a phone's screen", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await untilOpen(page, () => searchButton(page).click())
  const box = await palette(page).boundingBox()
  expect(box?.width).toBe(360)
  expect(box?.height).toBe(640)
})

test("the setting turns the single-key shortcuts off, and is remembered", async ({
  page,
}) => {
  // Several steps and a reload: a long test.
  test.slow()
  const html = page.locator("html")
  await expect(async () => {
    await page.locator("main").click()
    await page.keyboard.press("d")
    await expect(html).toHaveClass(/\bdark\b/, { timeout: 1000 })
  }).toPass()

  await page
    .getByRole("button", { name: "Display: theme and language" })
    .click()
  await page
    .getByRole("menuitemcheckbox", { name: /Single-key shortcuts/ })
    .click()
  await page.keyboard.press("Escape")

  await page.reload()
  await expect(searchButton(page)).toBeVisible()
  // Ctrl K isn't a single-key shortcut, so it still works; once it does,
  // the page is ready, and `d` and `/` must not.
  await untilOpen(page, () => page.keyboard.press("ControlOrMeta+K"))
  await page.keyboard.press("Escape")
  await expect(palette(page)).toBeHidden()

  await page.locator("main").click()
  const before = await html.getAttribute("class")
  await page.keyboard.press("d")
  await page.keyboard.press("/")
  await expect(palette(page)).toBeHidden()
  expect(await html.getAttribute("class")).toBe(before)
})
