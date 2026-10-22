import { describe, expect, it } from "vitest"

import { forms } from "@workspace/dex"

import en from "@/messages/en/main.json"
import hi from "@/messages/hi/main.json"

import { cardLabel, roman } from "./words"

describe("the Dex's words", () => {
  const steelix = forms.find((form) => form.key === "steelix")

  it("names a card by its number, name and types", () => {
    expect(
      steelix && cardLabel(en.dex.browser.card, steelix, en.types, "en")
    ).toBe("#0208 Steelix, Steel and Ground")
    expect(
      steelix && cardLabel(hi.dex.browser.card, steelix, hi.types, "hi")
    ).toBe("#0208 Steelix, Steel और Ground")
  })

  it("numbers generations as the games do", () => {
    expect([1, 4, 9].map(roman)).toEqual(["I", "IV", "IX"])
  })
})
