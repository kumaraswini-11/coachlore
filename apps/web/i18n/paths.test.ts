import { existsSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { localeHref, pageAlternates, PAGES, switchLocale } from "@/i18n/paths"

const APP = join(import.meta.dirname, "..", "app", "[lang]")

it.each(PAGES)("%s has a page under app/[lang]", (path) => {
  // A page may sit in a route group, such as `(site)`; check both forms.
  const direct = join(APP, ...path.split("/").filter(Boolean), "page.tsx")
  const inGroup = join(
    APP,
    "(site)",
    ...path.split("/").filter(Boolean),
    "page.tsx"
  )
  expect(existsSync(direct) || existsSync(inGroup), path).toBe(true)
})

describe("addresses", () => {
  it("puts the language first", () => {
    expect(localeHref("hi", "/")).toBe("/hi")
  })

  it("switches a page to another language", () => {
    expect(switchLocale("/en/about", "hi")).toBe("/hi/about")
    expect(switchLocale("/hi", "en")).toBe("/en")
    expect(switchLocale("/en/dex/rotom/wash", "hi")).toBe("/hi/dex/rotom/wash")
  })

  it("names every language and the default for search engines", () => {
    expect(pageAlternates("hi", "/")).toEqual({
      canonical: "/hi",
      languages: { en: "/en", hi: "/hi", "x-default": "/en" },
    })
  })
})
