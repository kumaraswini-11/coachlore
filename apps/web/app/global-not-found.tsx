import type { Metadata } from "next"
import Link from "next/link"
import { createTranslator, type Locale } from "next-intl"

import "@workspace/ui/globals.css"

import { buttonVariants } from "@workspace/ui/components/shadcn-ui/button"
import { cn } from "@workspace/ui/lib/utils"

import { ThemeProvider } from "@/components/theme-provider"
import { localeHref } from "@/i18n/paths"
import { routing } from "@/i18n/routing"
import { fontStyle, rootClassName } from "@/lib/fonts"
import { SITE } from "@/lib/site"
import { siteUrl } from "@/lib/site-url"
import en from "@/messages/en/main.json"
import hi from "@/messages/hi/main.json"

// Every address that matches no page. The Proxy first gives an address its
// language, so `/missing.txt` arrives as `/en/missing.txt`; Next.js then
// "skips rendering and directly returns this global page" (its not-found
// docs, for a root layout under a dynamic segment such as app/[lang]). It
// bypasses the layout, so it brings its own <html>, styles, fonts and theme.
// It can't know which language the person reads, so it says it in each
// (spec 001, criterion 13).
//
// English's types are its exact strings, so Hindi is cast; messages.test.ts
// checks it has the same keys and arguments.
const MESSAGES: Record<Locale, typeof en> = { en, hi: hi as typeof en }

const translators = routing.locales.map((locale) => ({
  locale,
  t: createTranslator({
    locale,
    messages: MESSAGES[locale],
    namespace: "notFound",
  }),
}))

// No layout sits above this page, so it sets its own base for the share
// image.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: `${translators.map(({ t }) => t("title")).join(" · ")} · ${SITE.name}`,
  description: translators.map(({ t }) => t("metaDescription")).join(" "),
}

export default function GlobalNotFound() {
  return (
    <html
      lang={routing.defaultLocale}
      suppressHydrationWarning
      className={rootClassName}
      // Every script's font, since every language shows here.
      style={fontStyle("hi")}
    >
      <body>
        <ThemeProvider>
          <main className="mx-auto flex min-h-svh max-w-prose flex-col justify-center gap-10 p-6">
            {translators.map(({ locale, t }, index) => (
              <section
                key={locale}
                lang={locale}
                className="flex flex-col gap-3"
              >
                {/* One h1 for the page; each other language's title is a
                    second-level heading. */}
                {index === 0 ? (
                  <h1 className="text-lg font-medium">{t("title")}</h1>
                ) : (
                  <h2 className="text-lg font-medium">{t("title")}</h2>
                )}
                <p className="text-muted-foreground">{t("description")}</p>
                <Link
                  href={localeHref(locale, "/")}
                  hrefLang={locale}
                  className={cn(buttonVariants(), "h-11 w-fit px-4")}
                >
                  {t("home")}
                </Link>
              </section>
            ))}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
