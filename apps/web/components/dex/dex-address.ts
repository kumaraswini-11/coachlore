import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"

import { parseDexQuery, toDexQuery, type DexView } from "@/lib/dex-query"
import type { Named } from "@/lib/dex-types"

/** The view from the address, and how to write a new one. */
export type Address = {
  view: DexView
  /** The address's `q` as typed, spaces and all. */
  text: string
  write: (next: DexView, entry: "push" | "replace") => void
  /** The view as it is now: for a handler that mustn't change each render. */
  read: () => DexView
  /** The static page's stand-in: shows the forms given, as they are. */
  preview?: boolean
}

type Known = { games: readonly Named[]; abilities: readonly Named[] }

/** The games and abilities an address may name; any other is ignored. */
function useKnown({ games, abilities }: Known) {
  return useMemo(
    () => ({
      games: new Set(games.map((game) => game.key)),
      abilities: new Set(abilities.map((ability) => ability.key)),
    }),
    [games, abilities]
  )
}

/** Reads the view from the address as it is now. */
function useReadAddress(known: Known) {
  const sets = useKnown(known)
  return useCallback(
    () => parseDexQuery(new URLSearchParams(window.location.search), sets),
    [sets]
  )
}

/** Writes a view to the address: a new entry Back undoes, or the same one. */
function writeAddress(next: DexView, entry: "push" | "replace") {
  const written = toDexQuery(next)
  const url = written === "" ? window.location.pathname : `?${written}`
  if (entry === "push") {
    window.history.pushState(null, "", url)
  } else {
    window.history.replaceState(null, "", url)
  }
}

/**
 * The browser's view, held here and mirrored in the address, so a link or
 * Back brings it back. A change shows on the next paint: Next.js applies an
 * address change as a transition, so a control that waited for it painted
 * late (spec 003, criterion 5). The address still wins when it changes from
 * elsewhere: Back, Forward, or a link to another view of this page.
 */
export function useDexAddress(known: Known): Address {
  const params = useSearchParams()
  const sets = useKnown(known)
  const query = params.toString()
  const [state, setState] = useState(() => ({
    query,
    view: parseDexQuery(new URLSearchParams(query), sets),
  }))
  let view = state.view
  if (query !== state.query) {
    view = parseDexQuery(new URLSearchParams(query), sets)
    setState({ query, view })
  }
  const write = useCallback((next: DexView, entry: "push" | "replace") => {
    // Stored as the address will read back, so this write isn't taken for
    // a change from elsewhere.
    setState({
      query: new URLSearchParams(toDexQuery(next)).toString(),
      view: next,
    })
    writeAddress(next, entry)
  }, [])
  const read = useReadAddress(known)
  return { view, text: params.get("q") ?? "", write, read }
}

/**
 * The static preview's address: it shows `view` and renders no address, so
 * it's part of the static page, but what's typed or chosen before the forms
 * load is written to the address, which the browser opens with, so none of
 * it is lost.
 */
export function usePreviewAddress(known: Known, view: DexView): Address {
  const read = useReadAddress(known)
  return { view, text: "", write: writeAddress, read, preview: true }
}

// Whether the preview's search field had focus when the full browser took
// its place: the browser's field takes it back, so typing carries on.
let previewSearchFocused = false

/**
 * The search field's ref. The preview's field, focused as the browser
 * replaces it, hands its focus on, caret at the end. A cleanup runs before
 * the field leaves the page; the browser's layout effect runs in the same
 * commit, and the note is dropped after it, so leaving the page instead
 * never passes it to a later visit.
 */
export function useSearchHandOff(preview: boolean | undefined) {
  const search = useRef<HTMLInputElement>(null)
  useLayoutEffect(() => {
    const field = search.current
    if (preview) {
      return () => {
        previewSearchFocused = document.activeElement === field
        queueMicrotask(() => {
          previewSearchFocused = false
        })
      }
    }
    if (previewSearchFocused && field !== null) {
      previewSearchFocused = false
      field.focus()
      field.setSelectionRange(field.value.length, field.value.length)
    }
  }, [preview])
  return search
}
