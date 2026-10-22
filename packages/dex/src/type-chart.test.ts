import { describe, expect, it } from "vitest"

import { multiplier } from "./type-chart.ts"
import { TYPE_KEYS, type TypeChart } from "./types.ts"

// A small chart with the entries these tests use; the real one comes from
// the import (types.json).
const empty = Object.fromEntries(
  TYPE_KEYS.map((type) => [type, {}])
) as TypeChart
const chart: TypeChart = {
  ...empty,
  electric: { water: 2, flying: 2, ground: 0, grass: 0.5, electric: 0.5 },
  ground: { electric: 2, flying: 0, grass: 0.5 },
  ice: { dragon: 2, ground: 2, flying: 2, water: 0.5 },
}

describe("multiplier", () => {
  it("is 1 for a type the chart doesn't list", () => {
    expect(multiplier(chart, "normal", ["water"])).toBe(1)
  })

  it("multiplies across two types", () => {
    // Gyarados (Water, Flying) takes four times from Electric.
    expect(multiplier(chart, "electric", ["water", "flying"])).toBe(4)
    // Garchomp (Dragon, Ground) takes four times from Ice.
    expect(multiplier(chart, "ice", ["dragon", "ground"])).toBe(4)
  })

  it("is 0 when either type is immune", () => {
    // Zapdos (Electric, Flying) against Ground: Flying is immune, whatever
    // Electric takes.
    expect(multiplier(chart, "ground", ["electric", "flying"])).toBe(0)
  })

  it("can halve twice", () => {
    expect(multiplier(chart, "electric", ["grass", "electric"])).toBe(0.25)
  })
})
