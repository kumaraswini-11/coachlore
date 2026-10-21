/// <reference types="node" />
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { Generations } from "@pkmn/data"
import { Dex } from "@pkmn/dex"
import { describe, expect, it } from "vitest"

import type { FormSummary, ShowdownNames } from "../../src/types.ts"

// Spec 002, criterion 2, on the committed dataset: every species and forme
// the battle simulator allows in Generation 9 maps to exactly one form.
const data = join(import.meta.dirname, "..", "..", "data")
const imported = existsSync(join(data, "showdown.json"))
const read = <T>(name: string): T =>
  JSON.parse(readFileSync(join(data, name), "utf8")) as T

describe.skipIf(!imported)("Showdown's names, on the dataset", () => {
  it("maps every Generation 9 species and forme to one form", () => {
    const showdown = read<ShowdownNames>("showdown.json")
    const forms = new Set(
      read<FormSummary[]>("forms.json").map((form) => form.key)
    )
    const unmapped = [...new Generations(Dex).get(9).species]
      .filter((species) => !forms.has(showdown.ids[species.id] ?? ""))
      .map((species) => species.name)
    expect(unmapped).toEqual([])
  })

  it("flags Generation 9 and tags as the simulator does", () => {
    const forms = read<FormSummary[]>("forms.json")
    const form = (key: string) => forms.find((each) => each.key === key)
    expect(form("koraidon")).toMatchObject({
      gen9: true,
      tags: ["Restricted Legendary"],
    })
    expect(form("mew")).toMatchObject({ gen9: true, tags: ["Mythical"] })
    expect(form("charizard-mega-x")).toMatchObject({ gen9: false })
  })
})
