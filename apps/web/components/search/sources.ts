import type { SearchSource } from "@/components/search/types"

/**
 * What the palette searches, in the order its groups show. Empty in spec
 * 001; spec 003 adds Pokémon and forms, 004 moves, abilities and types, 007
 * leagues, and 012 "Ask" as the last row.
 */
export const SEARCH_SOURCES: readonly SearchSource[] = []
