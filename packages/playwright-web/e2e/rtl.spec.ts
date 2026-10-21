import { expect, test } from "@playwright/test"

// Spec 001, criterion 12: rendered right to left, the shell and every page
// this spec builds keep their layout. v1 has no right-to-left language, so
// `dir="rtl"` is forced on <html>; that checks the CSS (logical properties,
// mirrored icons). Base UI's behaviour comes from its DirectionProvider,
// which the root layout sets from the language (ADR 0007).

const PATHS = [
  "/en",
  "/en/about",
  "/en/legal",
  "/en/offline",
  "/en/dex",
  "/en/dex?view=list&gen=1",
]

for (const width of [360, 1280]) {
  test.describe(`at ${width} px`, () => {
    test.use({ viewport: { width, height: 800 } })

    for (const path of PATHS) {
      test(`${path} keeps its layout right to left`, async ({ page }) => {
        await page.goto(path)
        await page.evaluate(() =>
          document.documentElement.setAttribute("dir", "rtl")
        )

        // Nothing spills sideways.
        const overflow = await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth
        )
        expect(overflow).toBeLessThanOrEqual(0)

        // The name sits at the start, now the right; the theme button at
        // the end, now the left.
        const logo = await page
          .getByRole("link", { name: "Coachlore, home page" })
          .boundingBox()
        const theme = await page
          .getByRole("button", { name: "Dark theme" })
          .boundingBox()
        expect(logo!.x).toBeGreaterThan(theme!.x)
      })
    }
  })
}

test("back and next icons mirror right to left", async ({ page }) => {
  await page.goto("/en/about")
  await page.evaluate(() => document.documentElement.setAttribute("dir", "rtl"))
  const transform = await page
    .locator("[data-slot=breadcrumb-separator] svg")
    .evaluate((icon) => getComputedStyle(icon).rotate)
  expect(transform).toBe("180deg")
})
