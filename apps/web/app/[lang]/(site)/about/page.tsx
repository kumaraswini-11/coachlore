import type { Metadata } from "next"
import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"

import { buttonVariants } from "@workspace/ui/components/shadcn-ui/button"
import { cn } from "@workspace/ui/lib/utils"

import { PageCrumbs } from "@/components/page-crumbs"
import { pageMetadata } from "@/i18n/metadata"
import { localeHref } from "@/i18n/paths"

// The project's own repository, shown as "The code on GitHub".
const SOURCE = "https://github.com/kumaraswini-11/coachlore"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("about")
  return pageMetadata("/about", {
    title: t("title"),
    description: t("metaDescription"),
  })
}

// What Coachlore is, who makes it, and its credits (spec 001, "About,
// Legal"): plain text, server-rendered, no client code.
export default async function AboutPage() {
  const locale = await getLocale()
  const t = await getTranslations("about")
  const link = cn(buttonVariants({ variant: "link" }), "h-11 px-0")

  return (
    <article className="mx-auto flex max-w-prose flex-col gap-6 p-4 md:p-6">
      <PageCrumbs current={t("title")} />
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p>{t("intro")}</p>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">{t("leaguesHeading")}</h2>
        <p>{t("leagues")}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">{t("madeHeading")}</h2>
        <p>{t("made")}</p>
        <a href={SOURCE} className={cn(link, "self-start")}>
          {t("source")}
        </a>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">{t("creditsHeading")}</h2>
        <p>{t("credits")}</p>
        <Link
          href={localeHref(locale, "/legal")}
          className={cn(link, "self-start")}
        >
          {t("legalLink")}
        </Link>
      </section>
    </article>
  )
}
