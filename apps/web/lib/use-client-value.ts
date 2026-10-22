import { useSyncExternalStore } from "react"

const subscribeToNothing = () => () => {}

/**
 * A value only the browser knows (whether the page has hydrated, the
 * keyboard's platform): `server` on the server and while hydrating,
 * `read()` after, without a mismatch. React's useSyncExternalStore over a
 * store that never changes.
 */
export function useClientValue<T>(read: () => T, server: T): T {
  return useSyncExternalStore(subscribeToNothing, read, () => server)
}
