"use client"

import { usePathname } from "next/navigation"

import { buttonVariants } from "@workspace/ui/components/shadcn-ui/button"
import { cn } from "@workspace/ui/lib/utils"

import type { LanguageOption } from "@/components/shell/display-menu"
import { switchLocale } from "@/i18n/paths"

/**
 * The footer's switch to the page in the other languages, each written in
 * itself ("हिन्दी" on English pages), so the language is never only behind
 * an icon (spec 001, "The app shell"). Plain <a> links, not next/link: a
 * full page load is what lets the Proxy remember the choice (next-intl
 * writes the cookie only for a document request). Styled as shadcn's link
 * button, 44 px tall.
 */
function LanguageLinks({ languages }: { languages: LanguageOption[] }) {
  const pathname = usePathname()

  return (
    <ul className="flex flex-wrap gap-x-4">
      {languages.map((option) => (
        <li key={option.locale}>
          <a
            href={switchLocale(pathname, option.locale)}
            hrefLang={option.locale}
            lang={option.locale}
            className={cn(buttonVariants({ variant: "link" }), "h-11 px-0")}
          >
            {option.name}
          </a>
        </li>
      ))}
    </ul>
  )
}

export { LanguageLinks }
