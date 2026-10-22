import type { SearchSource } from "@/components/search/types"

/**
 * What the palette searches, in the order its groups show. Empty until
 * spec 003's task 8 adds Pokémon and forms (matched with
 * `@workspace/dex/text`, as the Dex's own filter is); then 004 moves,
 * abilities and types, 007 leagues, and 012 "Ask" as the last row.
 */
export const SEARCH_SOURCES: readonly SearchSource[] = []
