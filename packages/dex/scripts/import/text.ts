import { idOf, type Link } from "./api-data.ts"

type Localised = { language: Link }

const SOFT_HYPHEN = String.fromCharCode(0xad)

/** The English entry of a list of translations, if there is one. */
export function english<T extends Localised>(entries: T[]): T | undefined {
  return entries.find((entry) => entry.language.name === "en")
}

/**
 * Game text as one line: the games break lines with newlines and form
 * feeds, and older ones hyphenate with a soft hyphen at a line end.
 */
export function normalise(text: string): string {
  return text
    .replaceAll(`${SOFT_HYPHEN}\n`, "")
    .replaceAll(SOFT_HYPHEN, "")
    .replace(/\s+/g, " ")
    .trim()
}

type Described = {
  effect_entries: (Localised & { short_effect: string })[]
  flavor_text_entries: (Localised & {
    flavor_text: string
    version_group: Link
  })[]
}

/**
 * A move's or ability's effect: the English short effect, else the newest
 * English game text, else nothing (spec 002's plan, step 4).
 */
export function effectOf(resource: Described): string | undefined {
  const short = english(resource.effect_entries)?.short_effect
  if (short !== undefined) {
    return normalise(short)
  }
  const newest = resource.flavor_text_entries
    .filter((entry) => entry.language.name === "en")
    .sort((a, b) => idOf(b.version_group.url) - idOf(a.version_group.url))[0]
  return newest === undefined ? undefined : normalise(newest.flavor_text)
}
