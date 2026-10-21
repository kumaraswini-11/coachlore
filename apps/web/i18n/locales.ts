import type { Locale } from "next-intl"

import { routing } from "@/i18n/routing"

// What each language needs beyond its messages. A right-to-left language is
// one more entry with `dir: "rtl"`.
const DIRECTION: Record<Locale, "ltr" | "rtl"> = { en: "ltr", hi: "ltr" }

export function dir(locale: Locale) {
  return DIRECTION[locale]
}

/** A language's own name, in that language: "English", "हिन्दी". */
export function endonym(locale: Locale) {
  return new Intl.DisplayNames([locale], { type: "language" }).of(locale) ?? ""
}

/** A language's name in another language: "Hindi" in English. */
export function languageName(locale: Locale, inLocale: Locale) {
  return (
    new Intl.DisplayNames([inLocale], { type: "language" }).of(locale) ?? ""
  )
}

/** The languages other than this one, for the language switch. */
export function otherLocales(locale: Locale) {
  return routing.locales.filter((other) => other !== locale)
}
