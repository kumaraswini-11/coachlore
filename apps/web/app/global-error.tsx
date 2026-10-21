// Error boundaries must be Client Components.
"use client"

import { useEffect } from "react"

import "@workspace/ui/globals.css"

import { ErrorState } from "@/components/error-state"
import { ThemeProvider } from "@/components/theme-provider"
import { rootClassName } from "@/lib/fonts"
import { reportError } from "@/lib/sentry-client"
import { SITE } from "@/lib/site"

// Replaces the root layout when the root layout itself fails, so it brings
// its own <html>, <body>, styles, fonts and theme. Client Components can't
// export metadata, so the title is React's <title>.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    // Sent to Sentry if it happened in the browser; the server reports its
    // own errors (spec 000).
    reportError(error)
  }, [error])

  return (
    <html lang="en" suppressHydrationWarning className={rootClassName}>
      <body>
        <title>{`This page couldn’t load · ${SITE.name}`}</title>
        <ThemeProvider>
          <ErrorState digest={error.digest} retry={retry} />
        </ThemeProvider>
      </body>
    </html>
  )
}
