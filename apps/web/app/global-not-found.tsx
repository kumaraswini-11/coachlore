import type { Metadata } from "next"
import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"

import "@workspace/ui/globals.css"

import { EmptyState } from "@workspace/ui/components/empty-state"
import { buttonVariants } from "@workspace/ui/components/shadcn-ui/button"

import { Page } from "@/components/page"
import { ThemeProvider } from "@/components/theme-provider"
import { dir } from "@/i18n/locales"
import { localeHref } from "@/i18n/paths"
import { fontStyle, rootClassName } from "@/lib/fonts"
import { pageTitle } from "@/lib/site"
import { siteUrl } from "@/lib/site-url"

// Every address that matches no page. The Proxy first gives an address its
// language, so `/missing.txt` arrives as `/en/missing.txt`; Next.js then
// "skips rendering and directly returns this global page" (its not-found
// docs, for a root layout under a dynamic segment such as app/[lang]). It
// bypasses the layout, so it brings its own <html>, styles, fonts and theme.
// It speaks the language the Proxy chose for the request (i18n/request.ts),
// so it renders on each request (spec 001, criterion 13).

// A blocking route, as Next.js's "blocking-prerender-runtime" message
// offers: the language must be known before `<html lang>` is written, and
// a placeholder would show a 404 in no language.
export const instant = false

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("notFound")
  return {
    // No layout sits above this page, so it sets its own base for the
    // share image.
    metadataBase: new URL(siteUrl()),
    title: pageTitle(t("title")),
    description: t("metaDescription"),
  }
}

export default async function GlobalNotFound() {
  const locale = await getLocale()
  const t = await getTranslations("notFound")
  return (
    <html
      lang={locale}
      dir={dir(locale)}
      suppressHydrationWarning
      className={rootClassName}
      style={fontStyle(locale)}
    >
      <body>
        <ThemeProvider>
          {/* The same as the language's not-found page, centred in a
              screen of its own, since no shell sits around it. */}
          <main className="flex min-h-svh flex-col">
            <Page>
              <EmptyState
                titleAs="h1"
                title={t("title")}
                description={t("description")}
              >
                <Link
                  href={localeHref(locale, "/")}
                  className={buttonVariants({ size: "touch" })}
                >
                  {t("home")}
                </Link>
              </EmptyState>
            </Page>
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
