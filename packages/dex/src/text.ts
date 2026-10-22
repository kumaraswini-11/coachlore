/**
 * Text as names are compared: without case or accents, so "pokemon" finds
 * "Pokémon" and "FLABEBE" finds "Flabébé" (spec 001's plan, "Data model").
 * The Dex's name filter and the search palette both match through this, so
 * they agree. Only the Latin diacritics (U+0300 to U+036F) go: Devanagari's
 * vowel signs are combining marks too, but they're letters, and dropping
 * them would make "गार" match "गुर".
 */
export function normalize(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLocaleLowerCase("en")
      // Typed punctuation matches the data's: "farfetch'd" finds
      // "Farfetch’d", and "rotom wash" finds "Rotom-Wash".
      .replace(/[‘’]/g, "'")
      .replace(/[\s_-]+/g, " ")
  )
}

/** Whether `text` contains the query, ignoring case and accents. */
export function matches(query: string, text: string): boolean {
  const wanted = normalize(query.trim())
  return wanted !== "" && normalize(text).includes(wanted)
}
