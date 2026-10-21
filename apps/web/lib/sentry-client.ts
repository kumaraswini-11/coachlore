import { sentryOptions } from "@/lib/sentry-options"

type Sentry = typeof import("@/lib/sentry-browser")

// Integrations the browser doesn't use (spec 000, "Performance"): tracing and
// web vitals (speed is measured in spec 014), sessions (meaningless when the
// SDK loads on the first error), and Sentry's own global handlers
// (instrumentation-client.ts listens instead, so each error is sent once).
const UNUSED = new Set([
  "BrowserTracing",
  "WebVitals",
  "BrowserSession",
  "GlobalHandlers",
])

let loading: Promise<Sentry> | undefined

/**
 * Loads and starts Sentry in the browser, once, on the first error: the
 * strategy of Sentry's Loader Script, served from our own address. A page
 * without errors never loads it.
 */
function loadSentry(): Promise<Sentry> {
  loading ??= import("@/lib/sentry-browser").then((Sentry) => {
    Sentry.init({
      ...sentryOptions(
        {
          NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
          NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
        },
        "browser"
      ),
      integrations: (defaults) =>
        defaults.filter((integration) => !UNUSED.has(integration.name)),
    })
    return Sentry
  })
  return loading
}

/**
 * Sends an error to Sentry, with the reference the error page shows
 * (`digest`) when there is one.
 */
export function reportError(error: unknown): void {
  void loadSentry().then((Sentry) => {
    const digest =
      error instanceof Error && "digest" in error
        ? String(error.digest)
        : undefined
    Sentry.captureException(error, digest ? { tags: { digest } } : undefined)
  })
}
