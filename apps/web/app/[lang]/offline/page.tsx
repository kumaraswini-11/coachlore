import type { Metadata } from "next"
import Link from "next/link"
import { CloudOffIcon } from "lucide-react"
import { getLocale, getTranslations } from "next-intl/server"

import { EmptyState } from "@workspace/ui/components/empty-state"
import { buttonVariants } from "@workspace/ui/components/shadcn-ui/button"
import { cn } from "@workspace/ui/lib/utils"

import { pageMetadata } from "@/i18n/metadata"
import { localeHref } from "@/i18n/paths"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("offline")
  return {
    ...(await pageMetadata("/offline", {
      title: t("title"),
      description: t("metaDescription"),
    })),
    // The page the offline Dex (spec 003) serves for a page it hasn't
    // saved: not one to find in a search.
    robots: { index: false },
  }
}

// It links home rather than to the Dex until the Dex exists (spec 001,
// rule 4); spec 003 changes the link to "Open the Dex".
export default async function OfflinePage() {
  const locale = await getLocale()
  const t = await getTranslations("offline")

  return (
    <EmptyState
      media={<CloudOffIcon aria-hidden />}
      titleAs="h1"
      title={t("title")}
      description={t("description")}
      className="p-6"
    >
      <Link
        href={localeHref(locale, "/")}
        className={cn(buttonVariants(), "h-11 px-4")}
      >
        {t("home")}
      </Link>
    </EmptyState>
  )
}
