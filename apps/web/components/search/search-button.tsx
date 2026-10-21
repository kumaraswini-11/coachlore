"use client"

import * as React from "react"
import { SearchIcon } from "lucide-react"
import type { Locale } from "next-intl"

import { Button } from "@workspace/ui/components/shadcn-ui/button"
import { Kbd } from "@workspace/ui/components/shadcn-ui/kbd"

import { OPEN_SEARCH_EVENT } from "@/components/shortcuts"
import type messages from "@/messages/en/main.json"

export type PaletteMessages = (typeof messages)["palette"]

// The dialog, the search and its formatter load on first open, so a page
// that's never searched carries only this button (spec 001's audit,
// performance). Hovering or focusing the button starts the download.
const loadDialog = () => import("@/components/search/search-dialog")
const SearchDialog = React.lazy(loadDialog)

// The shortcut as the keyboard labels it: ⌘ on a Mac, Ctrl elsewhere. The
// server can't tell, so it says Ctrl and a Mac corrects it on hydration.
const subscribeToNothing = () => () => {}
function useShortcutLabel() {
  return React.useSyncExternalStore(
    subscribeToNothing,
    () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K"),
    () => "Ctrl K"
  )
}

/**
 * The search palette's button in the top bar, and the palette (spec 001,
 * "The search palette"). It opens from the button, from Ctrl K or ⌘ K, and
 * from `/` while the single-key shortcuts are on (`OPEN_SEARCH_EVENT`).
 */
function SearchButton({
  locale,
  hint,
  messages,
}: {
  locale: Locale
  /** The button's name, also shown on wider screens. */
  hint: string
  messages: PaletteMessages
}) {
  const [open, setOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const shortcut = useShortcutLabel()

  const show = React.useCallback(() => {
    setMounted(true)
    setOpen(true)
  }, [])

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // Ctrl K or ⌘ K: not a single key, so always on (WCAG 2.1.4).
      if (
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        typeof event.key === "string" &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault()
        setMounted(true)
        setOpen((current) => !current)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener(OPEN_SEARCH_EVENT, show)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener(OPEN_SEARCH_EVENT, show)
    }
  }, [show])

  return (
    <>
      <Button
        variant="outline"
        aria-haspopup="dialog"
        aria-keyshortcuts="Control+K Meta+K"
        onClick={show}
        onPointerEnter={loadDialog}
        onFocus={loadDialog}
        className="size-11 justify-start text-muted-foreground md:w-72 md:px-3"
      >
        <SearchIcon aria-hidden />
        <span className="sr-only md:not-sr-only md:flex-1 md:truncate md:text-start">
          {hint}
        </span>
        <Kbd aria-hidden className="hidden md:inline-flex">
          {shortcut}
        </Kbd>
      </Button>
      {mounted ? (
        <React.Suspense fallback={null}>
          <SearchDialog
            open={open}
            onOpenChange={setOpen}
            locale={locale}
            messages={messages}
          />
        </React.Suspense>
      ) : null}
    </>
  )
}

export { SearchButton }
