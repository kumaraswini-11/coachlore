import type * as React from "react"
import type { Locale } from "next-intl"

import { dir } from "@/i18n/locales"

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

export { Lang }
