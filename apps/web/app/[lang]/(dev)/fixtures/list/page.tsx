import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"

import { LongList } from "@/components/fixtures/long-list"

// Fixture screen (spec 001, "How a screen is built", step 2), for the
// owner's review on a phone and for the end-to-end tests. Built into
// previews; production has none. One route per screen, so an address with
// any other name matches no page and gets the 404 (Next.js's loading docs,
// "Status codes": a notFound() after the response starts answers 200).

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("states")
  return {
    title: t("listTitle"),
    description: t("metaDescription"),
    robots: { index: false },
  }
}

export default async function ListFixturePage() {
  // Decided at build time: production builds this page as a 404.
  if (process.env.VERCEL_ENV === "production") {
    notFound()
  }
  const t = await getTranslations("states")

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">{t("listTitle")}</h1>
      <LongList row={(n) => t("row", { n })} />
    </div>
  )
}
