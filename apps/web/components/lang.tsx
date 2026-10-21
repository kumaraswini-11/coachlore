import type * as React from "react"
import type { Locale } from "next-intl"
import { getLocale, getTranslations } from "next-intl/server"

import { dir, languageName } from "@/i18n/locales"

/**
 * Text that isn't in the page's language, such as an English Pokémon name on
 * a Hindi page: its own `lang`, so it's pronounced right (WCAG 3.1.2), and
 * its own direction in an isolated run, so it can't reorder the sentence
 * around it in a right-to-left page (W3C, "Inline markup and bidirectional
 * text in HTML": "wrap the location with a bdi element").
 */
function Lang({ lang, children }: { lang: Locale; children: React.ReactNode }) {
  return (
    <bdi lang={lang} dir={dir(lang)}>
      {children}
    </bdi>
  )
}

/**
 * "Written in English" beside a write-up whose language isn't the page's
 * (spec 013's recaps and digest); nothing when they match.
 */
async function WrittenIn({ lang }: { lang: Locale }) {
  const pageLocale = await getLocale()
  if (lang === pageLocale) {
    return null
  }
  const t = await getTranslations("language")
  return (
    <span className="text-xs text-muted-foreground">
      {t("writtenIn", { language: languageName(lang, pageLocale) })}
    </span>
  )
}

export { Lang, WrittenIn }
