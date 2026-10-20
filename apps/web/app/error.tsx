// Error boundaries must be Client Components.
"use client"

import { useEffect } from "react"

import { ErrorState } from "@/components/error-state"

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
    // Reaches the browser console until an error-reporting service is chosen.
    console.error(error)
  }, [error])

  return <ErrorState digest={error.digest} retry={retry} />
}
