import { expect, test, type Page } from "@playwright/test"

import { expectAccessible, settled } from "./axe"

// Spec 001, criterion 3: the search palette opens with its button, Ctrl K or
// ⌘ K, and `/`; the "Single-key shortcuts" setting turns `d` and `/` off,
// and is remembered.

const palette = (page: Page) => page.getByRole("dialog", { name: "Search" })
const searchButton = (page: Page) =>
  page.getByRole("button", { name: "Search Pokémon, moves, leagues…" })
const status = (page: Page) => palette(page).locator("p[aria-live=polite]")

// Until React has attached its handlers, a click does nothing, so the click
// is retried until it takes (Playwright's `toPass`). Each try waits 5 s: the
// dialog loads on first open, and a second click before it shows would land
// outside it and close it. The button only opens, so a retry can't close it.
async function openWithButton(page: Page) {
  await expect(async () => {
    await searchButton(page).click()
    await expect(palette(page)).toBeVisible({ timeout: 5000 })
  }).toPass()
}

/** Opens and closes the palette once: the page is hydrated after. */
async function ready(page: Page) {
  await openWithButton(page)
  await page.keyboard.press("Escape")
  await expect(palette(page)).toBeHidden()
}

test.beforeEach(async ({ page }) => {
  await page.goto("/en")
  await expect(searchButton(page)).toBeVisible()
})

test("opens from its button, and Escape returns focus to it", async ({
  page,
}) => {
  await openWithButton(page)
  await expect(page.getByRole("combobox")).toBeFocused()
  await expect(status(page)).toHaveText("Type to search")

  await page.keyboard.press("Escape")
  await expect(palette(page)).toBeHidden()
  await expect(searchButton(page)).toBeFocused()
})

test("opens with Ctrl K or ⌘ K, and closes with it", async ({ page }) => {
  await ready(page)
  await page.locator("main").click()
  await page.keyboard.press("ControlOrMeta+K")
  await expect(palette(page)).toBeVisible()
  await page.keyboard.press("ControlOrMeta+K")
  await expect(palette(page)).toBeHidden()
})

test("opens with /, and Escape returns focus to where it was", async ({
  page,
}) => {
  await ready(page)
  await page.locator("main").click()
  await expect(page.locator("main")).toBeFocused()
  await page.keyboard.press("/")
  await expect(palette(page)).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.locator("main")).toBeFocused()
})

test("says when nothing matches", async ({ page }) => {
  await openWithButton(page)
  await page.getByRole("combobox").fill("zzz")
  await expect(status(page)).toHaveText("Nothing matches “zzz”")
  // What was typed keeps its own direction.
  await expect(status(page).locator("bdi")).toHaveText("zzz")
})

test("speaks Hindi on Hindi pages", async ({ page }) => {
  await page.goto("/hi")
  const dialog = page.getByRole("dialog", { name: "खोजें" })
  await expect(async () => {
    await page.getByRole("button", { name: "पोकेमॉन, मूव, लीग खोजें…" }).click()
    await expect(dialog).toBeVisible({ timeout: 5000 })
  }).toPass()
  await expect(dialog.locator("p[aria-live=polite]")).toHaveText(
    "खोजने के लिए लिखें"
  )
})

test("is accessible while open", async ({ page }) => {
  await openWithButton(page)
  await expectAccessible(page)
})

test("fills a phone's screen, with a close button of 44 px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await openWithButton(page)
  await settled(page)
  const box = await palette(page).boundingBox()
  expect(box?.width).toBe(360)
  expect(box?.height).toBe(640)
  const close = await palette(page)
    .getByRole("button", { name: "Close search" })
    .boundingBox()
  expect(close?.width).toBeGreaterThanOrEqual(44)
  expect(close?.height).toBeGreaterThanOrEqual(44)
})

test("the setting turns the single-key shortcuts off, and is remembered", async ({
  page,
}) => {
  // Several steps and a reload: a long test.
  test.slow()
  const html = page.locator("html")
  await ready(page)
  await page.locator("main").click()
  await page.keyboard.press("d")
  await expect(html).toHaveClass(/\bdark\b/)

  const display = page.getByRole("button", {
    name: "Display: theme and language",
  })
  const setting = page.getByRole("menuitemcheckbox", {
    name: /Single-key shortcuts/,
  })
  await display.click()
  await setting.click()
  await page.keyboard.press("Escape")

  await page.reload()
  await ready(page)
  await display.click()
  await expect(setting).toHaveAttribute("aria-checked", "false")
  await page.keyboard.press("Escape")

  await page.locator("main").click()
  const before = await html.getAttribute("class")
  await page.keyboard.press("d")
  await page.keyboard.press("/")
  // Had `/` opened the palette, Ctrl K would close it now.
  await page.keyboard.press("ControlOrMeta+K")
  await expect(palette(page)).toBeVisible()
  expect(await html.getAttribute("class")).toBe(before)
})
