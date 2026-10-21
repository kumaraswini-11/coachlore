// Renders Coachlore's raster icons (favicon.ico, apple-icon.png) and its
// share image (opengraph-image.png) from the mark in the web app's
// app/icon.svg, the one drawing (a test in apps/web keeps
// components/shell/logo-mark.tsx the same). Run after changing the mark:
// `bun run icons` in this package.
import { Buffer } from "node:buffer"
import { readFileSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import process from "node:process"
import { chromium } from "@playwright/test"

// The web app, by its package name: a declared dependency of this package.
const app = join(
  dirname(createRequire(import.meta.url).resolve("web/package.json")),
  "app"
)

// The mark's paths and dot, as drawn on its 24 × 24 grid in icon.svg.
const source = readFileSync(join(app, "icon.svg"), "utf8")
const paths = [
  ...source.matchAll(/<path[^>]*stroke-width="([\d.]+)"[^>]*d="([^"]+)"/g),
]
const dot = source.match(/<circle[^>]*cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/)
if (paths.length === 0 || !dot) {
  throw new Error("No mark found in app/icon.svg")
}
const MARK = (color) =>
  `<g fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round">${paths
    .map(([, width, d]) => `<path stroke-width="${width}" d="${d}" />`)
    .join(
      ""
    )}</g><circle cx="${dot[1]}" cy="${dot[2]}" r="${dot[3]}" fill="${color}" />`

// A dark tile with the white mark, padded by an eighth on each side.
const tile = (
  size,
  radius
) => `<!doctype html><html><body style="margin:0;background:transparent">
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="${radius}" fill="#0a0a0a" />
    <g transform="translate(4 4)">${MARK("#ffffff")}</g>
  </svg></body></html>`

// The share image: the mark and the name only, so it suits every language.
// Inter, the app's font, from Google Fonts, so it renders the same on any
// machine.
const og = `<!doctype html><html><head>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@700&display=block" rel="stylesheet" />
  <style>
  body { margin: 0; width: 1200px; height: 630px; background: #0a0a0a; color: #fff;
    display: flex; align-items: center; justify-content: center; gap: 56px;
    font-family: Inter, sans-serif; }
  h1 { font-size: 132px; font-weight: 700; margin: 0; letter-spacing: -0.03em }
</style></head><body>
  <svg xmlns="http://www.w3.org/2000/svg" width="176" height="176" viewBox="0 0 24 24">${MARK("#ffffff")}</svg>
  <h1>Coachlore</h1>
</body></html>`

const browser = await chromium.launch()
const page = await browser.newPage()

async function shot(html, width, height, transparent) {
  await page.setViewportSize({ width, height })
  await page.setContent(html, { waitUntil: "networkidle" })
  // In the page, where `document` is: a string, as Playwright allows.
  await page.evaluate("document.fonts.ready")
  return page.screenshot({
    clip: { x: 0, y: 0, width, height },
    omitBackground: transparent,
  })
}

// favicon.ico: PNG images at 16, 32, 48 and 256 px in one ICO file (the
// ICO format stores PNGs as they are).
const sizes = [16, 32, 48, 256]
const images = []
for (const size of sizes) {
  images.push(await shot(tile(size, 7), size, size, true))
}
const header = Buffer.alloc(6 + 16 * sizes.length)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(sizes.length, 4)
let offset = header.length
sizes.forEach((size, i) => {
  const at = 6 + 16 * i
  header.writeUInt8(size === 256 ? 0 : size, at)
  header.writeUInt8(size === 256 ? 0 : size, at + 1)
  header.writeUInt8(0, at + 2)
  header.writeUInt8(0, at + 3)
  header.writeUInt16LE(1, at + 4)
  header.writeUInt16LE(32, at + 6)
  header.writeUInt32LE(images[i].length, at + 8)
  header.writeUInt32LE(offset, at + 12)
  offset += images[i].length
})
writeFileSync(join(app, "favicon.ico"), Buffer.concat([header, ...images]))

// apple-icon.png: square and opaque; iOS rounds the corners itself.
writeFileSync(
  join(app, "apple-icon.png"),
  await shot(tile(180, 0), 180, 180, false)
)

// The share image, 1200 × 630 (Open Graph's recommended size).
writeFileSync(
  join(app, "[lang]", "opengraph-image.png"),
  await shot(og, 1200, 630, false)
)

await browser.close()
process.stdout.write("written\n")
