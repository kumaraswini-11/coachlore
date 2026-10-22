import { describe, expect, it } from "vitest"

import { stableJson } from "./write.ts"

describe("stableJson", () => {
  it("gives the same bytes whatever order the keys were added in", () => {
    expect(stableJson({ b: 1, a: { d: 2, c: 3 } })).toBe(
      stableJson({ a: { c: 3, d: 2 }, b: 1 })
    )
  })

  it("puts each field on its own line and plain lists on one", () => {
    expect(
      stableJson({
        types: ["water", "electric"],
        moves: [
          ["hydro-pump", "machine"],
          ["thunderbolt", "level", 1],
        ],
        empty: [],
      })
    ).toBe(
      [
        "{",
        '  "empty": [],',
        '  "moves": [',
        '    ["hydro-pump", "machine"],',
        '    ["thunderbolt", "level", 1]',
        "  ],",
        '  "types": ["water", "electric"]',
        "}",
        "",
      ].join("\n")
    )
  })

  it("leaves out undefined fields, as JSON.stringify does", () => {
    expect(stableJson({ a: 1, b: undefined })).toBe('{\n  "a": 1\n}\n')
  })
})
