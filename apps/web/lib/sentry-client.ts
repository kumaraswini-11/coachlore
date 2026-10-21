import { sentryOptions } from "@/lib/sentry-options"

type Sentry = typeof import("@/lib/sentry-browser")

// Integrations the browser doesn't use (spec 000, "Performance"): tracing and
// web vitals (speed is measured in spec 014), sessions (meaningless when the
// SDK loads on the first error), breadcrumbs (never sent: their addresses can
// carry personal data), and Sentry's own global handlers
// (instrumentation-client.ts listens instead, so each error is sent once).
const UNUSED = new Set([
  "BrowserTracing",
  "WebVitals",
  "BrowserSession",
  "Breadcrumbs",
  "GlobalHandlers",
])

let loading: Promise<Sentry> | undefined

/**
 * Loads and starts Sentry in the browser, once, on the first error: the
 * strategy of Sentry's Loader Script, served from our own address. A page
 * without errors never loads it.
 */
function loadSentry(): Promise<Sentry> {
  loading ??= import("@/lib/sentry-browser")
    .then((Sentry) => {
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
    .catch((error: unknown) => {
      // Forget a failed load (offline, or a chunk a new deploy replaced), so
      // the next error tries again.
      loading = undefined
      throw error
    })
  return loading
}

/**
 * Whether an error came from the server. Next.js gives those a `digest` and
 * shows the browser only a generic message; the server has already reported
 * the real error with its stack (`onRequestError` in instrumentation.ts).
 */
export function isServerError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    Boolean(error.digest)
  )
}

/**
 * Sends an error that happened in the browser to Sentry; errors from the
 * server are not sent twice. Reporting never throws: if Sentry can't load,
 * the report is dropped instead of being raised as another error.
 */
export function reportError(error: unknown): void {
  if (isServerError(error)) {
    return
  }
  loadSentry()
    .then((Sentry) => {
      Sentry.captureException(error)
    })
    .catch(() => {})
}
