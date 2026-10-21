import { describe, expect, it } from "vitest"

import { applyOverrides, type Override } from "./overrides.ts"

const collections = () => ({
  forms: [{ key: "rotom-wash", stats: { hp: 1 }, types: ["electric"] }],
})
const fix = (path: string, extra: Partial<Override> = {}): Override => ({
  path,
  value: 50,
  reason: "The source's value is a typo",
  link: "https://bulbapedia.bulbagarden.net/wiki/Rotom_(Pok%C3%A9mon)",
  ...extra,
})

describe("applyOverrides (criterion 5)", () => {
  it("sets the field the path names", () => {
    const data = collections()
    applyOverrides(data, [fix("forms/rotom-wash/stats/hp")])
    expect(data.forms[0]?.stats.hp).toBe(50)
  })

  it("fails on a path that matches no field", () => {
    for (const path of [
      "forms/rotom-wet/stats/hp",
      "forms/rotom-wash/stats/hitpoints",
      "moves/rotom-wash/stats/hp",
      "forms/rotom-wash",
    ]) {
      expect(() => applyOverrides(collections(), [fix(path)]), path).toThrow(
        "matches no field"
      )
    }
  })

  it("needs a reason and a link", () => {
    expect(() =>
      applyOverrides(collections(), [
        fix("forms/rotom-wash/stats/hp", { reason: " " }),
      ])
    ).toThrow("needs a reason")
    expect(() =>
      applyOverrides(collections(), [
        fix("forms/rotom-wash/stats/hp", { link: "" }),
      ])
    ).toThrow("needs a reason")
  })
})
