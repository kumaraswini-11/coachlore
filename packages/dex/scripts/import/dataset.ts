/// <reference types="node" />
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs"
import { dirname, join } from "node:path"

import type { Learnset, PokemonDetail } from "../../src/types.ts"
import type { Sources } from "../fetch.ts"
import type { ApiData, Link } from "./api-data.ts"
import {
  encounters,
  games,
  learnset,
  locationNames,
  pokemonDetail,
  type EncounterEntry,
  type Exclusives,
} from "./details.ts"
import type { Dataset } from "./integrity.ts"
import { applyOverrides, type Override } from "./overrides.ts"
import { matchShowdown, type ShowdownExceptions } from "./showdown.ts"
import {
  importAbilities,
  importChart,
  importForms,
  importMoves,
} from "./steps.ts"
import { importUsage } from "./usage.ts"
import { stableJson, writeJson } from "./write.ts"

export type Hand = {
  excludedForms: { key: string; reason: string }[]
  overrides: Override[]
  exclusives: Exclusives
  showdownExceptions: ShowdownExceptions
}

/** The hand-kept files in `overrides/`. */
export function readHand(dir: string): Hand {
  const read = <T>(name: string): T =>
    JSON.parse(readFileSync(join(dir, name), "utf8")) as T
  return {
    excludedForms: read("excluded-forms.json"),
    overrides: read("overrides.json"),
    exclusives: read("exclusives.json"),
    showdownExceptions: read("showdown-exceptions.json"),
  }
}

type DetailForm = PokemonDetail["forms"][number]
type FormExtras = Pick<DetailForm, "height" | "weight" | "encounters">

type PokemonResource = {
  id: number
  height: number
  weight: number
  moves: Parameters<typeof learnset>[0]
}

/** Smogon's chaos files for one month, by format. */
type UsageFiles = { month: string; files: Record<string, string> }

export function importDex(
  api: ApiData,
  hand: Hand,
  usageFiles: UsageFiles
): Dataset {
  const forms = importForms(
    api,
    new Set(hand.excludedForms.map((form) => form.key))
  )
  const moves = importMoves(api)
  const abilities = importAbilities(api)
  // Step 9 fills each form's `gen9` and `tags`; a name it can't map, or maps
  // to a form with other battle data, is an error, never a guess (spec 002,
  // "A name in a battle log we can't map is an error").
  const match = matchShowdown(forms, moves, abilities, hand.showdownExceptions)
  if (match.unmatched.length > 0 || match.mismatched.length > 0) {
    throw new Error(
      [
        ...match.unmatched.map((name) => `Showdown's ${name} matches no form.`),
        ...match.mismatched.map(
          (pair) => `${pair}: different types or base stats.`
        ),
      ].join("\n")
    )
  }
  applyOverrides({ forms, moves, abilities }, hand.overrides)

  // Steps 7 and 8, form by form: what only each form's own file has.
  const known = new Set(moves.map((move) => move.key))
  const learnsets: Record<string, Learnset> = {}
  const extras = new Map<string, FormExtras>()
  const areas: Link[] = []
  const covered = new Set<string>()
  for (const form of forms) {
    const pokemon = api.get<PokemonResource>("pokemon", form.sourceId)
    learnsets[form.key] = learnset(pokemon.moves, known)
    const found =
      api.optional<EncounterEntry[]>(`pokemon/${pokemon.id}/encounters`) ?? []
    for (const entry of found) {
      areas.push(entry.location_area)
      for (const version of entry.version_details) {
        covered.add(version.version.name)
      }
    }
    extras.set(form.key, {
      height: pokemon.height,
      weight: pokemon.weight,
      encounters: encounters(found),
    })
  }

  // Step 8 fills each form's `games`, so the details are built after it.
  const gameList = games(api, forms, covered, hand.exclusives)
  const details = forms
    .filter((form) => form.isDefault)
    .map((form) =>
      pokemonDetail(
        api,
        form.number,
        forms
          .filter((each) => each.pokemon === form.pokemon)
          .map((each) => {
            const extra = extras.get(each.key)
            if (extra === undefined) {
              throw new Error(`No extras for ${each.key}.`)
            }
            return { ...each, ...extra }
          })
      )
    )

  return {
    chart: importChart(api),
    forms,
    moves,
    abilities,
    details,
    learnsets,
    games: gameList,
    locations: locationNames(api, areas),
    showdown: match.showdown,
    usage: importUsage(usageFiles.month, usageFiles.files, match.showdown),
  }
}

