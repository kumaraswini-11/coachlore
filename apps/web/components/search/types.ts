import type { Route } from "next"
import type { Locale } from "next-intl"

/** One row in the search palette (spec 001's plan, "Data model"). */
export type SearchResult = {
  /** Unique across sources, such as "form:rotom-wash". */
  id: string
  kind: "pokemon" | "move" | "ability" | "type" | "league" | "ask"
  label: string
  /** Such as "#0479 · Electric, Water". */
  detail?: string
  /** With its language, from `localeHref`. */
  href: Route
}

/**
 * Something the palette searches. Specs 003, 004, 007 and 012 each add one
 * to `sources.ts`; the palette shows at most `MAX_RESULTS` of each.
 */
export type SearchSource = {
  kind: SearchResult["kind"]
  /** The group's heading, in the page's language. */
  heading: (locale: Locale) => string
  search(
    query: string,
    locale: Locale
  ): SearchResult[] | Promise<SearchResult[]>
}

export const MAX_RESULTS = 8
