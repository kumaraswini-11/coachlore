// Node's types for this test alone: the package itself is DOM- and Node-free.
/// <reference types="node" />
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import type { FormSummary, StatKey, TypeKey } from "./types.ts"

// Spec 002, criterion 1: ten forms checked by hand against the games, by the
// owner, so an import mistake can't check itself. Fill in a record from the
// games' data (or a trusted reference you note in `where`), set `checked`
// to true, and the test compares it with the imported forms.json. Records
// not yet checked show as todos.

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
}

const blank = (key: string): HandChecked => ({
  key,
  where: "",
  checked: false,
  types: [],
  stats: {},
  abilities: [],
})

const TEN: HandChecked[] = [
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
]

const formsFile = join(import.meta.dirname, "..", "data", "forms.json")

describe("ten forms checked by hand", () => {
  for (const record of TEN) {
    if (!record.checked) {
      it.todo(`${record.key}: the owner records it from the games`)
      continue
    }
    it(`${record.key} matches what the owner checked (${record.where})`, () => {
      expect(existsSync(formsFile), "run the import first").toBe(true)
      const forms = JSON.parse(readFileSync(formsFile, "utf8")) as FormSummary[]
      const form = forms.find((candidate) => candidate.key === record.key)
      expect(form, record.key).toBeDefined()
      expect(form?.types).toEqual(record.types)
      expect(form?.stats).toMatchObject(record.stats)
      expect(form?.abilities).toEqual(record.abilities)
      if (record.isBattleOnly !== undefined) {
        expect(form?.isBattleOnly).toBe(record.isBattleOnly)
      }
    })
  }

  it("lists Vivillon's patterns as one form", () => {
    if (!existsSync(formsFile)) {
      return
    }
    const forms = JSON.parse(readFileSync(formsFile, "utf8")) as FormSummary[]
    expect(forms.filter((form) => form.pokemon === "vivillon")).toHaveLength(1)
  })
})
