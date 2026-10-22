// Error boundaries must be Client Components.
"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"

import { ErrorState } from "@/components/error-state"
import { errorMessages } from "@/i18n/error-messages"
import { fill } from "@/i18n/fill"
import { reportError } from "@/lib/sentry-client"
import { pageTitle } from "@/lib/site"

// Catches errors in the pages and nested layouts below the root layout;
// errors in the root layout itself reach global-error.tsx. Its strings are
// the page's language's `errors` messages (i18n/error-messages.ts).
export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  const t = errorMessages(useParams().lang)

  useEffect(() => {
    // Sent to Sentry if it happened in the browser; the server reports its
    // own errors (spec 000).
    reportError(error)
  }, [error])

  // A Client Component can't export metadata, so the title is React's
  // <title>, as global-error.tsx's is.
  return (
    <>
      <title>{pageTitle(t.title)}</title>
      <ErrorState
        title={t.title}
        description={t.description}
        reference={
          error.digest ? fill(t.reference, { digest: error.digest }) : undefined
        }
        retryLabel={t.retry}
        retry={retry}
      />
    </>
  )
}
