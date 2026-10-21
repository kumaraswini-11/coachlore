// Renders Coachlore's raster icons (favicon.ico, apple-icon.png) and its
// share image (opengraph-image.png) from the Playbook mark, the same drawing
// as apps/web/app/icon.svg and components/shell/logo-mark.tsx. Run after
// changing the mark: `bun run icons` in this package.
import { Buffer } from "node:buffer"
import { writeFileSync } from "node:fs"
import { join } from "node:path"
import process from "node:process"
import { chromium } from "@playwright/test"

const app = join(import.meta.dirname, "..", "..", "..", "apps", "web", "app")

const MARK = (color) => `
  <g fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round">
    <path stroke-width="2" d="M12 6.25C9.75 4.75 6.75 4.25 2.75 4.5v14c4-.25 7 .25 9.25 1.75 2.25-1.5 5.25-2 9.25-1.75v-14c-4-.25-7 .25-9.25 1.75z" />
    <path stroke-width="1.75" d="M7.25 14.25C9 10 14 9.25 16.5 11.75" />
    <path stroke-width="1.75" d="M14 11.5 16.75 12 17 9.25" />
  </g>
  <circle cx="6.5" cy="15" r="1.5" fill="${color}" />`

// A dark tile with the white mark, padded by a sixth on each side.
const tile = (
  size,
  radius
) => `<!doctype html><html><body style="margin:0;background:transparent">
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="${radius}" fill="#0a0a0a" />
    <g transform="translate(4 4)">${MARK("#ffffff")}</g>
  </svg></body></html>`

const og = `<!doctype html><html><head><style>
  body { margin: 0; width: 1200px; height: 630px; background: #0a0a0a; color: #fff;
    display: flex; align-items: center; gap: 96px; padding-inline-start: 136px;
    box-sizing: border-box; font-family: "Segoe UI", Inter, system-ui, sans-serif; }
  h1 { font-size: 104px; font-weight: 700; margin: 0; letter-spacing: -0.02em; line-height: 1.1 }
  p { font-size: 40px; color: #a1a1aa; margin: 12px 0 0 }
</style></head><body>
  <svg xmlns="http://www.w3.org/2000/svg" width="168" height="168" viewBox="0 0 24 24">${MARK("#ffffff")}</svg>
  <div><h1>Coachlore</h1><p>Pokédex and draft leagues</p></div>
</body></html>`

const browser = await chromium.launch()
const page = await browser.newPage()

async function shot(html, width, height, transparent) {
  await page.setViewportSize({ width, height })
  await page.setContent(html)
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
