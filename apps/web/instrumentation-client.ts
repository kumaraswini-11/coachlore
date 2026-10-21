import { reportError } from "@/lib/sentry-client"

// Error reporting in the browser (spec 000). Next.js runs this before
// hydration and asks that it stay lightweight, so it only listens: Sentry
// itself loads on the first error (lib/sentry-client.ts).
window.addEventListener("error", (event) => {
  reportError(event.error ?? event.message)
})

window.addEventListener("unhandledrejection", (event) => {
  reportError(event.reason)
})
