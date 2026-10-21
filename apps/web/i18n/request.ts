import { notFound } from "next/navigation"
import * as rootParams from "next/root-params"
import { hasLocale } from "next-intl"
import { getRequestConfig } from "next-intl/server"

import { loadMessages } from "@/i18n/messages"
import { routing } from "@/i18n/routing"

// The language comes from the address (`app/[lang]`), read through root
// params, which keeps pages static (next-intl's routing setup). The global
// not-found page sits outside `app/[lang]`, so there it's the language the
// Proxy chose for the request (next-intl's `requestLocale`), or the default
// for an address the Proxy skips (`/api/…`), which has none. A language
// passed in explicitly (`getTranslations({ locale })`) is checked the same
// way.
export default getRequestConfig(async ({ locale, requestLocale }) => {
  const requested =
    locale ??
    (await rootParams.lang()) ??
    (await requestLocale) ??
    routing.defaultLocale
  if (!hasLocale(routing.locales, requested)) {
    notFound()
  }

  return {
    locale: requested,
    messages: await loadMessages(requested),
    // Dates rendered on the server come out the same on every machine; a
    // viewer's own time zone is applied in the browser (spec 001, "Times").
    timeZone: "UTC",
  }
})
