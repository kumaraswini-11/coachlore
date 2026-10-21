/**
 * Text as the palette compares it: without case or accents, so "pokemon"
 * finds "Pokémon" and "FLABEBE" finds "Flabébé" (spec 001's plan, "Data
 * model"). Every source matches through this, so they agree. Only the Latin
 * diacritics (U+0300 to U+036F) go: Devanagari's vowel signs are combining
 * marks too, but they're letters, and dropping them would make "गार" match
 * "गुर".
 */
export function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036F]/g, "")
    .toLocaleLowerCase("en")
}

/** Whether `text` contains the query, ignoring case and accents. */
export function matches(query: string, text: string) {
  const wanted = normalize(query.trim())
  return wanted !== "" && normalize(text).includes(wanted)
}
