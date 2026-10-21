import { z } from "zod"

import { multiplier } from "./type-chart.ts"
import {
  STAT_KEYS,
  TYPE_KEYS,
  type FormSummary,
  type StatKey,
  type TypeChart,
} from "./types.ts"

/**
 * The Dex's filters and sort (spec 003, "Browse the Dex"), pure and over
 * the browser's form list. `dexFilter` is the one schema for them: the
 * address's query (apps/web) and the model's filters (spec 012) are parsed
 * with it.
 */

const typeList = z.array(z.enum(TYPE_KEYS)).max(2)

/** A stat's range, inclusive; either end may be open. */
const range = z.object({
  min: z.number().int().nonnegative().optional(),
  max: z.number().int().nonnegative().optional(),
})

export const STAT_FILTER_KEYS = [...STAT_KEYS, "total"] as const
export type StatFilterKey = (typeof STAT_FILTER_KEYS)[number]

export const FORM_KINDS = [
  "default",
  "all",
  "regional",
  "mega",
  "gigantamax",
  "other",
] as const

export const dexFilter = z.object({
  /** Name contains it, or the national number equals it. */
  q: z.string().trim().max(64).optional(),
  /** Has every chosen type. */
  type: typeList.optional(),
  /** Takes ×2 or more from every chosen type, by its types alone. */
  weak: typeList.optional(),
  /** Takes ½ or less, or nothing, from every chosen type. */
  resist: typeList.optional(),
  /** In that game's Pokédex. */
  game: z.string().optional(),
  /** Introduced in one of these generations. */
  gen: z.array(z.number().int().min(1).max(9)).optional(),
  /** Can have the ability, hidden or not. */
  ability: z.string().optional(),
  stats: z.partialRecord(z.enum(STAT_FILTER_KEYS), range).optional(),
  /** Which forms show: default forms unless it says otherwise. */
  forms: z.enum(FORM_KINDS).optional(),
})
export type DexFilter = z.infer<typeof dexFilter>

export const SORT_KEYS = ["number", "name", ...STAT_FILTER_KEYS] as const
export const dexSort = z.object({
  key: z.enum(SORT_KEYS),
  descending: z.boolean(),
})
export type DexSort = z.infer<typeof dexSort>
export const DEFAULT_SORT: DexSort = { key: "number", descending: false }

function statOf(form: FormSummary, key: StatFilterKey): number {
  return key === "total" ? form.statTotal : form.stats[key as StatKey]
}

/** The forms that pass every filter set, in the order given. */
export function filterForms(
  forms: readonly FormSummary[],
  filter: DexFilter,
  chart: TypeChart
): FormSummary[] {
  const text = filter.q?.toLowerCase().replace(/^#/, "") ?? ""
  const number = /^\d+$/.test(text) ? Number(text) : undefined
  const kind = filter.forms ?? "default"
  const generations = filter.gen?.length ? new Set(filter.gen) : undefined
  const ranges = Object.entries(filter.stats ?? {}) as [
    StatFilterKey,
    z.infer<typeof range>,
  ][]

  return forms.filter(
    (form) =>
      (kind === "all" ||
        (kind === "default" ? form.isDefault : form.kind === kind)) &&
      (text === "" ||
        (number === undefined
          ? form.name.toLowerCase().includes(text)
          : form.number === number)) &&
      (filter.type ?? []).every((type) => form.types.includes(type)) &&
      (filter.weak ?? []).every(
        (type) => multiplier(chart, type, form.types) >= 2
      ) &&
      (filter.resist ?? []).every(
        (type) => multiplier(chart, type, form.types) <= 0.5
      ) &&
      (filter.game === undefined || form.games.includes(filter.game)) &&
      (generations === undefined || generations.has(form.generation)) &&
      (filter.ability === undefined ||
        form.abilities.some((ability) => ability.key === filter.ability)) &&
      ranges.every(([key, { min, max }]) => {
        const value = statOf(form, key)
        return (
          (min === undefined || value >= min) &&
          (max === undefined || value <= max)
        )
      })
  )
}

/**
 * The forms in the chosen order; ties keep the list's own order (by
 * number, each Pokémon's default form first).
 */
export function sortForms(
  forms: readonly FormSummary[],
  sort: DexSort
): FormSummary[] {
  const direction = sort.descending ? -1 : 1
  const order = new Map(forms.map((form, index) => [form.key, index]))
  const compare = (a: FormSummary, b: FormSummary): number => {
    switch (sort.key) {
      case "number":
        return a.number - b.number
      case "name":
        return a.name.localeCompare(b.name, "en")
      default:
        return statOf(a, sort.key) - statOf(b, sort.key)
    }
  }
  return [...forms].sort(
    (a, b) =>
      direction * compare(a, b) ||
      (order.get(a.key) ?? 0) - (order.get(b.key) ?? 0)
  )
}
