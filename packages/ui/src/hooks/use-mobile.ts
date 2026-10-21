import * as React from "react"

const MOBILE_BREAKPOINT = 768
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

// The registry's hook set state inside an effect, which React's lint rules
// reject; useSyncExternalStore reads the media query instead
// (https://react.dev/reference/react/useSyncExternalStore). On a phone it
// still renders once more after hydration, since the server can't know the
// width. 768 px is the registry Sidebar's own breakpoint; Coachlore's
// non-collapsible sidebar doesn't use it (spec 001, "The shell").
function subscribe(onChange: () => void) {
  const query = window.matchMedia(QUERY)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  )
}
