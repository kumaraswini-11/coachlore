import * as React from "react"
import { useTheme } from "next-themes"

/**
 * The single-key shortcut that switches between light and dark. WCAG 2.1.4
 * (Character Key Shortcuts) requires a way to turn it off: it's on until the
 * viewer turns it off in the theme menu, and the choice is remembered per
 * browser.
 */
const THEME_HOTKEY = "d"

const STORAGE_KEY = "theme-hotkey"
const CHANGE_EVENT = "theme-hotkey-change"

// Holds the choice when localStorage is unavailable (a private window, say).
let fallback = true

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange)
  window.addEventListener(CHANGE_EVENT, onChange)

  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener(CHANGE_EVENT, onChange)
  }
}

function getSnapshot() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "off"
  } catch {
    return fallback
  }
}

function getServerSnapshot() {
  return true
}

function setThemeHotkey(enabled: boolean) {
  fallback = enabled
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off")
  } catch {
    // Storage is unavailable; `fallback` keeps the choice for this visit.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

/** Whether the shortcut is on, and a function to turn it on or off. */
function useThemeHotkey() {
  const enabled = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )

  return [enabled, setThemeHotkey] as const
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

/** Listens for the shortcut while it's on; renders nothing. */
function ThemeHotkey() {
  const { resolvedTheme, setTheme } = useTheme()
  const [enabled] = useThemeHotkey()

  React.useEffect(() => {
    if (!enabled) {
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) {
        return
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (event.key.toLowerCase() !== THEME_HOTKEY) {
        return
      }

      if (isTypingTarget(event.target)) {
        return
      }

      setTheme(resolvedTheme === "dark" ? "light" : "dark")
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [enabled, resolvedTheme, setTheme])

  return null
}

export { THEME_HOTKEY, ThemeHotkey, useThemeHotkey }
