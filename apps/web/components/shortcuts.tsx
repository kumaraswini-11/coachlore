"use client"

import * as React from "react"
import { useTheme } from "next-themes"

/**
 * The single-key shortcuts: `d` switches the theme and `/` opens search
 * (spec 001, "Single-key shortcuts"). WCAG 2.1.4 (Character Key Shortcuts)
 * requires a way to turn them off: they're on until the person turns them
 * off in the display menu, and the choice is remembered per browser.
 */
export const SHORTCUT_KEYS = { theme: "d", search: "/" } as const

/** The event that opens the search palette, from `/` or anywhere else. */
export const OPEN_SEARCH_EVENT = "coachlore:open-search"

const STORAGE_KEY = "single-key-shortcuts"
// The setting before it covered `/` too; a stored "off" is carried over.
const OLD_STORAGE_KEY = "theme-hotkey"
const CHANGE_EVENT = "single-key-shortcuts-change"

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
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      return stored !== "off"
    }
    return window.localStorage.getItem(OLD_STORAGE_KEY) !== "off"
  } catch {
    return fallback
  }
}

function setShortcuts(enabled: boolean) {
  fallback = enabled
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off")
    window.localStorage.removeItem(OLD_STORAGE_KEY)
  } catch {
    // Storage is unavailable; `fallback` keeps the choice for this visit.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

/** Whether the single-key shortcuts are on, and a function to set them. */
export function useSingleKeyShortcuts() {
  const enabled = React.useSyncExternalStore(subscribe, getSnapshot, () => true)
  return [enabled, setShortcuts] as const
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

/** Listens for the shortcuts while they're on; renders nothing. */
export function Shortcuts() {
  const { resolvedTheme, setTheme } = useTheme()
  const [enabled] = useSingleKeyShortcuts()

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
      // Chrome's autofill sends keydown events without a `key`, whatever the
      // types say.
      if (typeof event.key !== "string" || isTypingTarget(event.target)) {
        return
      }

      const key = event.key.toLowerCase()
      if (key === SHORTCUT_KEYS.theme) {
        setTheme(resolvedTheme === "dark" ? "light" : "dark")
      } else if (key === SHORTCUT_KEYS.search) {
        // Only a page with a palette takes `/` (its search button cancels
        // this event); elsewhere Firefox's quick find keeps it.
        const unhandled = window.dispatchEvent(
          new Event(OPEN_SEARCH_EVENT, { cancelable: true })
        )
        if (!unhandled) {
          event.preventDefault()
        }
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [enabled, resolvedTheme, setTheme])

  return null
}
