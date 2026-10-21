import type { NextConfig } from "next"
import { PHASE_DEVELOPMENT_SERVER } from "next/constants"
import { withSentryConfig } from "@sentry/nextjs/config"

import { realValue } from "./lib/sentry-options"

// Next.js's CSP "without nonces", which keeps pages static. Scripts need
// 'unsafe-inline' for Next.js's own and next-themes' inline scripts, and
// 'unsafe-eval' only in development; a nonce-based policy would make every
// page dynamic.
// https://nextjs.org/docs/app/guides/content-security-policy#without-nonces
function contentSecurityPolicy(isDev: boolean) {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ")
}

// A function of the phase, as Next.js documents for config that differs in
// development, rather than reading NODE_ENV.
export default function nextConfig(phase: string): NextConfig {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER
  const authToken = realValue(process.env.SENTRY_AUTH_TOKEN)

  // Sentry's build plugin (spec 000): source maps are uploaded when there's a
  // real token, then deleted from the build (the plugin's default), so the
  // browser never gets them. Reports from the browser go through our own
  // address, so the content security policy stays 'self'.
  return withSentryConfig(appConfig(isDev), {
    org: realValue(process.env.SENTRY_ORG),
    project: realValue(process.env.SENTRY_PROJECT),
    authToken,
    sourcemaps: { disable: !authToken },
    tunnelRoute: "/monitoring",
    // Quiet locally; on Vercel (CI is set) the upload's logs show.
    silent: !process.env.CI,
    telemetry: false,
  })
}

function appConfig(isDev: boolean): NextConfig {
  return {
    // Next.js 16's rendering model, the create-next-app default: dynamic by
    // default, with what's cached marked by `use cache`. See ADR 0003.
    cacheComponents: true,
    partialPrefetching: true,
    typedRoutes: true,
    poweredByHeader: false,
    async headers() {
      return [
        {
          source: "/(.*)",
          headers: [
            {
              key: "Content-Security-Policy",
              value: contentSecurityPolicy(isDev),
            },
            { key: "X-Content-Type-Options", value: "nosniff" },
            {
              key: "Referrer-Policy",
              value: "strict-origin-when-cross-origin",
            },
            {
              key: "Permissions-Policy",
              value:
                "camera=(), microphone=(), geolocation=(), browsing-topics=()",
            },
          ],
        },
      ]
    },
  }
}
