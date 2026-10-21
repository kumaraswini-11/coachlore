import type * as React from "react"

/**
 * Coachlore's mark, the Playbook: an open book (the lore) with one play
 * drawn across it (the coach). One colour, `currentColor`, on Lucide's
 * 24 × 24 grid, so it follows the theme. The same drawing as app/icon.svg.
 * Decorative beside the name, so hidden from screen readers.
 */
function LogoMark(props: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path
        strokeWidth={2}
        d="M12 6.25C9.75 4.75 6.75 4.25 2.75 4.5v14c4-.25 7 .25 9.25 1.75 2.25-1.5 5.25-2 9.25-1.75v-14c-4-.25-7 .25-9.25 1.75z"
      />
      <path strokeWidth={1.75} d="M7.25 14.25C9 10 14 9.25 16.5 11.75" />
      <path strokeWidth={1.75} d="M14 11.5 16.75 12 17 9.25" />
      <circle cx="6.5" cy="15" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

export { LogoMark }
