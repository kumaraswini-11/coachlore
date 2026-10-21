import "server-only"

import type { Locale } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"

import en from "@/messages/en/main.json"

/**
 * The Dex browser's words, for a Client Component: plain strings with
 * `{name}` arguments, and counts as one string per plural category (ADR
 * 0008, "The browser"; lib/plural.ts).
 */
export type DexLabels = (typeof en)["dex"]["browser"]
export type TypeNames = (typeof en)["types"]

export type DexWords = {
  locale: Locale
  labels: DexLabels
  typeNames: TypeNames
  /** The type names' language: English on a page whose names stay English. */
  typeLang: string
}

export async function dexWords(): Promise<DexWords> {
  const locale = await getLocale()
  const messages = (await getMessages()) as typeof en
  const typeNames = messages.types
  const english = Object.entries(typeNames).every(
    ([type, name]) => en.types[type as keyof TypeNames] === name
  )
  return {
    locale,
    labels: messages.dex.browser,
    typeNames,
    typeLang: english ? "en" : locale,
  }
}
