import { describe, expect, it } from "vitest"

import { routing } from "@/i18n/routing"
import en from "@/messages/en/main.json"
import hi from "@/messages/hi/main.json"

import { plural, type PluralForms } from "./plural"

const MESSAGES = { en, hi }

// Every message the Dex's browser counts with, by its path.
const COUNTED = ["count", "showResults"] as const

describe("plural", () => {
  it("has every plural category each language needs", () => {
    for (const locale of routing.locales) {
      const needed = new Intl.PluralRules(locale).resolvedOptions()
        .pluralCategories
      for (const key of COUNTED) {
        const forms = MESSAGES[locale].dex.browser[key] as PluralForms
        for (const category of needed) {
          expect(
            forms[category],
            `${locale} dex.browser.${key}.${category}`
          ).toBeTypeOf("string")
        }
      }
    }
  })

  it("picks the language's category and formats the number", () => {
    const forms: PluralForms = { one: "{count} form", other: "{count} forms" }
    expect(plural(forms, 1, "en")).toBe("1 form")
    expect(plural(forms, 1339, "en")).toBe("1,339 forms")
    expect(plural(forms, 1339, "hi")).toBe("1,339 forms")
  })
})
