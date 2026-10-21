"use client"

import type * as React from "react"
import { usePathname } from "next/navigation"
import { LanguagesIcon } from "lucide-react"
import type { Locale } from "next-intl"

import { buttonVariants } from "@workspace/ui/components/shadcn-ui/button"
import { cn } from "@workspace/ui/lib/utils"

import { switchLocale } from "@/i18n/paths"

/**
 * The top bar's language button (spec 001, "The app shell"): one press opens
 * the same page in the other language. A plain <a>, as in the footer's
 * links: a full page load is what lets the Proxy remember the choice in the
 * `lang` cookie. With a third language this becomes a choice among them.
 */
function LanguageToggle({
  locale,
  label,
}: {
  locale: Locale
  /** "Read in हिन्दी", with the language's name marked as written in it. */
  label: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <a
      href={switchLocale(pathname, locale)}
      hrefLang={locale}
      className={cn(
        buttonVariants({ variant: "outline", size: "icon" }),
        "size-11"
      )}
    >
      <LanguagesIcon aria-hidden />
      <span className="sr-only">{label}</span>
    </a>
  )
}

export { LanguageToggle }
