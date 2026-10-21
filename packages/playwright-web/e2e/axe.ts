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
