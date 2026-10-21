// The only parts of Sentry the browser uses, named here so the lazily loaded
// chunk (lib/sentry-client.ts) keeps just these and what they need.
export { captureException, init } from "@sentry/nextjs"
