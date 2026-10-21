// Error boundaries must be Client Components.
"use client"

import { useEffect } from "react"

import { ErrorState } from "@/components/error-state"
import { reportError } from "@/lib/sentry-client"

// Catches errors in the pages and nested layouts below the root layout;
// errors in the root layout itself reach global-error.tsx.
export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    // Reported to Sentry (spec 000), with the reference the page shows.
    reportError(error)
  }, [error])

  return <ErrorState digest={error.digest} retry={retry} />
}
