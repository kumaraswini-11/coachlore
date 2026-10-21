"use client"

import { usePathname } from "next/navigation"
import { CheckIcon, MoonIcon, SunIcon } from "lucide-react"
import type { Locale } from "next-intl"
import { useTheme } from "next-themes"

import { Button } from "@workspace/ui/components/shadcn-ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@workspace/ui/components/shadcn-ui/dropdown-menu"
import { Kbd } from "@workspace/ui/components/shadcn-ui/kbd"

import { SHORTCUT_KEYS, useSingleKeyShortcuts } from "@/components/shortcuts"
import { switchLocale } from "@/i18n/paths"

// 44 px targets (AGENTS.md), and a focus outline that shows on the popover:
// the items' own focus background is too faint (WCAG 2.4.7, 1.4.11).
const itemClassName =
  "min-h-11 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"

export type DisplayMenuLabels = {
  display: string
  theme: string
  light: string
  dark: string
  system: string
  shortcuts: string
  language: string
}

/** A language the page can be read in, named in itself ("हिन्दी"). */
export type LanguageOption = { locale: Locale; name: string }

/**
 * The display menu (spec 001, "The app shell"): the theme, the language, and
 * the single-key shortcuts (`d` and `/`, one setting). Each language is a link to the same page in it,
 * a full page load, so the Proxy remembers the choice in the `lang` cookie;
 * the current one is marked `aria-current`.
 */
function DisplayMenu({
  labels,
  locale,
  languages,
}: {
  labels: DisplayMenuLabels
  locale: Locale
  languages: LanguageOption[]
}) {
  const { theme, setTheme } = useTheme()
  const [shortcutsEnabled, setShortcutsEnabled] = useSingleKeyShortcuts()
  const pathname = usePathname()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="icon" className="size-11" />}
      >
        <SunIcon aria-hidden className="scale-100 dark:scale-0" />
        <MoonIcon aria-hidden className="absolute scale-0 dark:scale-100" />
        <span className="sr-only">{labels.display}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{labels.theme}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={theme}
            onValueChange={(value: string) => setTheme(value)}
          >
            <DropdownMenuRadioItem value="light" className={itemClassName}>
              {labels.light}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark" className={itemClassName}>
              {labels.dark}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system" className={itemClassName}>
              {labels.system}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>{labels.language}</DropdownMenuLabel>
          {languages.map((option) => {
            const current = option.locale === locale
            return (
              <DropdownMenuLinkItem
                key={option.locale}
                href={switchLocale(pathname, option.locale)}
                hrefLang={option.locale}
                lang={option.locale}
                aria-current={current ? "true" : undefined}
                className={itemClassName}
              >
                {option.name}
                {current ? <CheckIcon aria-hidden className="ms-auto" /> : null}
              </DropdownMenuLinkItem>
            )
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          className={itemClassName}
          checked={shortcutsEnabled}
          onCheckedChange={(checked) => setShortcutsEnabled(checked)}
        >
          {labels.shortcuts}
          <DropdownMenuShortcut className="flex gap-1">
            <Kbd>{SHORTCUT_KEYS.theme.toUpperCase()}</Kbd>
            <Kbd>{SHORTCUT_KEYS.search}</Kbd>
          </DropdownMenuShortcut>
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { DisplayMenu }
