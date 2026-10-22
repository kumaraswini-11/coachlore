import type { Metadata } from "next"
import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"

import { buttonVariants } from "@workspace/ui/components/shadcn-ui/button"
import { cn } from "@workspace/ui/lib/utils"

import { Page, PageTitle, SectionTitle } from "@/components/page"
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
  const link = cn(
    buttonVariants({ variant: "link", size: "touch" }),
    "self-start px-0"
  )

  return (
    <Page>
      <article className="mx-auto flex w-full max-w-prose flex-col gap-6">
        <PageCrumbs current={t("title")} />
        <PageTitle>{t("title")}</PageTitle>
        <p>{t("intro")}</p>

        <section className="flex flex-col gap-2">
          <SectionTitle>{t("leaguesHeading")}</SectionTitle>
          <p>{t("leagues")}</p>
        </section>

        <section className="flex flex-col gap-2">
          <SectionTitle>{t("madeHeading")}</SectionTitle>
          <p>{t("made")}</p>
          <a href={SOURCE} className={link}>
            {t("source")}
          </a>
        </section>

        <section className="flex flex-col gap-2">
          <SectionTitle>{t("creditsHeading")}</SectionTitle>
          <p>{t("credits")}</p>
          <Link href={localeHref(locale, "/legal")} className={link}>
            {t("legalLink")}
          </Link>
        </section>
      </article>
    </Page>
  )
}
