/// <reference types="node" />
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterAll, describe, expect, it } from "vitest"

import { multiplier } from "../../src/type-chart.ts"
import { readSources } from "../fetch.ts"
import { ApiData } from "./api-data.ts"
import { files, importDex, writeDataset, type Hand } from "./dataset.ts"
import { problems } from "./integrity.ts"

// The committed sample (scripts/make-fixture.ts): Charizard, Raticate,
// Tauros, Rotom, Vivillon and Urshifu, eight moves, their abilities.
const api = new ApiData(
  join(import.meta.dirname, "..", "..", "test", "fixtures", "api-data")
)
const hand: Hand = {
  excludedForms: [{ key: "raticate-totem-alola", reason: "A Totem Pokémon" }],
  overrides: [],
}
const dataset = importDex(api, hand)
const form = (key: string) => dataset.forms.find((each) => each.key === key)
const move = (key: string) => dataset.moves.find((each) => each.key === key)

const work = mkdtempSync(join(tmpdir(), "dex-import-"))
afterAll(() => {
  rmSync(work, { recursive: true, force: true })
})

describe("the import, on the sample", () => {
  it("gives identical bytes when run twice (criterion 4)", () => {
    const [first, second] = ["first", "second"].map((name) => {
      const dir = join(work, name)
      writeDataset(dir, files(importDex(api, hand), readSources()))
      return dir
    })
    const names = readdirSync(first ?? "")
    expect(names).toEqual(readdirSync(second ?? ""))
    for (const name of names) {
      expect(readFileSync(join(second ?? "", name), "utf8"), name).toBe(
        readFileSync(join(first ?? "", name), "utf8")
      )
    }
  })

  it("refers to nothing it doesn't have (criterion 3)", () => {
    expect(problems(dataset)).toEqual([])
  })

  it("lists each form once, the default first, excluded forms left out", () => {
    expect(dataset.forms.map((each) => each.key)).toEqual([
      "charizard",
      "charizard-gmax",
      "charizard-mega-x",
      "charizard-mega-y",
      "raticate",
      "raticate-alola",
      "tauros",
      "tauros-paldea-aqua-breed",
      "tauros-paldea-blaze-breed",
      "tauros-paldea-combat-breed",
      "rotom",
      "rotom-fan",
      "rotom-frost",
      "rotom-heat",
      "rotom-mow",
      "rotom-wash",
      "vivillon",
      "urshifu-single-strike",
      "urshifu-rapid-strike",
      "urshifu-rapid-strike-gmax",
      "urshifu-single-strike-gmax",
    ])
    expect(form("raticate-totem-alola")).toBeUndefined()
    // Vivillon's patterns are cosmetic forms, not Pokémon of their own.
    expect(
      dataset.forms.filter((each) => each.pokemon === "vivillon")
    ).toHaveLength(1)
  })

  it("takes the battle-only flag from the form each Pokémon names", () => {
    // pokemon/10009 is Rotom-Wash; pokemon-form/10009 is Unown J.
    expect(form("rotom-wash")).toMatchObject({
      sourceId: 10009,
      isBattleOnly: false,
      types: ["electric", "water"],
      name: "Rotom-Wash",
      formName: "Wash Rotom",
      kind: "other",
    })
    expect(form("charizard-mega-x")).toMatchObject({
      isBattleOnly: true,
      kind: "mega",
      generation: 6,
    })
    expect(form("charizard-gmax")).toMatchObject({ kind: "gigantamax" })
  })

  it("marks regional forms by their form name", () => {
    expect(form("raticate-alola")).toMatchObject({
      kind: "regional",
      generation: 7,
    })
    expect(form("tauros-paldea-aqua-breed")).toMatchObject({ kind: "regional" })
  })

  it("keeps a default form keyed unlike its Pokémon", () => {
    expect(form("urshifu-single-strike")).toMatchObject({
      pokemon: "urshifu",
      isDefault: true,
      name: "Urshifu",
    })
  })

  it("leaves out Shadow moves and keeps what each move's text has", () => {
    expect(move("shadow-rush")).toBeUndefined()
    expect(move("ember")).toMatchObject({
      effectChance: 10,
      category: "special",
    })
    // No short effect: the newest English game text instead.
    expect(move("dire-claw")?.effect).toMatch(/^The user lashes out/)
    // No English text at all: no effect, never an invented one.
    expect(move("blazing-torque")).not.toHaveProperty("effect")
  })

  it("builds the chart for the eighteen types only", () => {
    expect(Object.keys(dataset.chart)).toHaveLength(18)
    expect(multiplier(dataset.chart, "electric", ["water", "flying"])).toBe(4)
    expect(multiplier(dataset.chart, "ground", ["electric", "flying"])).toBe(0)
  })

  it("fails on an excluded form the source doesn't have", () => {
    expect(() =>
      importDex(api, {
        ...hand,
        excludedForms: [{ key: "pikachu-totem", reason: "–" }],
      })
    ).toThrow("pikachu-totem")
  })
})
