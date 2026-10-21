import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"

import { DexBrowser } from "@/components/dex/dex-browser"
import { DexGridSkeleton } from "@/components/dex/dex-skeletons"
import { dexFixture } from "@/fixtures/dex"
import { dexWords } from "@/lib/dex-labels"

// Fixture screen (spec 001, "How a screen is built", step 2): the Dex's
// browse screen on sample data, for the owner's review on a phone and for
// the end-to-end tests. Built into previews; production has none.

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dex.fixtures")
  return {
    title: t("title"),
    description: t("metaDescription"),
    robots: { index: false },
  }
}

export default async function DexFixturePage() {
  // Decided at build time: production builds this page as a 404.
  if (process.env.VERCEL_ENV === "production") {
    notFound()
  }
  const t = await getTranslations("dex.fixtures")
  const words = await dexWords()

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      {/* The browser reads the address, so it waits in Suspense (Next.js's
          useSearchParams docs); the skeleton holds its place. */}
      <Suspense fallback={<DexGridSkeleton label={words.labels.loading} />}>
        <DexBrowser {...dexFixture()} {...words} />
      </Suspense>
    </div>
  )
}
