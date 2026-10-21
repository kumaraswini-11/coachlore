"use client"

import * as React from "react"
import { SearchIcon } from "lucide-react"
import type { Locale } from "next-intl"

import { Button } from "@workspace/ui/components/shadcn-ui/button"
import { Kbd } from "@workspace/ui/components/shadcn-ui/kbd"

import {
  OPEN_SEARCH_EVENT,
  SHORTCUT_KEYS,
  useSingleKeyShortcuts,
} from "@/components/shortcuts"
import type messages from "@/messages/en/main.json"

export type PaletteMessages = (typeof messages)["palette"]
type ShortcutLabels = (typeof messages)["shell"]["searchShortcut"]

// The dialog, the search and its formatter load on first open, so a page
// that's never searched carries only this button (spec 001's audit,
// performance). Hovering or focusing the button starts the download; a
// failed download is retried on the next open.
const loadDialog = () => import("@/components/search/search-dialog")
const prefetch = () => {
  loadDialog().catch(() => {})
}
// React.lazy keeps a failed download's error, so each attempt gets its own.
const lazyDialog = () => React.lazy(loadDialog)
const firstDialog = lazyDialog()

// The shortcut as the keyboard labels it: ⌘ on a Mac, Ctrl elsewhere. The
// server can't tell, so it says the other and a Mac corrects it on
// hydration.
const subscribeToNothing = () => () => {}
function useIsMac() {
  return React.useSyncExternalStore(
    subscribeToNothing,
    () => /Mac|iPhone|iPad/.test(navigator.platform),
    () => false
  )
}

/**
 * Keeps a failed download of the dialog (offline, or a deploy that removed
 * its file) inside the palette: the page stays, and the next open tries
 * again. Without it the error would reach the root layout, which only
 * global-error.tsx catches (Next.js's error docs).
 */
class LoadBoundary extends React.Component<
  { onError: () => void; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onError()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

/**
 * The search palette's button in the top bar, and the palette (spec 001,
 * "The search palette"). It opens from the button, from Ctrl K or ⌘ K, and
 * from `/` while the single-key shortcuts are on (`OPEN_SEARCH_EVENT`).
 */
function SearchButton({
  locale,
  hint,
  shortcutLabels,
  messages,
}: {
  locale: Locale
  /** The button's name, also shown on wider screens. */
  hint: string
  shortcutLabels: ShortcutLabels
  messages: PaletteMessages
}) {
  const [open, setOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const [loader, setLoader] = React.useState(() => ({
    attempt: 0,
    Dialog: firstDialog,
  }))
  const SearchDialog = loader.Dialog
  const isMac = useIsMac()
  const [singleKeys] = useSingleKeyShortcuts()

  const show = React.useCallback(() => {
    setMounted(true)
    setOpen(true)
  }, [])

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // Ctrl K or ⌘ K: not a single key, so always on (WCAG 2.1.4). Not
      // Ctrl Shift K (Firefox's console), and not while the keys are held.
      if (
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        !event.shiftKey &&
        !event.repeat &&
        typeof event.key === "string" &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault()
        setMounted(true)
        setOpen((current) => !current)
      }
    }
    // `/` from shortcuts.tsx: taking it tells the shortcut a palette is here.
    function onOpenSearch(event: Event) {
      event.preventDefault()
      show()
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener(OPEN_SEARCH_EVENT, onOpenSearch)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpenSearch)
    }
  }, [show])

  return (
    <>
      <Button
        variant="outline"
        aria-haspopup="dialog"
        aria-keyshortcuts={
          singleKeys
            ? `Control+K Meta+K ${SHORTCUT_KEYS.search}`
            : "Control+K Meta+K"
        }
        onClick={show}
        onPointerEnter={prefetch}
        onFocus={prefetch}
        className="size-11 justify-center text-muted-foreground md:w-72 md:justify-start md:px-3"
      >
        <SearchIcon aria-hidden />
        <span className="sr-only md:not-sr-only md:flex-1 md:truncate md:text-start">
          {hint}
        </span>
        <Kbd aria-hidden className="hidden md:inline-flex">
          {isMac ? shortcutLabels.mac : shortcutLabels.other}
        </Kbd>
      </Button>
      {mounted ? (
        <LoadBoundary
          key={loader.attempt}
          onError={() => {
            setOpen(false)
            setMounted(false)
            setLoader((current) => ({
              attempt: current.attempt + 1,
              Dialog: lazyDialog(),
            }))
          }}
        >
          <React.Suspense fallback={null}>
            <SearchDialog
              open={open}
              onOpenChange={setOpen}
              locale={locale}
              messages={messages}
            />
          </React.Suspense>
        </LoadBoundary>
      ) : null}
    </>
  )
}

export { SearchButton }
