import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

// WCAG 2.2 A and AA, and the earlier versions' rules they include.
const WCAG_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22a",
  "wcag22aa",
]

/**
 * Waits until nothing on the page is still animating in. Endless ones (a
 * skeleton's pulse) never finish, so only those that end are waited for.
 */
export async function settled(page: Page) {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter(
          (animation) =>
            animation.effect?.getTiming().iterations !==
            Number.POSITIVE_INFINITY
        )
        .map((animation) => animation.finished)
    )
  )
}

/**
 * Fails on any accessibility violation axe finds on the page, in both
 * themes (spec 001, criterion 6). Axe finds only some problems; the
 * keyboard tests and the owner's review cover the rest.
 */
export async function expectAccessible(page: Page) {
  // Two full axe runs are heavy, slowest in WebKit: Playwright's
  // `test.slow()` gives the test three times its timeout.
  test.slow()

  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme })
    // The app follows the system theme unless a person chose one; wait until
    // it has applied this one, so each scan sees the theme it names.
    await expect(page.locator("html")).toHaveClass(
      new RegExp(`\\b${colorScheme}\\b`)
    )
    // Contrast measured mid-fade is wrong: wait for what's opening to finish.
    await settled(page)
    const { violations } = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .analyze()
    expect(
      violations.map(({ id, help, nodes }) => ({
        colorScheme,
        id,
        help,
        targets: nodes.map((node) => node.target.join(" ")),
      }))
    ).toEqual([])
  }
}
