"use client"

import * as React from "react"

import { Button } from "@workspace/ui/components/shadcn-ui/button"

/**
 * The live update state (spec 001, "States every view has"): a new pick
 * appears in place and is announced politely, once. The picks come from the
 * server already translated, names isolated in their own language.
 */
function LiveUpdate({
  picks,
  actionLabel,
}: {
  picks: React.ReactNode[]
  actionLabel: string
}) {
  const [shown, setShown] = React.useState(0)

  return (
    <div className="flex flex-col items-start gap-3">
      <Button
        variant="outline"
        className="h-11"
        disabled={shown >= picks.length}
        onClick={() => setShown((count) => Math.min(count + 1, picks.length))}
      >
        {actionLabel}
      </Button>
      <ol className="flex flex-col gap-1 text-sm">
        {picks.slice(0, shown).map((pick, index) => (
          <li key={index}>{pick}</li>
        ))}
      </ol>
      {/* Says only the newest pick, once (WCAG 4.1.3). */}
      <p aria-live="polite" className="sr-only">
        {shown > 0 ? picks[shown - 1] : null}
      </p>
    </div>
  )
}

export { LiveUpdate }
