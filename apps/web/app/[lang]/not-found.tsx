import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"

import { EmptyState } from "@workspace/ui/components/empty-state"
import { buttonVariants } from "@workspace/ui/components/shadcn-ui/button"
import { cn } from "@workspace/ui/lib/utils"

import { localeHref } from "@/i18n/paths"
import { SITE } from "@/lib/site"

// For a page that calls `notFound()`. Unknown addresses don't come here:
// they match no page and get global-not-found.tsx, which Next.js serves as
// complete HTML. Under Cache Components a `notFound()` inside a page renders
// this in the browser only (spec 001's plan, "Not found"), so a page checks
// an unknown value in the Proxy instead where it can (spec 004).
//
// Next.js doesn't read metadata from a not-found page inside a segment (its
// not-found docs give it only to the root ones), so the title and
// description are React's <title> and <meta>, which it moves into <head>.
export default async function NotFound() {
  const locale = await getLocale()
  const t = await getTranslations("notFound")
  const title = `${t("title")} · ${SITE.name}`

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={t("metaDescription")} />
      <EmptyState
        titleAs="h1"
        title={t("title")}
        description={t("description")}
        className="px-4 py-6 md:px-6"
      >
        {/* A link styled as a button keeps its link role, as shadcn's
            Base UI Button docs advise. */}
        <Link
          href={localeHref(locale, "/")}
          className={cn(buttonVariants(), "h-11 px-4")}
        >
          {t("home")}
        </Link>
      </EmptyState>
    </>
  )
}
