import {
  DEFAULT_SORT,
  dexFilter,
  dexSort,
  type DexFilter,
  type DexSort,
  type StatFilterKey,
} from "@workspace/dex/filter"
import { TYPE_KEYS, type TypeKey } from "@workspace/dex/types"

/**
 * The Dex's view in the address (spec 003, "The address holds the view"):
 * every filter, the sort, grid or list, and on a game's page the version.
 * Each value is read on its own, so an unknown one is dropped and the rest
 * still apply (plan 003, "Data model").
 */
export type DexView = {
  filter: DexFilter
  sort: DexSort
  view: "grid" | "list"
  /** A game's page only: the version picked, absent for All. */
  version?: string
}

/** What the address may name that only the data knows. */
export type Known = {
  games?: ReadonlySet<string>
  abilities?: ReadonlySet<string>
  versions?: ReadonlySet<string>
}

// The address's short stat names, and the data's.
const STATS: [query: string, key: StatFilterKey][] = [
  ["hp", "hp"],
  ["atk", "attack"],
  ["def", "defense"],
  ["spa", "special-attack"],
  ["spd", "special-defense"],
  ["spe", "speed"],
  ["total", "total"],
]
const SORTS: [query: string, key: DexSort["key"]][] = [
  ["number", "number"],
  ["name", "name"],
  ...STATS,
]

const RANGE = /^(\d{1,3})?-(\d{1,3})?$/

/** One field of the filter, kept only if the schema accepts it. */
function field<K extends keyof DexFilter>(
  key: K,
  value: unknown
): Partial<DexFilter> {
  const parsed = dexFilter.shape[key].safeParse(value)
  return parsed.success && parsed.data !== undefined
    ? ({ [key]: parsed.data } as Partial<DexFilter>)
    : {}
}

/**
 * A comma-separated list, each item kept only if `keep` accepts it, so
 * `type=fire,plasma` keeps Fire.
 */
function list<T>(
  params: URLSearchParams,
  key: string,
  keep: (part: string) => T | undefined
): T[] | undefined {
  const value = params.get(key)
  const parts =
    value === null
      ? []
      : value.split(",").flatMap((part) => {
          const kept = keep(part)
          return kept === undefined ? [] : [kept]
        })
  return parts.length > 0 ? parts : undefined
}

const asType = (part: string) =>
  (TYPE_KEYS as readonly string[]).includes(part)
    ? (part as TypeKey)
    : undefined
const asGeneration = (part: string) =>
  /^[1-9]$/.test(part) ? Number(part) : undefined

export function parseDexQuery(
  params: URLSearchParams,
  known: Known = {}
): DexView {
  const filter: DexFilter = {
    ...field("q", params.get("q") || undefined),
    ...field("type", list(params, "type", asType)?.slice(0, 2)),
    ...field("weak", list(params, "weak", asType)?.slice(0, 2)),
    ...field("resist", list(params, "resist", asType)?.slice(0, 2)),
    ...field("gen", list(params, "gen", asGeneration)),
    ...field("forms", params.get("forms") ?? undefined),
  }
  const game = params.get("game")
  if (game !== null && known.games?.has(game)) {
    filter.game = game
  }
  const ability = params.get("ability")
  if (ability !== null && known.abilities?.has(ability)) {
    filter.ability = ability
  }

  const stats: NonNullable<DexFilter["stats"]> = {}
  for (const [query, key] of STATS) {
    const match = RANGE.exec(params.get(query) ?? "")
    if (match === null || (match[1] === undefined && match[2] === undefined)) {
      continue
    }
    const min = match[1] === undefined ? undefined : Number(match[1])
    const max = match[2] === undefined ? undefined : Number(match[2])
    if (min === undefined || max === undefined || min <= max) {
      stats[key] = {
        ...(min === undefined ? {} : { min }),
        ...(max === undefined ? {} : { max }),
      }
    }
  }
  if (Object.keys(stats).length > 0) {
    Object.assign(filter, field("stats", stats))
  }

  const sortValue = params.get("sort") ?? ""
  const descending = sortValue.startsWith("-")
  const sortKey = SORTS.find(
    ([query]) => query === sortValue.replace(/^-/, "")
  )?.[1]
  const sort = dexSort.safeParse({ key: sortKey, descending })

  const version = params.get("version")
  return {
    filter,
    sort: sort.success ? sort.data : DEFAULT_SORT,
    view: params.get("view") === "list" ? "list" : "grid",
    ...(version !== null && known.versions?.has(version) ? { version } : {}),
  }
}

/**
 * The query string for a view, defaults left out, in a fixed order, with
 * commas and ranges kept readable rather than percent-encoded.
 */
export function toDexQuery(view: DexView): string {
  const { filter, sort } = view
  const parts: [string, string][] = []
  const add = (key: string, value: string | undefined) => {
    if (value !== undefined && value !== "") {
      parts.push([key, value])
    }
  }
  add("q", filter.q)
  add("type", filter.type?.join(","))
  add("weak", filter.weak?.join(","))
  add("resist", filter.resist?.join(","))
  add("game", filter.game)
  add("gen", filter.gen?.join(","))
  add("ability", filter.ability)
  for (const [query, key] of STATS) {
    const range = filter.stats?.[key]
    if (
      range !== undefined &&
      (range.min !== undefined || range.max !== undefined)
    ) {
      add(query, `${range.min ?? ""}-${range.max ?? ""}`)
    }
  }
  add(
    "forms",
    filter.forms === undefined || filter.forms === "default"
      ? undefined
      : filter.forms
  )
  const sortQuery = SORTS.find(([, key]) => key === sort.key)?.[0]
  if (sort.key !== DEFAULT_SORT.key || sort.descending) {
    add("sort", `${sort.descending ? "-" : ""}${sortQuery}`)
  }
  add("view", view.view === "list" ? "list" : undefined)
  add("version", view.version)
  return parts
    .map(
      ([key, value]) =>
        `${key}=${encodeURIComponent(value).replace(/%2C/g, ",")}`
    )
    .join("&")
}
