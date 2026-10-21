import { parse, TYPE } from "@formatjs/icu-messageformat-parser"
import { createTranslator } from "next-intl"
import { describe, expect, it } from "vitest"

import { errorMessages, fill } from "@/i18n/error-messages"
import { routing } from "@/i18n/routing"

describe.each(routing.locales)("the %s error messages", (locale) => {
  const messages = errorMessages(locale)
  const t = createTranslator({
    locale,
    messages: { errors: messages },
    namespace: "errors",
  })

  it.each(Object.entries(messages))(
    "%s is plain text with simple arguments, filled as ICU would",
    (key, message) => {
      for (const element of parse(message)) {
        expect([TYPE.literal, TYPE.argument]).toContain(element.type)
      }
      const values = { digest: "abc123" }
      expect(fill(message, values)).toBe(
        t(key as keyof typeof messages, values)
      )
    }
  )
})

it("falls back to English for an address without a language", () => {
  expect(errorMessages(undefined)).toBe(errorMessages("en"))
  expect(errorMessages("fr")).toBe(errorMessages("en"))
  expect(errorMessages("hi")).not.toBe(errorMessages("en"))
})
