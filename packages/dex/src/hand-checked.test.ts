// Node's types for this test alone: the package itself is DOM- and Node-free.
/// <reference types="node" />
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import type { FormSummary, PokemonDetail, StatKey, TypeKey } from "./types.ts"

// Spec 002's criterion 1 and spec 004's criterion 2: forms checked by hand
// against the games, so an import mistake can't check itself. Fill in a
// record from the games' data (or a trusted reference you note in
// `where`), set `checked` to true, and the test compares it with the
// imported data. Records not yet checked show as todos.

type HandChecked = {
  key: string
  /** Where these values were checked, such as "Scarlet, Pokédex screen". */
  where: string
  checked: boolean
  types: TypeKey[]
  stats: Partial<Record<StatKey, number>>
  /** Ability keys, PokéAPI's names; the hidden one last, marked. */
  abilities: { key: string; hidden: boolean }[]
  isBattleOnly?: boolean
  /**
   * The step into this form's Pokémon: the Pokémon it evolves from (null
   * for the first of its chain) and PokéAPI's trigger ("level-up",
   * "trade", "use-item"). Left out for a battle-only form.
   */
  evolution?: { from: string | null; trigger: string | null }
}

const FORMS: HandChecked[] = [
  // Spec 002's ten.
  {
    key: "rotom-wash",
    where: "Bulbapedia, Rotom (Pokémon)",
    checked: true,
    types: ["electric", "water"],
    stats: {
      hp: 50,
      attack: 65,
      defense: 107,
      "special-attack": 105,
      "special-defense": 107,
      speed: 86,
    },
    abilities: [{ key: "levitate", hidden: false }],
    evolution: { from: null, trigger: null },
  },
  {
    key: "urshifu-rapid-strike",
    where: "Bulbapedia, Urshifu (Pokémon)",
    checked: true,
    types: ["fighting", "water"],
    stats: {
      hp: 100,
      attack: 130,
      defense: 100,
      "special-attack": 63,
      "special-defense": 60,
      speed: 97,
    },
    abilities: [{ key: "unseen-fist", hidden: false }],
    evolution: { from: "kubfu", trigger: "tower-of-waters" },
  },
  {
    key: "lycanroc-dusk",
    where: "Bulbapedia, Lycanroc (Pokémon)",
    checked: true,
    types: ["rock"],
    stats: {
      hp: 75,
      attack: 117,
      defense: 65,
      "special-attack": 55,
      "special-defense": 65,
      speed: 110,
    },
    abilities: [{ key: "tough-claws", hidden: false }],
    evolution: { from: "rockruff", trigger: "level-up" },
  },
  {
    key: "toxtricity-low-key",
    where: "Bulbapedia, Toxtricity (Pokémon)",
    checked: true,
    types: ["electric", "poison"],
    stats: {
      hp: 75,
      attack: 98,
      defense: 70,
      "special-attack": 114,
      "special-defense": 70,
      speed: 75,
    },
    abilities: [
      { key: "punk-rock", hidden: false },
      { key: "minus", hidden: false },
      { key: "technician", hidden: true },
    ],
    evolution: { from: "toxel", trigger: "level-up" },
  },
  {
    key: "indeedee-female",
    where: "Bulbapedia, Indeedee (Pokémon)",
    checked: true,
    types: ["psychic", "normal"],
    stats: {
      hp: 70,
      attack: 55,
      defense: 65,
      "special-attack": 95,
      "special-defense": 105,
      speed: 85,
    },
    abilities: [
      { key: "own-tempo", hidden: false },
      { key: "synchronize", hidden: false },
      { key: "psychic-surge", hidden: true },
    ],
    evolution: { from: null, trigger: null },
  },
  {
    key: "tauros-paldea-aqua-breed",
    where: "Bulbapedia, Tauros (Pokémon)",
    checked: true,
    types: ["fighting", "water"],
    stats: {
      hp: 75,
      attack: 110,
      defense: 105,
      "special-attack": 30,
      "special-defense": 70,
      speed: 100,
    },
    abilities: [
      { key: "intimidate", hidden: false },
      { key: "anger-point", hidden: false },
      { key: "cud-chew", hidden: true },
    ],
    evolution: { from: null, trigger: null },
  },
  {
    key: "ogerpon-wellspring-mask",
    where: "Bulbapedia, Ogerpon (Pokémon)",
    checked: true,
    types: ["grass", "water"],
    stats: {
      hp: 80,
      attack: 120,
      defense: 84,
      "special-attack": 60,
      "special-defense": 96,
      speed: 110,
    },
    abilities: [{ key: "water-absorb", hidden: false }],
    evolution: { from: null, trigger: null },
  },
  {
    key: "ninetales-alola",
    where: "Bulbapedia, Ninetales (Pokémon)",
    checked: true,
    types: ["ice", "fairy"],
    stats: {
      hp: 73,
      attack: 67,
      defense: 75,
      "special-attack": 81,
      "special-defense": 100,
      speed: 109,
    },
    abilities: [
      { key: "snow-cloak", hidden: false },
      { key: "snow-warning", hidden: true },
    ],
    evolution: { from: "vulpix", trigger: "use-item" },
  },
  // Charizard, and its Mega forms marked battle-only.
  {
    key: "charizard",
    where: "Bulbapedia, Charizard (Pokémon)",
    checked: true,
    types: ["fire", "flying"],
    stats: {
      hp: 78,
      attack: 84,
      defense: 78,
      "special-attack": 109,
      "special-defense": 85,
      speed: 100,
    },
    abilities: [
      { key: "blaze", hidden: false },
      { key: "solar-power", hidden: true },
    ],
    evolution: { from: "charmeleon", trigger: "level-up" },
  },
  {
    key: "charizard-mega-x",
    where: "Bulbapedia, Charizard (Pokémon)",
    checked: true,
    types: ["fire", "dragon"],
    stats: {
      hp: 78,
      attack: 130,
      defense: 111,
      "special-attack": 130,
      "special-defense": 85,
      speed: 100,
    },
    abilities: [{ key: "tough-claws", hidden: false }],
    isBattleOnly: true,
  },
  {
    key: "charizard-mega-y",
    where: "Bulbapedia, Charizard (Pokémon)",
    checked: true,
    types: ["fire", "flying"],
    stats: {
      hp: 78,
      attack: 104,
      defense: 78,
      "special-attack": 159,
      "special-defense": 115,
      speed: 100,
    },
    abilities: [{ key: "drought", hidden: false }],
    isBattleOnly: true,
  },
  // Vivillon: one form; its wing patterns are cosmetic, not forms.
  {
    key: "vivillon",
    where: "Bulbapedia, Vivillon (Pokémon)",
    checked: true,
    types: ["bug", "flying"],
    stats: {
      hp: 80,
      attack: 52,
      defense: 50,
      "special-attack": 90,
      "special-defense": 50,
      speed: 89,
    },
    abilities: [
      { key: "shield-dust", hidden: false },
      { key: "compound-eyes", hidden: false },
      { key: "friend-guard", hidden: true },
    ],
    evolution: { from: "spewpa", trigger: "level-up" },
  },
  // Spec 004's ten, less the two above (Charizard, Rotom-Wash).
  {
    key: "pikachu",
    where: "Bulbapedia, Pikachu (Pokémon)",
    checked: true,
    types: ["electric"],
    stats: {
      hp: 35,
      attack: 55,
      defense: 40,
      "special-attack": 50,
      "special-defense": 50,
      speed: 90,
    },
    abilities: [
      { key: "static", hidden: false },
      { key: "lightning-rod", hidden: true },
    ],
    evolution: { from: "pichu", trigger: "level-up" },
  },
  {
    key: "rotom",
    where: "Bulbapedia, Rotom (Pokémon)",
    checked: true,
    types: ["electric", "ghost"],
    stats: {
      hp: 50,
      attack: 50,
      defense: 77,
      "special-attack": 95,
      "special-defense": 77,
      speed: 91,
    },
    abilities: [{ key: "levitate", hidden: false }],
    evolution: { from: null, trigger: null },
  },
  {
    key: "urshifu-single-strike",
    where: "Bulbapedia, Urshifu (Pokémon)",
    checked: true,
    types: ["fighting", "dark"],
    stats: {
      hp: 100,
      attack: 130,
      defense: 100,
      "special-attack": 63,
      "special-defense": 60,
      speed: 97,
    },
    abilities: [{ key: "unseen-fist", hidden: false }],
    evolution: { from: "kubfu", trigger: "tower-of-darkness" },
  },
  {
    key: "meowth-galar",
    where: "Bulbapedia, Meowth (Pokémon)",
    checked: true,
    types: ["steel"],
    stats: {
      hp: 50,
      attack: 65,
      defense: 55,
      "special-attack": 40,
      "special-defense": 40,
      speed: 40,
    },
    abilities: [
      { key: "pickup", hidden: false },
      { key: "tough-claws", hidden: false },
      { key: "unnerve", hidden: true },
    ],
    evolution: { from: null, trigger: null },
  },
  {
    key: "tauros-paldea-combat-breed",
    where: "Bulbapedia, Tauros (Pokémon)",
    checked: true,
    types: ["fighting"],
    stats: {
      hp: 75,
      attack: 110,
      defense: 105,
      "special-attack": 30,
      "special-defense": 70,
      speed: 100,
    },
    abilities: [
      { key: "intimidate", hidden: false },
      { key: "anger-point", hidden: false },
      { key: "cud-chew", hidden: true },
    ],
    evolution: { from: null, trigger: null },
  },
  {
    key: "garchomp",
    where: "Bulbapedia, Garchomp (Pokémon)",
    checked: true,
    types: ["dragon", "ground"],
    stats: {
      hp: 108,
      attack: 130,
      defense: 95,
      "special-attack": 80,
      "special-defense": 85,
      speed: 102,
    },
    abilities: [
      { key: "sand-veil", hidden: false },
      { key: "rough-skin", hidden: true },
    ],
    evolution: { from: "gabite", trigger: "level-up" },
  },
  {
    key: "eevee",
    where: "Bulbapedia, Eevee (Pokémon)",
    checked: true,
    types: ["normal"],
    stats: {
      hp: 55,
      attack: 55,
      defense: 50,
      "special-attack": 45,
      "special-defense": 65,
      speed: 55,
    },
    abilities: [
      { key: "run-away", hidden: false },
      { key: "adaptability", hidden: false },
      { key: "anticipation", hidden: true },
    ],
    evolution: { from: null, trigger: null },
  },
]

