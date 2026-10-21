import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"

import { pageMetadata } from "@/i18n/metadata"
import { localeHref } from "@/i18n/paths"
import { SITE } from "@/lib/site"
import { siteUrl } from "@/lib/site-url"

// No title: the home page shows the root layout's title.default, since a
// layout's title template doesn't apply to the page in its own segment.
export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("/")
}

// Until the Dex arrives (spec 003), home says what Coachlore is.
export default async function Page() {
  const locale = await getLocale()
  const t = await getTranslations("home")

  // Structured data for search engines (https://schema.org/WebSite) for
  // this language's home, rendered as Next.js's JSON-LD guide shows: "<"
  // escaped, so the JSON can't close the script tag.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: new URL(localeHref(locale, "/"), siteUrl()).href,
    inLanguage: locale,
  }

  return (
    <div className="flex flex-col gap-2 p-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <h1 className="text-2xl font-semibold">{t("heading")}</h1>
      <p className="max-w-prose text-sm text-muted-foreground md:text-base">
        {t("intro")}
      </p>
    </div>
  )
}
