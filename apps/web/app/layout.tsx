import type { Metadata, Viewport } from "next"

import "@workspace/ui/globals.css"

import { ThemeProvider } from "@/components/theme-provider"
import { rootClassName } from "@/lib/fonts"
import { OPEN_GRAPH, SITE } from "@/lib/site"
import { siteUrl } from "@/lib/site-url"

// The share image comes from the opengraph-image.png file convention, and
// each page sets its own canonical URL and og:url: Next.js merges metadata
// shallowly, so either set here would apply to every page.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: SITE.title,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: OPEN_GRAPH,
  twitter: {
    card: "summary_large_image",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: SITE.colors.light },
    { media: "(prefers-color-scheme: dark)", color: SITE.colors.dark },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={rootClassName}>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
