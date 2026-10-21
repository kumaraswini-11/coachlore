import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"

import { pageAlternates, type Path } from "@/i18n/paths"
import { OPEN_GRAPH } from "@/lib/site"

/**
 * A page's metadata in its language: its title and description, its
 * canonical address, its other languages (hreflang) and its link preview
 * (apps/web/README.md, "Titles and descriptions").
 */
export async function pageMetadata(
  path: Path,
  { title, description }: { title?: string; description?: string } = {}
): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations("meta")
  const alternates = pageAlternates(locale, path)

  return {
    ...(title === undefined ? {} : { title }),
    ...(description === undefined ? {} : { description }),
    alternates,
    openGraph: {
      ...OPEN_GRAPH,
      locale: t("openGraphLocale"),
      url: alternates.canonical,
    },
  }
}
