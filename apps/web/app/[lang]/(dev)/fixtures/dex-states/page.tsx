import type { Metadata, Route } from "next"
import { notFound } from "next/navigation"
import { getLocale, getTranslations } from "next-intl/server"

import { formPath, forms } from "@workspace/dex"
import { EmptyState } from "@workspace/ui/components/empty-state"
import { Button } from "@workspace/ui/components/shadcn-ui/button"

import {
  DexGridSkeleton,
  DexListSkeleton,
} from "@/components/dex/dex-skeletons"
import { FormCard } from "@/components/dex/form-card"
import { cardLabel } from "@/components/dex/words"
import { dexWords } from "@/lib/dex-labels"

// Fixture screen (spec 001, "How a screen is built", step 2): the Dex
// browse screen's states (spec 001, "States every view has") that sample
// data can't reach by filtering. Built into previews; production has none.

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dex.fixtures")
  return {
    title: t("statesTitle"),
    description: t("metaDescription"),
    robots: { index: false },
  }
}

export default async function DexStatesFixturePage() {
  if (process.env.VERCEL_ENV === "production") {
    notFound()
  }
  const t = await getTranslations("dex.fixtures")
  const locale = await getLocale()
  const { labels, typeNames, typeLang } = await dexWords()
  const noImage = forms.find((form) => form.key === "koraidon-limited-build")

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">{t("statesTitle")}</h1>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">{t("sections.loadingGrid")}</h2>
        <DexGridSkeleton count={6} label={labels.loading} />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">{t("sections.loadingList")}</h2>
        <DexListSkeleton count={4} label={labels.loading} />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">{t("sections.empty")}</h2>
        <EmptyState
          title={labels.emptyTitle}
          description={labels.emptyDescription}
        >
          <Button>{labels.emptyAction}</Button>
        </EmptyState>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">{t("sections.error")}</h2>
        <EmptyState
          role="alert"
          title={labels.errorTitle}
          description={labels.errorDescription}
        >
          <Button>{labels.retry}</Button>
        </EmptyState>
      </section>
      {noImage && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">{t("sections.noImage")}</h2>
          <div className="w-36">
            <FormCard
              form={noImage}
              href={`/${locale}${formPath(noImage)}` as Route}
              label={cardLabel(labels.card, noImage, typeNames, locale)}
              typeNames={typeNames}
              typeLang={typeLang}
              noImage={labels.noImage}
            />
          </div>
        </section>
      )}
    </div>
  )
}
