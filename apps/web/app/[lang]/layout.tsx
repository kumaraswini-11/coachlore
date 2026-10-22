import type { Metadata, Viewport } from "next"
import { getLocale, getTranslations } from "next-intl/server"

import "@workspace/ui/globals.css"

import { DirectionProvider } from "@workspace/ui/components/shadcn-ui/direction"
import { cn } from "@workspace/ui/lib/utils"

import { AppShell } from "@/components/shell/app-shell"
import { ThemeProvider } from "@/components/theme-provider"
import { dir } from "@/i18n/locales"
import { routing } from "@/i18n/routing"
import { fontStyle, rootClassName } from "@/lib/fonts"
import { OPEN_GRAPH, pageTitle, SITE } from "@/lib/site"
import { siteUrl } from "@/lib/site-url"

// Both languages are built ahead; Cache Components needs every root
// parameter to have a value (Next.js's root-params docs).
export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }))
}

// The share image comes from the opengraph-image.png file convention, and
// each page sets its own canonical URL, alternates and og:url: Next.js merges
// metadata shallowly, so either set here would apply to every page.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: t("title"), template: pageTitle("%s") },
    description: t("description"),
    applicationName: SITE.name,
    openGraph: { ...OPEN_GRAPH, locale: t("openGraphLocale") },
    twitter: { card: "summary_large_image" },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: SITE.colors.light },
    { media: "(prefers-color-scheme: dark)", color: SITE.colors.dark },
  ],
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale()

  return (
    <html
      lang={locale}
      dir={dir(locale)}
      suppressHydrationWarning
      // The sticky top bar's height, which scroll padding keeps focus clear
      // of (WCAG 2.4.11, spec 001 criterion 9), and a page's own sticky bar
      // under it (`data-sticky-bar`, as tall as --sticky-bar: /dex's search
      // and sort), both defined here once.
      className={cn(
        rootClassName,
        "scroll-pt-(--sticky-top) [--sticky-bar:3.75rem] [--sticky-top:3.5rem] has-data-sticky-bar:scroll-pt-[calc(var(--sticky-top)+var(--sticky-bar))]"
      )}
      style={fontStyle(locale)}
    >
      <body className="flex min-h-svh flex-col">
        {/* Base UI reads the direction from this provider, not from <html>
            (its DirectionProvider docs): menus, tabs and arrow keys follow
            it. Client Components get their strings as props from the
            server, so no messages are sent to the browser. */}
        <DirectionProvider direction={dir(locale)}>
          <ThemeProvider>
            <AppShell>{children}</AppShell>
          </ThemeProvider>
        </DirectionProvider>
      </body>
    </html>
  )
}
