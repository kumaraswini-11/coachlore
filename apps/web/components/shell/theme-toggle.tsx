"use client"

import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@workspace/ui/components/shadcn-ui/button"

import { useClientValue } from "@/lib/use-client-value"

// The theme is known only in the browser: before hydration the button
// claims no state, as next-themes' README asks ("Avoid Hydration Mismatch").
const mountedNow = () => true

/**
 * The top bar's theme button (spec 001, "The app shell"): one press switches
 * between light and dark, and next-themes remembers it. Until the first
 * press the page follows the device. A toggle button named for the dark
 * theme, pressed while it's on, as the shadcn site's own header switches
 * its theme with a Button.
 */
function ThemeToggle({ label }: { label: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useClientValue(mountedNow, false)
  const dark = resolvedTheme === "dark"

  return (
    <Button
      variant="outline"
      size="icon-touch"
      aria-pressed={mounted ? dark : undefined}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      <SunIcon aria-hidden className="scale-100 dark:scale-0" />
      <MoonIcon aria-hidden className="absolute scale-0 dark:scale-100" />
      <span className="sr-only">{label}</span>
    </Button>
  )
}

export { ThemeToggle }
