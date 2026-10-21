import { expect, test } from "@playwright/test"

// Spec 001, criterion 8: no layout shift on these pages (CLS 0), at a
// phone's width, once fonts and scripts have loaded.

test.use({ viewport: { width: 360, height: 640 } })

const PATHS = [
  "/en",
  "/hi",
  "/en/about",
  "/hi/about",
  "/en/legal",
  "/hi/legal",
  "/en/offline",
  "/en/fixtures/states",
  "/hi/fixtures/states",
]

for (const path of PATHS) {
  test(`${path} doesn't shift`, async ({ page, browserName }) => {
    // Layout-shift entries are a Chromium API.
    test.skip(browserName !== "chromium", "layout-shift is Chromium's")

    await page.addInitScript(() => {
      const w = window as unknown as { __shifts: string[]; __cls: number }
      w.__cls = 0
      w.__shifts = []
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<
          PerformanceEntry & {
            value: number
            hadRecentInput: boolean
            sources: Array<{
              node?: Node
              previousRect: DOMRectReadOnly
              currentRect: DOMRectReadOnly
            }>
          }
        >) {
          if (entry.hadRecentInput) {
            continue
          }
          w.__cls += entry.value
          // What moved, so a failure says where to look.
          for (const source of entry.sources) {
            const element = source.node as Element | undefined
            w.__shifts.push(
              `${element?.nodeName ?? "?"}.${String(element?.className ?? "").slice(0, 50)} "${(element?.textContent ?? "").slice(0, 30)}" y ${source.previousRect.y}→${source.currentRect.y} h ${source.previousRect.height}→${source.currentRect.height}`
            )
          }
        }
      }).observe({ type: "layout-shift", buffered: true })
    })
    await page.goto(path, { waitUntil: "networkidle" })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(500)
    const { cls, shifts } = await page.evaluate(() => {
      const w = window as unknown as { __shifts: string[]; __cls: number }
      return { cls: w.__cls, shifts: w.__shifts }
    })
    expect(cls, shifts.join(" | ")).toBe(0)
  })
}
