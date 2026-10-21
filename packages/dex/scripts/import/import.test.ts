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
// Tauros, Rotom, Vivillon and Urshifu with their evolution chains, eight
// moves, their abilities, every game.
const api = new ApiData(
  join(import.meta.dirname, "..", "..", "test", "fixtures", "api-data")
)
const hand: Hand = {
  excludedForms: [{ key: "raticate-totem-alola", reason: "A Totem Pokémon" }],
  overrides: [],
  // Not a real exclusive (Combat Breed is in both versions): here only to
  // test that one reaches the Pokédex.
  exclusives: [
    {
      game: "scarlet-violet",
      link: "https://bulbapedia.bulbagarden.net/wiki/Version-exclusive_Pok%C3%A9mon",
      forms: { "tauros-paldea-combat-breed": "scarlet" },
    },
  ],
}
const dataset = importDex(api, hand)
const form = (key: string) => dataset.forms.find((each) => each.key === key)
const move = (key: string) => dataset.moves.find((each) => each.key === key)
const detail = (key: string) => dataset.details.find((each) => each.key === key)
const game = (key: string) => dataset.games.find((each) => each.key === key)

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
    const list = (dir: string) =>
      readdirSync(dir, { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => join(entry.parentPath, entry.name).slice(dir.length))
        .sort()
    const names = list(first ?? "")
    expect(names.length).toBeGreaterThan(0)
    expect(names).toEqual(list(second ?? ""))
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
      "charmander",
      "charmeleon",
      "charizard",
      "charizard-gmax",
      "charizard-mega-x",
      "charizard-mega-y",
      "rattata",
      "rattata-alola",
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
      "scatterbug",
      "spewpa",
      "vivillon",
      "kubfu",
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

  it("flattens an evolution chain, each step with its method as data", () => {
    expect(detail("charizard")?.evolution).toEqual([
      { from: null, to: "charmander", trigger: null, conditions: {} },
      {
        from: "charmander",
        to: "charmeleon",
        trigger: "level-up",
        conditions: { min_level: 16 },
      },
      {
        from: "charmeleon",
        to: "charizard",
        trigger: "level-up",
        conditions: { min_level: 36 },
      },
    ])
    // Generation 9's way, the default: one step for each form it can become.
    expect(detail("urshifu")?.evolution.slice(1)).toEqual([
      {
        from: "kubfu",
        to: "urshifu",
        trigger: "use-item",
        conditions: {
          evolved_pokemon_form: "urshifu-single-strike",
          item: "scroll-of-darkness",
        },
      },
      {
        from: "kubfu",
        to: "urshifu",
        trigger: "use-item",
        conditions: {
          evolved_pokemon_form: "urshifu-rapid-strike",
          item: "scroll-of-waters",
        },
      },
    ])
  })

  it("keeps the English entries and every language's name", () => {
    const charizard = detail("charizard")
    expect(charizard?.category).toBe("Flame Pokémon")
    expect(charizard?.names.en).toBe("Charizard")
    expect(charizard?.names.ja).toBeDefined()
    expect(charizard?.names).not.toHaveProperty("hi")
    expect(charizard?.entries.length).toBeGreaterThan(0)
    for (const entry of charizard?.entries ?? []) {
      // One line, single-spaced: the games' line breaks and form feeds gone.
      expect(entry.text).toBe(entry.text.replace(/\s+/g, " ").trim())
    }
  })

  it("groups a learnset by game, levels in order, methods named", () => {
    expect(dataset.learnsets.charizard?.["scarlet-violet"]).toEqual([
      ["ember", "level", 1],
      ["earthquake", "machine"],
      ["tera-blast", "machine"],
    ])
    // No Shadow move is ever learned: they're left out with the moves.
    for (const rows of Object.values(dataset.learnsets).flatMap((learned) =>
      Object.values(learned)
    )) {
      expect(rows.map(([key]) => key)).not.toContain("shadow-rush")
    }
  })

  it("lists a game's Pokédexes in its order, each species as its native form", () => {
    const sv = game("scarlet-violet")
    expect(sv?.name).toBe("Scarlet and Violet")
    expect(sv?.versions.map((version) => version.key)).toEqual([
      "scarlet",
      "violet",
    ])
    expect(sv?.pokedexes.map((pokedex) => pokedex.key)).toEqual([
      "paldea",
      "kitakami",
      "blueberry",
    ])
    // Paldea's Tauros is its Combat Breed, the lowest ID of its breeds.
    expect(sv?.pokedexes[0]?.entries).toContainEqual({
      form: "tauros-paldea-combat-breed",
      regionalNumber: 223,
      onlyIn: "scarlet",
    })
    expect(form("tauros-paldea-combat-breed")?.games).toContain(
      "scarlet-violet"
    )
    expect(form("tauros")?.games).not.toContain("scarlet-violet")
  })

  it("keeps where a form is found, by version, and marks the games covered", () => {
    const raticate = detail("raticate")?.forms.find(
      (each) => each.key === "raticate"
    )
    const crystal = raticate?.encounters.crystal ?? []
    expect(crystal.length).toBeGreaterThan(0)
    for (const row of crystal) {
      expect(dataset.locations[row.location]).toBeTruthy()
      expect(row.minLevel).toBeLessThanOrEqual(row.maxLevel)
    }
    expect(game("crystal")?.encountersCovered).toBe(true)
    // The source has no encounters for Scarlet and Violet.
    expect(game("scarlet-violet")?.encountersCovered).toBe(false)
  })

  it("fails on an exclusive for a game the source doesn't have", () => {
    expect(() =>
      importDex(api, {
        ...hand,
        exclusives: [
          { game: "pokemon-z", link: "https://example.com", forms: {} },
        ],
      })
    ).toThrow("pokemon-z")
  })
})