/** The folders that hold one file per Pokémon or per form. */
const PER_ITEM = ["pokemon", "learnsets"]

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
    "games.json": dataset.games,
    "locations.json": dataset.locations,
    "showdown.json": dataset.showdown,
    "usage.json": dataset.usage,
    "credits.json": credits(sources),
    ...Object.fromEntries(
      dataset.details.map((detail) => [`pokemon/${detail.key}.json`, detail])
    ),
    ...Object.fromEntries(
      Object.entries(dataset.learnsets).map(([form, moves]) => [
        `learnsets/${form}.json`,
        moves,
      ])
    ),
  }
}

export function writeDataset(
  dir: string,
  output: Record<string, unknown>
): void {
  for (const [path, value] of Object.entries(output)) {
    writeJson(join(dir, path), value)
  }
  // A Pokémon or form the source no longer has loses its file.
  for (const name of stale(dir, output)) {
    rmSync(join(dir, name))
  }
}

function stale(dir: string, output: Record<string, unknown>): string[] {
  return PER_ITEM.flatMap((folder) =>
    existsSync(join(dir, folder))
      ? readdirSync(join(dir, folder))
          .map((name) => `${folder}/${name}`)
          .filter((path) => !(path in output))
      : []
  )
}

/**
 * What a run changes against the files already in `dir`: a line a file,
 * one for each per-item folder, and the keys added, removed or changed in
 * a list file.
 */
export function summary(
  dir: string,
  output: Record<string, unknown>
): string[] {
  const lines: string[] = []
  const removed = stale(dir, output)
  for (const folder of PER_ITEM) {
    const paths = Object.keys(output).filter((path) => dirname(path) === folder)
    const changed = paths.filter(
      (path) => read(dir, path) !== stableJson(output[path])
    )
    const gone = removed.filter((path) => dirname(path) === folder)
    lines.push(
      `${folder}/: ${paths.length} files, ${changed.length} new or changed, ${gone.length} removed`
    )
  }
  for (const [path, value] of Object.entries(output)) {
    if (PER_ITEM.includes(dirname(path))) {
      continue
    }
    lines.push(listSummary(path, read(dir, path), value))
  }
  return lines
}

function read(dir: string, path: string): string | undefined {
  const file = join(dir, path)
  return existsSync(file) ? readFileSync(file, "utf8") : undefined
}

function listSummary(
  path: string,
  before: string | undefined,
  value: unknown
): string {
  if (before === stableJson(value)) {
    return `${path}: unchanged`
  }
  const hasKeys = (items: unknown): items is { key: string }[] =>
    Array.isArray(items) &&
    items.every((item) => typeof (item as { key?: unknown }).key === "string")
  if (before === undefined || !hasKeys(value)) {
    return `${path}: ${before === undefined ? "new" : "changed"}`
  }
  const keyed = (items: { key: string }[]) =>
    new Map(items.map((item) => [item.key, stableJson(item)]))
  const old = keyed(JSON.parse(before) as { key: string }[])
  const now = keyed(value as { key: string }[])
  const added = [...now.keys()].filter((key) => !old.has(key))
  const gone = [...old.keys()].filter((key) => !now.has(key))
  const changed = [...now.keys()].filter(
    (key) => old.has(key) && old.get(key) !== now.get(key)
  )
  const list = (keys: string[]) =>
    keys.length > 10 ? `${keys.slice(0, 10).join(", ")} …` : keys.join(", ")
  return [
    `${path}: ${added.length} added, ${gone.length} removed, ${changed.length} changed`,
    ...(added.length > 0 ? [`  added: ${list(added)}`] : []),
    ...(gone.length > 0 ? [`  removed: ${list(gone)}`] : []),
    ...(changed.length > 0 ? [`  changed: ${list(changed)}`] : []),
  ].join("\n")
}

/** The battle simulator's data package, at the version package.json pins. */
function pkmnVersion(): string {
  const manifest = JSON.parse(
    readFileSync(join(import.meta.dirname, "..", "..", "package.json"), "utf8")
  ) as { devDependencies: Record<string, string> }
  const version = manifest.devDependencies["@pkmn/dex"]
  if (version === undefined || !/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error("@pkmn/dex must be pinned to an exact version.")
  }
  return version
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
    {
      source: "pkmn-dex",
      name: "Pokémon Showdown's data, through @pkmn/dex",
      link: "https://github.com/pkmn/ps",
      licence: "MIT",
      version: pkmnVersion(),
    },
  ]
}
