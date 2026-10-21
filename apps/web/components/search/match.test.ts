import { expect, it } from "vitest"

import { matches, normalize } from "@/components/search/match"

it("ignores case and accents", () => {
  expect(normalize("Pokémon")).toBe("pokemon")
  expect(normalize("Swords Dance")).toBe("swords dance")
  expect(matches("pokemon", "Pokémon")).toBe(true)
  expect(matches("FLABEBE", "Flabébé")).toBe(true)
  expect(matches("  rotom ", "Rotom-Wash")).toBe(true)
})

it("treats hyphens, spaces and apostrophes alike", () => {
  expect(matches("rotom wash", "Rotom-Wash")).toBe(true)
  expect(matches("farfetch'd", "Farfetch’d")).toBe(true)
})

it("matches nothing for an empty query", () => {
  expect(matches("", "Garchomp")).toBe(false)
  expect(matches("   ", "Garchomp")).toBe(false)
})

it("keeps Devanagari's vowel signs, which are letters", () => {
  expect(matches("गार", "गारचोम्प")).toBe(true)
  expect(matches("गार", "गुरचोम्प")).toBe(false)
})
