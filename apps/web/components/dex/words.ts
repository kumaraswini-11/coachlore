import {
  STAT_KEYS,
  type FormSummary,
  type StatKey,
  type TypeKey,
} from "@workspace/dex/types"

import { fill } from "@/i18n/fill"

/** "#0082": the national number as the games write it. */
export function dexNumber(number: number): string {
  return `#${paddedNumber(number)}`
}

/** "0082": the national number's four digits. */
function paddedNumber(number: number): string {
  return String(number).padStart(4, "0")
}

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
    number: paddedNumber(form.number),
    name: form.name,
    types: typeList(form.types, typeNames, locale),
  })
}

// One formatter a language: the list names every row's stats.
const STAT_LISTS = new Map<string, Intl.ListFormat>()

/** "HP 45, Attack 49, …, and Speed 45": a form's stats, named in full. */
export function statList(
  form: FormSummary,
  names: Record<StatKey, string>,
  locale: string
): string {
  let format = STAT_LISTS.get(locale)
  if (format === undefined) {
    format = new Intl.ListFormat(locale, { type: "conjunction" })
    STAT_LISTS.set(locale, format)
  }
  return format.format(
    STAT_KEYS.map((key) => `${names[key]} ${form.stats[key]}`)
  )
}
