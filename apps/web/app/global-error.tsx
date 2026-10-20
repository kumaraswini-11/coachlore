// Error boundaries must be Client Components.
"use client"

import { useEffect } from "react"

import "@workspace/ui/globals.css"

import { ErrorState } from "@/components/error-state"
import { ThemeProvider } from "@/components/theme-provider"
import { rootClassName } from "@/lib/fonts"
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
    // Reaches the browser console until an error-reporting service is chosen.
    console.error(error)
  }, [error])

  return (
    <html lang="en" suppressHydrationWarning className={rootClassName}>
      <body>
        <title>{`Something went wrong · ${SITE.name}`}</title>
        <ThemeProvider>
          <ErrorState digest={error.digest} retry={retry} />
        </ThemeProvider>
      </body>
    </html>
  )
}
