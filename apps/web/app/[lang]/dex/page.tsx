import { Suspense } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { DexBrowserLoader, DexPreview } from "@/components/dex/dex-browser"
import { PageCrumbs } from "@/components/page-crumbs"
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 md:p-6">
      <PageCrumbs current={t("title")} />
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <Suspense
        fallback={
          <DexPreview
            {...data}
            {...words}
            forms={preview.forms}
            total={preview.total}
          />
        }
      >
        <DexBrowserLoader {...data} {...words} />
      </Suspense>
    </div>
  )
}
