import type * as React from "react"
import Link from "next/link"
import { getLocale, getMessages, getTranslations } from "next-intl/server"

import { buttonVariants } from "@workspace/ui/components/shadcn-ui/button"
import { cn } from "@workspace/ui/lib/utils"

import { SearchButton } from "@/components/search/search-button"
import { Lang } from "@/components/shell/lang"
import { LanguageToggle } from "@/components/shell/language-toggle"
import { LogoMark } from "@/components/shell/logo-mark"
import { ThemeToggle } from "@/components/shell/theme-toggle"
import { endonym, otherLocales } from "@/i18n/locales"
import { localeHref } from "@/i18n/paths"
import { SITE } from "@/lib/site"

/**
 * The app shell (spec 001, "The app shell"): the skip link, the top bar, the
 * page's one <main>, and the footer with the not-affiliated notice and the
 * credits. A Server Component; only the search, language and theme buttons
 * run in the browser. The footer starts where the top bar does.
 *
 * The bottom tabs and the sidebar come with plan 003's navigation task,
 * the Dex their first item (spec 001, "The app shell"). The footer links to
 * `/about` and `/legal` in the page's language.
 */
async function AppShell({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const t = await getTranslations("shell")
  const messages = await getMessages()
  const footer = await getTranslations("footer")

  // Two languages, so the top bar's button opens the other one.
  const [other] = otherLocales(locale)

  return (
    <>
      {/* The first thing a keyboard reaches (WCAG 2.4.1). */}
      <a
        href="#main"
        className="focus:inset-s-2 sr-only focus:not-sr-only focus:fixed focus:top-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-3 focus:ring-3 focus:ring-ring"
      >
        {t("skipToContent")}
      </a>
      <header className="sticky top-0 z-40 flex h-(--sticky-top) items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
        <Link
          href={localeHref(locale, "/")}
          aria-label={t("home")}
          className="inline-flex min-h-11 items-center gap-2 text-base font-semibold"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
            <LogoMark className="size-5" />
          </span>
          {SITE.name}
        </Link>
        <div className="ms-auto flex items-center gap-2">
          <SearchButton
            locale={locale}
            hint={t("searchHint")}
            shortcutLabels={messages.shell.searchShortcut}
            messages={messages.palette}
          />
          {other ? (
            <LanguageToggle
              locale={other}
              name={endonym(other)}
              label={t.rich("readIn", {
                language: endonym(other),
                lang: (chunks) => <Lang lang={other}>{chunks}</Lang>,
              })}
            />
          ) : null}
          <ThemeToggle label={t("darkTheme")} />
        </div>
      </header>
      {/* A column, so a page can fill the height above the footer. */}
      <main
        id="main"
        tabIndex={-1}
        className="flex flex-1 flex-col outline-none"
      >
        {children}
      </main>
      <footer className="border-t px-4 py-6 text-xs text-muted-foreground md:px-6">
        <div className="flex flex-col gap-2">
          <p>{footer("notice")}</p>
          <p>{footer("credits")}</p>
          <ul className="flex flex-wrap gap-x-4">
            {(["/about", "/legal"] as const).map((path) => (
              <li key={path}>
                <Link
                  href={localeHref(locale, path)}
                  className={cn(
                    buttonVariants({ variant: "link", size: "touch" }),
                    "px-0 text-xs"
                  )}
                >
                  {footer(path === "/about" ? "about" : "legal")}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </>
  )
}

export { AppShell }
