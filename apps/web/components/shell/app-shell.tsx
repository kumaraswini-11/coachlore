import type * as React from "react"
import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"

import { DisplayMenu } from "@/components/shell/display-menu"
import { LanguageLinks } from "@/components/shell/language-links"
import { endonym, otherLocales } from "@/i18n/locales"
import { localeHref } from "@/i18n/paths"
import { routing } from "@/i18n/routing"
import { SITE } from "@/lib/site"

/**
 * The app shell (spec 001, "The app shell"): the skip link, the top bar, the
 * page's one <main>, and the footer with the not-affiliated notice, the
 * credits and the switch to the other language. A Server Component; only
 * the display menu and the language links run in the browser.
 *
 * The bottom tabs and the sidebar arrive with their first item, the Dex
 * (spec 003): until a page exists, nothing links to it (spec 001, "No dead
 * controls").
 */
async function AppShell({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const t = await getTranslations("shell")
  const footer = await getTranslations("footer")

  const languages = routing.locales.map((other) => ({
    locale: other,
    name: endonym(other),
  }))

  return (
    <>
      {/* The first thing a keyboard reaches (WCAG 2.4.1). */}
      <a
        href="#main"
        className="focus:inset-s-2 sr-only focus:not-sr-only focus:fixed focus:top-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-3 focus:ring-3 focus:ring-ring"
      >
        {t("skipToContent")}
      </a>
      <header className="sticky top-0 z-40 flex h-(--sticky-top) items-center justify-between gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <Link
          href={localeHref(locale, "/")}
          aria-label={t("home")}
          className="inline-flex min-h-11 items-center text-base font-semibold"
        >
          {SITE.name}
        </Link>
        <DisplayMenu
          locale={locale}
          languages={languages}
          labels={{
            display: t("display"),
            theme: t("theme"),
            light: t("light"),
            dark: t("dark"),
            system: t("system"),
            shortcuts: t("shortcuts"),
            language: t("language"),
          }}
        />
      </header>
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <footer className="border-t px-4 py-6 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-(--breakpoint-xl) flex-col gap-2">
          <p>{footer("notice")}</p>
          <p>{footer("credits")}</p>
          <LanguageLinks
            languages={otherLocales(locale).map((other) => ({
              locale: other,
              name: endonym(other),
            }))}
          />
        </div>
      </footer>
    </>
  )
}

export { AppShell }
