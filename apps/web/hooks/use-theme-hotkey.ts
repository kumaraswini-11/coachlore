import * as React from "react"

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

/**
 * Whether pressing D toggles the theme. It's on until the viewer turns it
 * off: WCAG 2.1.4 (Character Key Shortcuts) requires a way to turn off a
 * shortcut that uses a single character key.
 */
function useThemeHotkey() {
  const enabled = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )

  return [enabled, setThemeHotkey] as const
}

export { useThemeHotkey }
