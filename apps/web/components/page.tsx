import type * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

/**
 * A page's container, the same on every page: 16 px at the sides on a
 * phone and 24 px from 768 px, 24 px above and below. It fills the height
 * between the top bar and the footer (the shell's <main> is a column), so a
 * page's content can centre itself in it, as an empty state does. How wide
 * the content runs is each page's own.
 */
function Page({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex w-full flex-1 flex-col px-4 py-6 md:px-6", className)}
      {...props}
    />
  )
}

/** A page's h1: the same size and weight on every page. */
function PageTitle({
  className,
  children,
  ...props
}: React.ComponentProps<"h1">) {
  return (
    <h1 className={cn("text-2xl font-semibold", className)} {...props}>
      {children}
    </h1>
  )
}

/** A section's h2 within a page. */
function SectionTitle({
  className,
  children,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <h2 className={cn("text-lg font-medium", className)} {...props}>
      {children}
    </h2>
  )
}

export { Page, PageTitle, SectionTitle }
