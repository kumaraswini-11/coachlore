/**
 * Coachlore's Pokémon data model and the code that reads it (spec 002).
 * Synchronous and framework-agnostic: it runs in the browser, on the
 * server and in scripts alike. The large per-Pokémon and per-form files
 * are read through `@workspace/dex/files` instead. The type-chart
 * arithmetic and the filters, with no data, are also
 * `@workspace/dex/type-chart` and `@workspace/dex/filter`, for a Client
 * Component that loads the data itself.
 */
import abilitiesData from "../data/abilities.json" with { type: "json" }
import creditsData from "../data/credits.json" with { type: "json" }
import formsData from "../data/forms.json" with { type: "json" }
import gamesData from "../data/games.json" with { type: "json" }
import movesData from "../data/moves.json" with { type: "json" }
import showdownData from "../data/showdown.json" with { type: "json" }
import chartData from "../data/types.json" with { type: "json" }
import type {
  Ability,
  FormSummary,
  Game,
  Move,
  ShowdownNames,
  TypeChart,
} from "./types.ts"

export * from "./types.ts"
export { multiplier } from "./type-chart.ts"
export * from "./filter.ts"
export { formPath } from "./paths.ts"

/** Every form, by National Dex number, each Pokémon's default first. */
export const forms = formsData as FormSummary[]
export const typeChart = chartData as TypeChart
export const moves = movesData as Move[]
export const abilities = abilitiesData as Ability[]
/** Every game, in release order. */
export const games = gamesData as Game[]
export const showdown = showdownData as ShowdownNames

/** Each source, its licence and the version imported (spec 002, criterion 9). */
export const credits = creditsData as {
  source: string
  name: string
  link: string
  licence: string
  version: string
}[]
