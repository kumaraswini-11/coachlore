import type { MetadataRoute } from "next"

import { pageAlternates, PUBLIC_PAGES } from "@/i18n/paths"
import { routing } from "@/i18n/routing"
import { siteUrl } from "@/lib/site-url"

// Every public page in every language, with the same alternates its
// metadata names (Next.js's "localized Sitemap"). Dex pages are added from
// the data once it exists.
export default function sitemap(): MetadataRoute.Sitemap {
  const absolute = (path: string) => new URL(path, siteUrl()).href

  return PUBLIC_PAGES.flatMap((path) =>
    routing.locales.map((locale) => {
      const { canonical, languages } = pageAlternates(locale, path)
      return {
        url: absolute(canonical),
        alternates: {
          languages: Object.fromEntries(
            Object.entries(languages).map(([lang, url]) => [
              lang,
              absolute(url),
            ])
          ),
        },
      }
    })
  )
}
