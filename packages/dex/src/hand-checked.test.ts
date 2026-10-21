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

const blank = (key: string): HandChecked => ({
  key,
  where: "",
  checked: false,
  types: [],
  stats: {},
  abilities: [],
})

const FORMS: HandChecked[] = [
  // Spec 002's ten.
  blank("rotom-wash"),
  blank("urshifu-rapid-strike"),
  blank("lycanroc-dusk"),
  blank("toxtricity-low-key"),
  blank("indeedee-female"),
  blank("tauros-paldea-aqua-breed"),
  blank("ogerpon-wellspring-mask"),
  blank("ninetales-alola"),
  // Charizard, and its Mega forms marked battle-only.
  blank("charizard"),
  { ...blank("charizard-mega-x"), isBattleOnly: true },
  { ...blank("charizard-mega-y"), isBattleOnly: true },
  // Vivillon: one form; its wing patterns are cosmetic, not forms.
  blank("vivillon"),
  // Spec 004's ten, less the two above (Charizard, Rotom-Wash).
  blank("pikachu"),
  blank("rotom"),
  blank("urshifu-single-strike"),
  blank("meowth-galar"),
  blank("tauros-paldea-combat-breed"),
  blank("garchomp"),
  blank("eevee"),
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
