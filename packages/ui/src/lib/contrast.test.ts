// Node's types for this test alone: the package's code runs in the browser.
/// <reference types="node" />
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import { POKEMON_TYPES, type PokemonType } from "@workspace/ui/lib/type-colors"

// Every text pair in the theme, recomputed from globals.css itself, so a
// changed token can't quietly fail WCAG 2.2's contrast minimums: 4.5:1 for
// text (1.4.3) and 3:1 for the focus ring (1.4.11).

const css = readFileSync(
  new URL("../styles/globals.css", import.meta.url),
  "utf8"
)

/** The custom properties declared in one block, such as `:root` or `.dark`. */
function block(selector: string): Record<string, string> {
  const start = css.indexOf(`\n${selector} {`)
  if (start === -1) {
    throw new Error(`No ${selector} block in globals.css`)
  }
  const body = css.slice(start, css.indexOf("\n}", start))
  return Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [
      name,
      value?.trim(),
    ])
  )
}

type Rgba = { r: number; g: number; b: number; alpha: number }

const toLinear = (channel: number) =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
const fromLinear = (channel: number) =>
  channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055
const clamp = (channel: number) => Math.min(1, Math.max(0, channel))

/**
 * A hex or OKLCH colour as gamma-encoded sRGB, through Björn Ottosson's
 * OKLab formulas (https://bottosson.github.io/posts/oklab/).
 */
function parse(value: string): Rgba {
  const hex = /^#([0-9a-f]{6})$/i.exec(value)?.[1]
  if (hex) {
    const n = parseInt(hex, 16)
    return {
      r: (n >> 16) / 255,
      g: ((n >> 8) & 255) / 255,
      b: (n & 255) / 255,
      alpha: 1,
    }
  }

  const oklch = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+)%)?\)$/.exec(
    value
  )
  if (!oklch) {
    throw new Error(`Can't read the colour ${value}`)
  }
  const [lightness = 0, chroma = 0, hue = 0] = oklch.slice(1, 4).map(Number)
  const a = chroma * Math.cos((hue * Math.PI) / 180)
  const b = chroma * Math.sin((hue * Math.PI) / 180)
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3
  return {
    r: fromLinear(
      clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)
    ),
    g: fromLinear(
      clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)
    ),
    b: fromLinear(
      clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)
    ),
    alpha: oklch[4] === undefined ? 1 : Number(oklch[4]) / 100,
  }
}

/** A colour drawn at `alpha` over an opaque one. */
function over(top: Rgba, bottom: Rgba, alpha = top.alpha): Rgba {
  const mix = (t: number, u: number) => t * alpha + u * (1 - alpha)
  return {
    r: mix(top.r, bottom.r),
    g: mix(top.g, bottom.g),
    b: mix(top.b, bottom.b),
    alpha: 1,
  }
}

function luminance({ r, g, b }: Rgba) {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

/** WCAG's contrast ratio between two opaque colours. */
function contrast(first: Rgba, second: Rgba) {
  const [x, y] = [luminance(first), luminance(second)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

// [text, background]: each foreground on its own colour, and the colours
// that are also used as text on the page.
const TEXT_PAIRS = [
  ["foreground", "background"],
  ["card-foreground", "card"],
  ["popover-foreground", "popover"],
  ["primary-foreground", "primary"],
  ["secondary-foreground", "secondary"],
  ["muted-foreground", "muted"],
  ["muted-foreground", "background"],
  ["accent-foreground", "accent"],
  ["destructive", "background"],
  ["success-foreground", "success"],
  ["success", "background"],
  ["warning-foreground", "warning"],
  ["warning", "background"],
  ["sidebar-foreground", "sidebar"],
  ["sidebar-primary-foreground", "sidebar-primary"],
  ["sidebar-accent-foreground", "sidebar-accent"],
  ...POKEMON_TYPES.map(
    (type: PokemonType) => [`type-${type}-foreground`, `type-${type}`] as const
  ),
] as const

const light = block(":root")
const THEMES = {
  light,
  // Dark redeclares what changes; the rest (the type colours) is shared.
  dark: { ...light, ...block(".dark") },
}

describe.each(Object.entries(THEMES))("the %s theme", (_, tokens) => {
  const color = (name: string) => {
    const value = tokens[name]
    if (value === undefined) {
      throw new Error(`No --${name} token`)
    }
    return parse(value)
  }

  it.each(TEXT_PAIRS)("%s on %s reaches 4.5:1", (text, background) => {
    const ground = color(background)
    expect(contrast(over(color(text), ground), ground)).toBeGreaterThanOrEqual(
      4.5
    )
  })

  it("draws the focus ring at 3:1 or more", () => {
    // globals.css draws it at 50% (`outline-ring/50`).
    const ground = color("background")
    expect(
      contrast(over(color("ring"), ground, 0.5), ground)
    ).toBeGreaterThanOrEqual(3)
  })
})
