"use client"

import * as React from "react"
import { cn } from "cn"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  // Coachlore: leading-snug, not leading-none, so Devanagari isn't clipped.
  return (
    // A wrapper: the control comes in its children or `htmlFor`, where its
    // users write it, so the association can't be seen here.
    // eslint-disable-next-line jsx-a11y/label-has-associated-control
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-snug font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
