import { describe, expect, it } from "vitest"

import {
  DEFAULT_SORT,
  dexFilter,
  filterForms,
  sortForms,
  type DexFilter,
} from "./filter.ts"
import { forms, typeChart } from "./index.ts"

// Spec 003, criteria 1 and 2: each filter against what the dataset says,
// worked out here by other means than filterForms.
const keys = (filter: DexFilter) =>
  filterForms(forms, filter, typeChart).map((form) => form.key)
const defaults = forms.filter((form) => form.isDefault)

describe("filterForms", () => {
  it("shows default forms only, unless the Forms filter says otherwise", () => {
    expect(keys({})).toHaveLength(defaults.length)
    expect(keys({ forms: "all" })).toHaveLength(forms.length)
    expect(keys({ forms: "mega" })).toEqual(
      forms.filter((form) => form.kind === "mega").map((form) => form.key)
    )
    expect(keys({ forms: "regional" })).toContain("ninetales-alola")
  })

  it("matches a name containing the text, or a national number", () => {
    expect(keys({ q: "rot" })).toEqual(
      defaults
        .filter((form) => form.name.toLowerCase().includes("rot"))
        .map((form) => form.key)
    )
    expect(keys({ q: "ROTOM" })).toContain("rotom")
    expect(keys({ q: "479" })).toEqual(["rotom"])
    expect(keys({ q: "#445" })).toEqual(["garchomp"])
    expect(keys({ q: "rotom-w", forms: "all" })).toEqual(["rotom-wash"])
    // As search matches: without accents, a space for a hyphen.
    expect(keys({ q: "flabebe" })).toEqual(["flabebe"])
    expect(keys({ q: "rotom wash", forms: "all" })).toEqual(["rotom-wash"])
  })

  it("keeps forms with every chosen type", () => {
    const result = keys({ type: ["steel", "fairy"] })
    expect(result).toEqual(
      defaults
        .filter(
          (form) => form.types.includes("steel") && form.types.includes("fairy")
        )
        .map((form) => form.key)
    )
    expect(result).toContain("magearna")
  })

  it("finds weaknesses and resistances by the forms' types alone", () => {
    // Garchomp is Dragon and Ground: four times weak to Ice, immune to
    // Electric (which counts as resisting it).
    expect(keys({ weak: ["ice"] })).toContain("garchomp")
    expect(keys({ resist: ["electric"] })).toContain("garchomp")
    expect(keys({ weak: ["electric"] })).not.toContain("garchomp")
    // Every Water and Flying form takes four times from Electric.
    expect(keys({ type: ["water", "flying"], weak: ["electric"] })).toEqual(
      keys({ type: ["water", "flying"] })
    )
  })

  it("filters by game, generation and ability", () => {
    expect(keys({ game: "scarlet-violet", forms: "all" })).toEqual(
      forms
        .filter((form) => form.games.includes("scarlet-violet"))
        .map((form) => form.key)
    )
    expect(keys({ gen: [1] })).toHaveLength(151)
    expect(keys({ gen: [8, 9] })).toEqual(
      defaults.filter((form) => form.generation >= 8).map((form) => form.key)
    )
    // Hidden or not: Rough Skin is Garchomp's hidden ability.
    expect(keys({ ability: "rough-skin" })).toContain("garchomp")
  })

  it("keeps each chosen stat within its range, the ends included", () => {
    const fast = keys({ stats: { speed: { min: 150 } } })
    expect(fast).toEqual(
      defaults.filter((form) => form.stats.speed >= 150).map((form) => form.key)
    )
    expect(keys({ stats: { total: { min: 600, max: 600 } } })).toContain(
      "garchomp"
    )
    expect(keys({ stats: { hp: { max: 1 } } })).toEqual(["shedinja"])
  })
})

describe("sortForms", () => {
  it("sorts by number by default, and by a stat either way", () => {
    expect(sortForms(defaults, DEFAULT_SORT)[0]?.key).toBe("bulbasaur")
    const bySpeed = sortForms(defaults, { key: "speed", descending: true })
    expect(bySpeed[0]?.stats.speed).toBe(
      Math.max(...defaults.map((form) => form.stats.speed))
    )
    const byTotal = sortForms(defaults, { key: "total", descending: false })
    expect(byTotal[0]?.statTotal).toBe(
      Math.min(...defaults.map((form) => form.statTotal))
    )
  })

  it("sorts by name alphabetically, keeping ties in number order", () => {
    const byName = sortForms(defaults, { key: "name", descending: false })
    expect(byName[0]?.name).toBe("Abomasnow")
    const ties = sortForms(defaults, { key: "hp", descending: false }).filter(
      (form) => form.stats.hp === 50
    )
    expect(ties.map((form) => form.number)).toEqual(
      [...ties].map((form) => form.number).sort((a, b) => a - b)
    )
  })
})

describe("dexFilter", () => {
  it("refuses what isn't a filter", () => {
    expect(
      dexFilter.safeParse({ type: ["fire", "water", "grass"] }).success
    ).toBe(false)
    expect(dexFilter.safeParse({ type: ["plasma"] }).success).toBe(false)
    expect(dexFilter.safeParse({ gen: [10] }).success).toBe(false)
    expect(dexFilter.safeParse({ type: ["fire"], gen: [9] }).success).toBe(true)
  })
})
