import { readFileSync } from "node:fs"
import { join } from "node:path"
import { expect, it } from "vitest"

// The mark is drawn twice: app/icon.svg (a file the browser loads) and
// LogoMark (inline in the top bar). They must stay the same drawing; the
// raster icons are rendered from icon.svg.
it("LogoMark draws the same mark as app/icon.svg", () => {
  const read = (path: string) =>
    readFileSync(join(import.meta.dirname, "..", "..", path), "utf8")
  const paths = (source: string) =>
    [...source.matchAll(/\bd="([^"]+)"/g)].map((match) => match[1])
  const dot = (source: string) =>
    source.match(/cx="([\d.]+)"\s+cy="([\d.]+)"\s+r="([\d.]+)"/)?.slice(1)

  const icon = read("app/icon.svg")
  const component = read("components/shell/logo-mark.tsx")
  expect(paths(component)).toEqual(paths(icon))
  expect(dot(component)).toEqual(dot(icon))
})
