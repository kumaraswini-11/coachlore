/// <reference types="node" />
import { execFileSync } from "node:child_process"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { gzipSync } from "node:zlib"
import { describe, expect, it } from "vitest"

import { readSources } from "../scripts/fetch.ts"
import { problems, type Dataset } from "../scripts/import/integrity.ts"
import { readLearnset, readPokemon } from "./files.ts"
import {
  abilities,
  credits,
  forms,
  games,
  moves,
  showdown,
  typeChart,
} from "./index.ts"
import type { Learnset, PokemonDetail, Usage } from "./types.ts"

// Spec 002's criteria on the committed dataset (data/).
const PACKAGE = join(import.meta.dirname, "..")
const DATA = join(PACKAGE, "data")
const read = <T>(path: string): T =>
  JSON.parse(readFileSync(join(DATA, path), "utf8")) as T
const each = <T>(folder: string): Record<string, T> =>
  Object.fromEntries(
    readdirSync(join(DATA, folder)).map((name) => [
      name.replace(/\.json$/, ""),
      read<T>(join(folder, name)),
    ])
  )

describe("the committed dataset", () => {
  it("refers to nothing it doesn't have (criterion 3)", () => {
    const dataset: Dataset = {
      forms,
      chart: typeChart,
      moves,
      abilities,
      details: Object.values(each<PokemonDetail>("pokemon")),
      learnsets: each<Learnset>("learnsets"),
      games,
      locations: read("locations.json"),
      showdown,
      usage: read<Usage>("usage.json"),
    }
    expect(problems(dataset)).toEqual([])
  })

  it("keeps the browser's form list within 150 KB gzipped (criterion 6)", () => {
    const size = gzipSync(readFileSync(join(DATA, "forms.json"))).length
    expect(size).toBeLessThanOrEqual(150 * 1024)
  })

  it("credits every source with its licence and version (criterion 9)", () => {
    const sources = readSources()
    for (const source of Object.keys(sources)) {
      const credit = credits.find((each) => each.source === source)
      expect(credit, source).toBeDefined()
      expect(credit?.licence, source).not.toBe("")
      expect(credit?.version, source).not.toBe("")
    }
  })

  it("records when each imported source was last imported (criterion 11)", () => {
    const sources = readSources()
    for (const source of ["api-data", "smogon-usage"] as const) {
      expect(sources[source].imported, source).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})

describe("the entry points", () => {
  it("reads a Pokémon's and a form's file, and nothing outside the data", async () => {
    expect(
      (await readPokemon("rotom"))?.forms.map((form) => form.key)
    ).toContain("rotom-wash")
    expect(await readLearnset("rotom-wash")).toHaveProperty("scarlet-violet")
    expect(await readPokemon("missingno")).toBeUndefined()
    for (const key of [
      "../package",
      "..\\package",
      "Rotom",
      "rotom/../rotom",
      "",
    ]) {
      expect(await readPokemon(key), key).toBeUndefined()
    }
  })

  it("runs in a plain script, with no framework (criterion 7)", () => {
    const output = execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        'import { forms, multiplier, typeChart } from "@workspace/dex"; console.log(forms.length, multiplier(typeChart, "ice", ["dragon", "ground"]))',
      ],
      { cwd: PACKAGE, encoding: "utf8" }
    )
    expect(output.trim()).toBe(`${forms.length} 4`)
  })

  it("keeps the type-chart arithmetic free of the data", () => {
    // What `@workspace/dex/type-chart` imports, followed through: a Client
    // Component that has the chart must not pull in forms.json with it.
    const seen = new Set<string>()
    const visit = (file: string) => {
      if (seen.has(file)) {
        return
      }
      seen.add(file)
      const source = readFileSync(join(PACKAGE, "src", file), "utf8")
      for (const [, path] of source.matchAll(/from "\.\/([^"]+)"/g)) {
        visit(path ?? "")
      }
      expect(source, file).not.toMatch(/\.json"/)
    }
    visit("type-chart.ts")
    expect([...seen]).toEqual(["type-chart.ts", "types.ts"])
  })
})
