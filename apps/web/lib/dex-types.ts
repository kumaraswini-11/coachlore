import type { StatFilterKey } from "@workspace/dex/filter"
import type { FormSummary, TypeChart, TypeKey } from "@workspace/dex/types"

// The Dex browser's props, shared by the page (lib/dex.ts, server-only)
// and the browser's components (Client Components), so neither imports
// the other's module for a type.

/** A game or an ability: its key and its name. */
export type Named = { key: string; name: string }

/** What the browser shows, given by the page: the forms and what they name. */
export type DexData = {
  forms: FormSummary[]
  chart: TypeChart
  /** The games the forms' Pokédexes name, in release order. */
  games: Named[]
  /** The abilities the forms can have. */
  abilities: Named[]
  /** Each stat's highest in the dataset: the sliders' ends. */
  statMax: Record<StatFilterKey, number>
}

/** The types' names in the page's language, and the language they're in. */
export type TypeWords = {
  typeNames: Record<TypeKey, string>
  typeLang: string
}
