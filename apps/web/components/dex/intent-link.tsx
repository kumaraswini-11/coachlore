"use client"

import { useState, type ComponentProps } from "react"
import Link from "next/link"

/**
 * A link that prefetches only once it's likely to be followed: pointed at,
 * focused or touched. In a grid of cards, each link prefetching as it
 * scrolled in sent a request per card on every filter change (spec 003,
 * criterion 4); Next.js's prefetching guide, "Hover-triggered prefetch",
 * defers it like this. Before intent it prefetches nothing ("Using
 * `false` before intent disables the App Shell prefetch").
 */
export function IntentLink({
  onPointerEnter,
  onFocus,
  onTouchStart,
  ...props
}: Omit<ComponentProps<typeof Link>, "prefetch">) {
  const [intent, setIntent] = useState(false)
  return (
    <Link
      {...props}
      prefetch={intent}
      onPointerEnter={(event) => {
        setIntent(true)
        onPointerEnter?.(event)
      }}
      onFocus={(event) => {
        setIntent(true)
        onFocus?.(event)
      }}
      onTouchStart={(event) => {
        setIntent(true)
        onTouchStart?.(event)
      }}
    />
  )
}
