// Error boundaries must be Client Components.
"use client"

import { useEffect } from "react"

import "@workspace/ui/globals.css"

import { ErrorState } from "@/components/error-state"
import { ThemeProvider } from "@/components/theme-provider"
import { errorMessages } from "@/i18n/error-messages"
import { fill } from "@/i18n/fill"
import { rootClassName } from "@/lib/fonts"
import { reportError } from "@/lib/sentry-client"
import { pageTitle } from "@/lib/site"

// Replaces the root layout when the root layout itself fails, so it brings
// its own <html>, <body>, landmark, styles, fonts and theme. It sits outside
// [lang], so it can't know the language: it speaks English, the default
// (spec 001's plan, "Global error"). Client Components can't export
// metadata, so the title is React's <title>.
const t = errorMessages(undefined)
const title = pageTitle(t.title)

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
        <title>{title}</title>
        <ThemeProvider>
          <main className="flex min-h-svh flex-col">
            <ErrorState
              title={t.title}
              description={t.description}
              reference={
                error.digest
                  ? fill(t.reference, { digest: error.digest })
                  : undefined
              }
              retryLabel={t.retry}
              retry={retry}
            />
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
