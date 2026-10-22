import { Suspense } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { DexBrowserLoader, DexPreview } from "@/components/dex/dex-browser"
import { Page } from "@/components/page"
import { pageMetadata } from "@/i18n/metadata"
import { dexBrowserData, dexPreview } from "@/lib/dex"
import { dexWords } from "@/lib/dex-labels"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dex")
  return pageMetadata("/dex", {
    title: t("title"),
    description: t("metaDescription"),
  })
}

// Browse the Dex (spec 003): a static page. The browser reads the address,
// so it waits in Suspense (Next.js's useSearchParams docs); until it's in,
// the page shows the first default forms in the same layout, server-
// rendered, so the first paint is real content (plan 003, "Rendering").
export default async function DexPage() {
  const t = await getTranslations("dex")
  const words = await dexWords()
  const data = await dexBrowserData()
  const preview = await dexPreview()

  return (
    <Page>
      <Suspense
        fallback={
          <DexPreview
            title={t("title")}
            {...data}
            {...words}
            forms={preview.forms}
            total={preview.total}
          />
        }
      >
        <DexBrowserLoader title={t("title")} {...data} {...words} />
      </Suspense>
    </Page>
  )
}
