import createMiddleware from "next-intl/middleware"

import { routing } from "@/i18n/routing"

// The one Proxy (a file exports one function; Next.js's proxy docs). It sends
// an address without a language to the person's language: the one they read
// in before (the `lang` cookie), else their browser's best match, else
// English (spec 001, "Languages"; next-intl's middleware). Spec 006 adds the
// content security policy for signed-in pages after it.
export default createMiddleware(routing)

export const config = {
  // Every address but Next.js's own (`/_next`, `/api`, Vercel's), Sentry's
  // tunnel `/monitoring` (Sentry's docs say to "exclude" it), and the site's
  // files, each named whole, as Next.js's "Negative matching" example does.
  // So `/missing.txt` and `/apiary` still get a language and its not-found
  // page. proxy.test.ts fails when a file at the root of `app/` is missing
  // here.
  matcher:
    "/((?!(?:api|_next|_vercel|monitoring)(?:/|$)|(?:favicon\\.ico|icon\\.svg|apple-icon\\.png|manifest\\.webmanifest|robots\\.txt|sitemap\\.xml)$).*)",
}