const dataDir = join(import.meta.dirname, "..", "data")
const formsFile = join(dataDir, "forms.json")
// Before the first full import (spec 002, task 9) there is nothing to
// compare with, so checked records are skipped rather than failed.
const imported = existsSync(formsFile)

describe("forms checked by hand", () => {
  for (const record of FORMS) {
    if (!record.checked) {
      it.todo(`${record.key}: not yet checked`)
      continue
    }
    it.skipIf(!imported)(`${record.key} matches ${record.where}`, () => {
      const forms = JSON.parse(readFileSync(formsFile, "utf8")) as FormSummary[]
      const form = forms.find((candidate) => candidate.key === record.key)
      expect(form, record.key).toBeDefined()
      expect(form?.types).toEqual(record.types)
      expect(form?.stats).toMatchObject(record.stats)
      expect(form?.abilities).toEqual(record.abilities)
      if (record.isBattleOnly !== undefined) {
        expect(form?.isBattleOnly).toBe(record.isBattleOnly)
      }
      if (record.evolution !== undefined && form !== undefined) {
        const detail = JSON.parse(
          readFileSync(join(dataDir, "pokemon", `${form.pokemon}.json`), "utf8")
        ) as PokemonDetail
        const step = detail.evolution.find((each) => each.to === form.pokemon)
        expect({
          from: step?.from ?? null,
          trigger: step?.trigger ?? null,
        }).toEqual(record.evolution)
      }
    })
  }

  it.skipIf(!imported)("lists Vivillon's patterns as one form", () => {
    const forms = JSON.parse(readFileSync(formsFile, "utf8")) as FormSummary[]
    expect(forms.filter((form) => form.pokemon === "vivillon")).toHaveLength(1)
  })
})
