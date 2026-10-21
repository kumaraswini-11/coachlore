import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/shadcn-ui/breadcrumb"

import { localeHref } from "@/i18n/paths"

/**
 * Home, then this page (spec 001, "About, Legal": Breadcrumb). The
 * separator flips with the direction (the registry's `rtl:rotate-180`).
 */
async function PageCrumbs({ current }: { current: string }) {
  const locale = await getLocale()
  const t = await getTranslations("shell")

  return (
    <Breadcrumb aria-label={t("breadcrumb")}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            render={<Link href={localeHref(locale, "/")} />}
            className="inline-flex min-h-11 items-center"
          >
            {t("homeCrumb")}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{current}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export { PageCrumbs }
