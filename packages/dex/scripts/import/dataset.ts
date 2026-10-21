/// <reference types="node" />
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

import type { Sources } from "../fetch.ts"
import type { ApiData } from "./api-data.ts"
import type { Dataset } from "./integrity.ts"
import { applyOverrides, type Override } from "./overrides.ts"
import {
  importAbilities,
  importChart,
  importForms,
  importMoves,
} from "./steps.ts"
import { stableJson, writeJson } from "./write.ts"

export type Hand = {
  excludedForms: { key: string; reason: string }[]
  overrides: Override[]
}

/** The hand-kept files in `overrides/`. */
export function readHand(dir: string): Hand {
  const read = <T>(name: string): T =>
    JSON.parse(readFileSync(join(dir, name), "utf8")) as T
  return {
    excludedForms: read("excluded-forms.json"),
    overrides: read("overrides.json"),
  }
}

export function importDex(api: ApiData, hand: Hand): Dataset {
  const dataset: Dataset = {
    chart: importChart(api),
    forms: importForms(
      api,
      new Set(hand.excludedForms.map((form) => form.key))
    ),
    moves: importMoves(api),
    abilities: importAbilities(api),
  }
  applyOverrides(
    {
      forms: dataset.forms,
      moves: dataset.moves,
      abilities: dataset.abilities,
    },
    hand.overrides
  )
  return dataset
}

/** The files the import writes, by their path under `data/`. */
export function files(
  dataset: Dataset,
  sources: Sources
): Record<string, unknown> {
  return {
    "forms.json": dataset.forms,
    "types.json": dataset.chart,
    "moves.json": dataset.moves,
    "abilities.json": dataset.abilities,
    "credits.json": credits(sources),
  }
}

export function writeDataset(
  dir: string,
  output: Record<string, unknown>
): void {
  for (const [path, value] of Object.entries(output)) {
    writeJson(join(dir, path), value)
  }
}

/** What a run changes against the files already in `dir`, one line a file. */
export function summary(
  dir: string,
  output: Record<string, unknown>
): string[] {
  return Object.entries(output).map(([path, value]) => {
    const file = join(dir, path)
    const before = existsSync(file) ? readFileSync(file, "utf8") : undefined
    if (before === stableJson(value)) {
      return `${path}: unchanged`
    }
    if (before === undefined || !Array.isArray(value)) {
      return `${path}: ${before === undefined ? "new" : "changed"}`
    }
    const old = new Map(
      (JSON.parse(before) as { key: string }[]).map((item) => [
        item.key,
        stableJson(item),
      ])
    )
    const now = new Map(
      (value as { key: string }[]).map((item) => [item.key, stableJson(item)])
    )
    const added = [...now.keys()].filter((key) => !old.has(key))
    const removed = [...old.keys()].filter((key) => !now.has(key))
    const changed = [...now.keys()].filter(
      (key) => old.has(key) && old.get(key) !== now.get(key)
    )
    const list = (keys: string[]) =>
      keys.length > 10 ? `${keys.slice(0, 10).join(", ")} …` : keys.join(", ")
    return [
      `${path}: ${added.length} added, ${removed.length} removed, ${changed.length} changed`,
      ...(added.length > 0 ? [`  added: ${list(added)}`] : []),
      ...(removed.length > 0 ? [`  removed: ${list(removed)}`] : []),
      ...(changed.length > 0 ? [`  changed: ${list(changed)}`] : []),
    ].join("\n")
  })
}

/** Each source, its licence and the version imported (spec 002, criterion 9). */
function credits(sources: Sources) {
  return [
    {
      source: "api-data",
      name: "PokéAPI",
      link: "https://github.com/PokeAPI/api-data",
      licence: "BSD-3-Clause",
      version: sources["api-data"].commit,
    },
    {
      source: "sprites",
      name: "PokéAPI's sprites",
      link: "https://github.com/PokeAPI/sprites",
      licence: "Pokémon images © The Pokémon Company",
      version: sources.sprites.commit,
    },
    {
      source: "smogon-usage",
      name: "Smogon University's usage statistics",
      link: "https://www.smogon.com/stats/",
      licence: "Credited; no licence stated",
      version: `${sources["smogon-usage"].month}, ${sources["smogon-usage"].formats.join(" and ")} at ${sources["smogon-usage"].cutoff}`,
    },
  ]
}
