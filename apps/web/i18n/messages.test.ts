import { readdirSync } from "node:fs"
import { join } from "node:path"
import {
  parse,
  TYPE,
  type MessageFormatElement,
} from "@formatjs/icu-messageformat-parser"
import { describe, expect, it } from "vitest"

import { loadMessages } from "@/i18n/messages"
import { routing } from "@/i18n/routing"

// Every language's messages against English, the source (spec 001,
// criterion 11; ADR 0008). A missing, extra or broken message fails here,
// before it can show a key or the wrong language.

// Loaded as the app loads them, so a namespace file left out of
// loadMessages() shows up here as missing keys.
const MESSAGES: Record<string, unknown> = Object.fromEntries(
  await Promise.all(
    routing.locales.map(async (locale) => [locale, await loadMessages(locale)])
  )
)

type Flat = Record<string, string>

function flatten(value: unknown, prefix = ""): Flat {
  if (typeof value === "string") {
    return { [prefix]: value }
  }
  return Object.entries(value as Record<string, unknown>).reduce<Flat>(
    (all, [key, child]) => ({
      ...all,
      ...flatten(child, prefix ? `${prefix}.${key}` : key),
    }),
    {}
  )
}

/** Each argument's name and kind, and each plural's categories. */
function shape(elements: MessageFormatElement[]) {
  const args = new Set<string>()
  const plurals: Array<{ name: string; categories: string[] }> = []
  const selects: string[] = []
  const visit = (list: MessageFormatElement[]) => {
    for (const element of list) {
      if (element.type === TYPE.literal || element.type === TYPE.pound) {
        continue
      }
      if ("value" in element && typeof element.value === "string") {
        args.add(`${element.value}:${element.type}`)
      }
      if (element.type === TYPE.plural || element.type === TYPE.select) {
        if (element.type === TYPE.select) {
          selects.push(
            `${element.value}: ${Object.keys(element.options).sort().join(",")}`
          )
        }
        if (element.type === TYPE.plural) {
          plurals.push({
            name: element.value,
            categories: Object.keys(element.options),
          })
        }
        for (const option of Object.values(element.options)) {
          visit(option.value)
        }
      }
      if (element.type === TYPE.tag) {
        visit(element.children)
      }
    }
  }
  visit(elements)
  return { args: [...args].sort(), plurals, selects: selects.sort() }
}

const source = flatten(MESSAGES.en)

it("has a folder for each language in the routing, with English's files", () => {
  const folder = join(import.meta.dirname, "..", "messages")
  const languages = readdirSync(folder, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
  expect(languages.sort()).toEqual([...routing.locales].sort())
  const files = (locale: string) =>
    readdirSync(join(folder, locale))
      .filter((file) => file.endsWith(".json"))
      .sort()
  for (const locale of languages) {
    expect(files(locale), locale).toEqual(files("en"))
  }
})

describe.each(routing.locales)("the %s messages", (locale) => {
  const messages = flatten(MESSAGES[locale])

  it("have exactly English's keys", () => {
    expect(Object.keys(messages).sort()).toEqual(Object.keys(source).sort())
  })

  it("are never empty", () => {
    for (const [key, value] of Object.entries(messages)) {
      expect(value.trim(), key).not.toBe("")
    }
  })

  it.each(Object.keys(source))("%s parses with English's arguments", (key) => {
    const message = messages[key]
    expect(message, key).toBeDefined()
    const ours = shape(parse(message ?? ""))
    const theirs = shape(parse(source[key] ?? ""))
    expect(ours.args).toEqual(theirs.args)
    // A select's options are code values, the same in every language.
    expect(ours.selects).toEqual(theirs.selects)

    // Every plural has each category the language's CLDR rules use, and
    // `other`.
    const needed = new Intl.PluralRules(locale).resolvedOptions()
      .pluralCategories
    for (const plural of ours.plurals) {
      for (const category of new Set([...needed, "other"])) {
        expect(plural.categories, `${key}: ${category}`).toContain(category)
      }
    }
  })
})
