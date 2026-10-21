import type { Locale } from "next-intl"

import { routing } from "@/i18n/routing"
import en from "@/messages/en/errors.json"
import hi from "@/messages/hi/errors.json"

export type ErrorMessages = typeof en

// English's types are its exact strings (the generated declaration that
// types ICU arguments), so the other languages are cast; messages.test.ts
// checks they have the same keys and arguments.
//
// The error pages are Client Components on every page, so they read their
// few messages here rather than through next-intl's formatter, which would
// add its ICU code to every page's JavaScript. That holds while the `errors`
// messages stay plain text with simple `{name}` arguments, which
// messages.test.ts checks.
const ERRORS: Record<Locale, ErrorMessages> = { en, hi: hi as ErrorMessages }

/** The error messages for a language from the address, else English. */
export function errorMessages(lang: string | string[] | undefined) {
  const locale = (routing.locales as readonly string[]).includes(String(lang))
    ? (lang as Locale)
    : routing.defaultLocale
  return ERRORS[locale]
}

/** A plain message with its `{name}` arguments filled in. */
export function fill(message: string, values: Record<string, string>) {
  return message.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? (values[name] ?? match) : match
  )
}
