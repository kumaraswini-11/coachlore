/// <reference types="node" />
import { readFileSync } from "node:fs"
import { Dex } from "@pkmn/dex"

import type { ShowdownNames, Usage, UsageEntry } from "../../src/types.ts"
import { showdownId } from "./showdown.ts"

type ChaosEntry = {
  usage: number
  Abilities: Record<string, number>
  Items: Record<string, number>
  Moves: Record<string, number>
  Teammates: Record<string, number>
}

// Smogon's way of writing an empty move slot, no item, and an empty team
// slot among the teammates.
const EMPTY = new Set(["", "nothing", "empty"])
const TOP = 6

/**
 * Step 10 of spec 002's plan: each format's usage from Smogon's chaos
 * file, names mapped through step 9, each list cut to its top six. A share
 * is the weighted count over the Pokémon's total, rounded to four places
 * so a refresh is a small diff. A name that maps to nothing is an error.
 */
export function importUsage(
  month: string,
  files: Record<string, string>,
  showdown: ShowdownNames
): Usage {
  const moveKeys = new Map(Object.entries(showdown.moves))
  const abilityKeys = new Map(Object.entries(showdown.abilities))
  const problems: string[] = []
  const formats: Usage["formats"] = {}

  for (const [format, file] of Object.entries(files).sort()) {
    const chaos = JSON.parse(readFileSync(file, "utf8")) as {
      data: Record<string, ChaosEntry>
    }
    const entries: Record<string, UsageEntry> = {}
    const form = (name: string) => {
      const key = showdown.ids[showdownId(name)]
      if (key === undefined) {
        problems.push(`${format}: ${name} matches no form`)
      }
      return key
    }
    const mapped = (
      list: Record<string, number>,
      keys: ReadonlyMap<string, string>,
      what: string
    ) =>
      Object.entries(list).flatMap(([id, weight]) => {
        if (EMPTY.has(id)) {
          return []
        }
        const key = keys.get(id)
        if (key === undefined) {
          problems.push(`${format}: the ${what} ${id} matches nothing`)
          return []
        }
        return [[key, weight] as [string, number]]
      })

    for (const [name, entry] of Object.entries(chaos.data)) {
      const key = form(name)
      if (key === undefined) {
        continue
      }
      // Each team member has one ability, so their weights sum to its total.
      const total = Object.values(entry.Abilities).reduce((a, b) => a + b, 0)
      const top = (list: [string, number][]) => share(list, total)
      entries[key] = {
        share: round(entry.usage),
        moves: top(mapped(entry.Moves, moveKeys, "move")),
        items: top(
          Object.entries(entry.Items).flatMap(([id, weight]) =>
            EMPTY.has(id) ? [] : [[itemName(id), weight] as [string, number]]
          )
        ),
        abilities: top(mapped(entry.Abilities, abilityKeys, "ability")),
        partners: top(
          Object.entries(entry.Teammates).flatMap(([partner, weight]) => {
            if (EMPTY.has(partner)) {
              return []
            }
            const partnerKey = form(partner)
            return partnerKey === undefined
              ? []
              : [[partnerKey, weight] as [string, number]]
          })
        ),
      }
    }
    formats[format] = Object.fromEntries(
      Object.entries(entries).sort(([a], [b]) => (a < b ? -1 : 1))
    )
  }
  if (problems.length > 0) {
    throw new Error([...new Set(problems)].join("\n"))
  }
  return { month, formats }
}

/** The top six by weight, each as its share of the total. */
function share(list: [string, number][], total: number): [string, number][] {
  return [...list]
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .slice(0, TOP)
    .map(([key, weight]) => [key, round(total > 0 ? weight / total : 0)])
}

function round(value: number): number {
  return Math.round(value * 10_000) / 10_000
}

/** An item's English name ("Choice Scarf"): there's no item dataset yet. */
function itemName(id: string): string {
  const item = Dex.forGen(9).items.get(id)
  if (!item.exists) {
    throw new Error(`Smogon's item ${id} isn't one Showdown knows.`)
  }
  return item.name
}
