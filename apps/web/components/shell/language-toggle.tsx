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
 * `lang` cookie. From 768 px the language's name shows beside the icon,
 * written in itself, as the search button shows its label there. With a
 * third language this becomes a choice among them.
 */
function LanguageToggle({
  locale,
  name,
  label,
}: {
  locale: Locale
  /** The language's own name, "हिन्दी", shown from 768 px. */
  name: string
  /** "Read in हिन्दी", with the language's name marked as written in it. */
  label: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <a
      href={switchLocale(pathname, locale)}
      hrefLang={locale}
      className={cn(
        buttonVariants({ variant: "outline", size: "icon-touch" }),
        "md:w-auto md:px-3"
      )}
    >
      <LanguagesIcon aria-hidden />
      {/* The name a screen reader hears contains the shown one (WCAG
          2.5.3, Label in Name), so the shown one is hidden from it. */}
      <span className="sr-only">{label}</span>
      <span aria-hidden lang={locale} className="hidden md:inline">
        {name}
      </span>
    </a>
  )
}

export { LanguageToggle }
