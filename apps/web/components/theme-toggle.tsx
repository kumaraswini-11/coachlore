"use client"

import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@workspace/ui/components/shadcn-ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@workspace/ui/components/shadcn-ui/dropdown-menu"

import { THEME_HOTKEY, useThemeHotkey } from "@/components/theme-hotkey"

// 44 px targets (AGENTS.md), and a focus outline that shows on the popover:
// the items' own focus background is too faint (WCAG 2.4.7, 1.4.11).
const itemClassName =
  "min-h-11 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [hotkeyEnabled, setHotkeyEnabled] = useThemeHotkey()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="icon" className="size-11" />}
      >
        <SunIcon aria-hidden className="scale-100 dark:scale-0" />
        <MoonIcon aria-hidden className="absolute scale-0 dark:scale-100" />
        <span className="sr-only">Theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={theme}
            onValueChange={(value: string) => setTheme(value)}
          >
            <DropdownMenuRadioItem value="light" className={itemClassName}>
              Light
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark" className={itemClassName}>
              Dark
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system" className={itemClassName}>
              System
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          className={itemClassName}
          checked={hotkeyEnabled}
          onCheckedChange={(checked) => setHotkeyEnabled(checked)}
        >
          Switch theme with{" "}
          <DropdownMenuShortcut>
            {THEME_HOTKEY.toUpperCase()}
          </DropdownMenuShortcut>
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { ThemeToggle }
