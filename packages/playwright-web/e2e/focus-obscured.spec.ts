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

  // The Dex's list: a long table under the sticky top bar, one link a row.
  // Generation I's 151 rows: long enough, and a page small enough for the
  // test's trace to snapshot quickly at every step.
  await page.goto("/en/dex?view=list&gen=1")
  const header = await page.locator("header").boundingBox()
  const rows = page.getByRole("table").getByRole("link")
  await expect(rows.nth(39)).toBeVisible()
  // The first 40 rows' addresses, read once: finding the nth of 1,025 links
  // on each step is slow, so each step reads the focused element instead.
  const hrefs = (await rows.evaluateAll((links) =>
    links.slice(0, 40).map((link) => link.getAttribute("href"))
  )) as string[]
  const focused = () =>
    page.evaluate(() => {
      const element = document.activeElement
      const box = element?.getBoundingClientRect()
      return {
        href: element?.getAttribute("href") ?? null,
        top: box?.top ?? 0,
        bottom: box?.bottom ?? 0,
      }
    })
  const barBottom = header!.y + header!.height - 1

  await rows.first().focus()
  for (let index = 1; index < 40; index++) {
    await page.keyboard.press("Tab")
    const row = await focused()
    expect(row.href, `row ${index + 1}`).toBe(hrefs[index])
    expect(row.top, `row ${index + 1}`).toBeGreaterThanOrEqual(barBottom)
    expect(row.bottom, `row ${index + 1}`).toBeLessThanOrEqual(640)
  }

  // And back up: shift-tab keeps rows clear of the top bar too.
  for (let index = 38; index >= 0; index--) {
    await page.keyboard.press("Shift+Tab")
    const row = await focused()
    expect(row.href, `row ${index + 1}`).toBe(hrefs[index])
    expect(row.top, `row ${index + 1}`).toBeGreaterThanOrEqual(barBottom)
  }
})
