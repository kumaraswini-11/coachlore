import type * as React from "react"

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/shadcn-ui/empty"

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6"

/**
 * A state with nothing to show: an empty list, no results, a page that isn't
 * there, an error. It says what happened and what to do next. Built on
 * shadcn's Empty.
 *
 * - `title` is a heading: `titleAs` sets its level, so it fits the outline
 *   it sits in (`h1` when it is the whole page).
 * - `media`, optional, goes above the title (an icon, say).
 * - `children` are the actions: a link, a button.
 * - Other props reach the root, for example `role="alert"` for an error.
 */
function EmptyState({
  title,
  titleAs: Heading = "h2",
  description,
  media,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Empty>, "title"> & {
  title: React.ReactNode
  titleAs?: HeadingTag
  description?: React.ReactNode
  media?: React.ReactNode
}) {
  return (
    <Empty {...props}>
      <EmptyHeader>
        {media ? <EmptyMedia variant="icon">{media}</EmptyMedia> : null}
        <EmptyTitle>
          {/* A page's own title stands out from the description beneath it. */}
          <Heading className={Heading === "h1" ? "text-lg" : undefined}>
            {title}
          </Heading>
        </EmptyTitle>
        {description ? (
          <EmptyDescription>{description}</EmptyDescription>
        ) : null}
      </EmptyHeader>
      {children ? <EmptyContent>{children}</EmptyContent> : null}
    </Empty>
  )
}

export { EmptyState }
