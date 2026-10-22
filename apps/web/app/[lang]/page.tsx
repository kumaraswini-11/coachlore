import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"

import { Page, PageTitle } from "@/components/page"
import { pageMetadata } from "@/i18n/metadata"
import { localeHref } from "@/i18n/paths"
import { SITE } from "@/lib/site"
import { siteUrl } from "@/lib/site-url"

// No title: the home page shows the root layout's title.default, since a
// layout's title template doesn't apply to the page in its own segment.
export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("/")
}

// Home says what Coachlore is; spec 003's task 5 adds the Dex's blocks.
export default async function HomePage() {
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
    <Page className="gap-2">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <PageTitle>{t("heading")}</PageTitle>
      <p className="max-w-prose text-sm text-muted-foreground md:text-base">
        {t("intro")}
      </p>
    </Page>
  )
}
