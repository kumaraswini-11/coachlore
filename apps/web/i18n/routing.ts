import { defineRouting } from "next-intl/routing"

/**
 * The languages Coachlore is written in, and how addresses carry them
 * (ADR 0008). Adding a language starts here: the redirect, the cookie, the
 * browser's preferred language and the static pages all follow this list.
 */
export const routing = defineRouting({
  locales: ["en", "hi"],
  defaultLocale: "en",
  // Every page lives under its language, `/en/…` and `/hi/…` (ADR 0007).
  localePrefix: "always",
  // Remembers the language a person reads in, for a year.
  localeCookie: { name: "lang", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" },
  // hreflang comes from each page's metadata and the sitemap, once.
  alternateLinks: false,
})
