import type { ErrorEvent } from "@sentry/nextjs"

type Env = Readonly<Record<string, string | undefined>>

/**
 * A setting's value, or undefined when it's empty or still the
 * `<placeholder>` from .env.example (spec 000, "Placeholders count as unset").
 */
export function realValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed || trimmed.startsWith("<")) {
    return undefined
  }
  return trimmed
}

/**
 * Drops anything that could identify a person, as a second guard behind
 * `dataCollection` (ADR 0006, "Errors and logs"): the user, the machine's
 * name, and the request's cookies, headers, body and query string.
 */
export function stripPersonalData(event: ErrorEvent): ErrorEvent {
  delete event.user
  delete event.server_name
  if (event.request) {
    delete event.request.cookies
    delete event.request.headers
    delete event.request.data
    delete event.request.query_string
  }
  return event
}

// Span attributes that could identify a person or a machine.
const PERSONAL_ATTRIBUTE =
  /^(user\.|client\.|http\.client_ip|http\.(request|response)\.header\.|url\.query|host\.name)/

/**
 * The same guard for performance spans: Sentry 11 sends spans one by one
 * (`beforeSendSpan`; `beforeSendTransaction` is deprecated and ignored), so
 * personal attributes are dropped from each.
 */
export function stripSpan<T extends { attributes: object }>(span: T): T {
  const attributes = span.attributes as Record<string, unknown>
  for (const key of Object.keys(attributes)) {
    if (PERSONAL_ATTRIBUTE.test(key)) {
      delete attributes[key]
    }
  }
  return span
}

/**
 * The options every runtime passes to Sentry.init. The browser passes its
 * NEXT_PUBLIC_ values by name, since Next.js only inlines
 * `process.env.NEXT_PUBLIC_…` when it's written out in full, and reports
 * errors only: tracing in the browser costs main-thread time on every page
 * (measured in spec 000), and speed is measured separately (spec 014).
 */
export function sentryOptions(env: Env, runtime: "browser" | "server") {
  const dsn = realValue(env.NEXT_PUBLIC_SENTRY_DSN)
  const environment =
    env.NEXT_PUBLIC_VERCEL_ENV || env.VERCEL_ENV || "development"
  const serverTraces =
    environment === "production" ? 0.1 : environment === "preview" ? 1 : 0

  return {
    dsn,
    // No DSN (locally, or a copied .env.example): nothing is sent.
    enabled: dsn !== undefined,
    environment,
    ...(runtime === "server" ? { tracesSampleRate: serverTraces } : {}),
    // From version 11 these all default to on; Coachlore collects none.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      stackFrameVariables: false,
    },
    beforeSend: stripPersonalData,
    beforeSendSpan: stripSpan,
  }
}
