import type { FormSummary, TypeKey } from "@workspace/dex/types"

import { fill } from "@/i18n/error-messages"

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"]

/** A generation as the games number it: 9 → "IX". */
export function roman(generation: number): string {
  return ROMAN[generation - 1] ?? String(generation)
}

// One formatter a language: the grid names every card on each change.
const LISTS = new Map<string, Intl.ListFormat>()

/** "Steel and Ground", in the page's language. */
export function typeList(
  types: readonly TypeKey[],
  typeNames: Record<TypeKey, string>,
  locale: string
): string {
  let format = LISTS.get(locale)
  if (format === undefined) {
    format = new Intl.ListFormat(locale, { type: "conjunction" })
    LISTS.set(locale, format)
  }
  return format.format(types.map((type) => typeNames[type]))
}

/** A card's name: "#0208 Steelix, Steel and Ground". */
export function cardLabel(
  template: string,
  form: FormSummary,
  typeNames: Record<TypeKey, string>,
  locale: string
): string {
  return fill(template, {
    number: String(form.number).padStart(4, "0"),
    name: form.name,
    types: typeList(form.types, typeNames, locale),
  })
}
