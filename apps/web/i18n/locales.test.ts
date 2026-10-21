import { expect, it } from "vitest"

import { dir, endonym, languageName, otherLocales } from "@/i18n/locales"
import { routing } from "@/i18n/routing"

it("names each language in itself and in another", () => {
  expect(endonym("en")).toBe("English")
  expect(endonym("hi")).toBe("हिन्दी")
  expect(languageName("hi", "en")).toBe("Hindi")
})

it("offers the other languages", () => {
  expect(otherLocales("en")).toEqual(["hi"])
})

it.each(routing.locales)("gives %s the direction its script has", (locale) => {
  // The browser's own data, where it has it, agrees with our table.
  const info = new Intl.Locale(locale) as Intl.Locale & {
    getTextInfo?: () => { direction: "ltr" | "rtl" }
    textInfo?: { direction: "ltr" | "rtl" }
  }
  const direction = info.getTextInfo?.().direction ?? info.textInfo?.direction
  expect(dir(locale)).toBe(direction ?? dir(locale))
})
