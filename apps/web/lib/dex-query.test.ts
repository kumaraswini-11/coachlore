import { describe, expect, it } from "vitest"

import {
  parseDexQuery,
  toDexQuery,
  type DexView,
  type Known,
} from "./dex-query"

// Spec 003, criterion 3: the view to and from the address.
const known: Known = {
  games: new Set(["scarlet-violet"]),
  abilities: new Set(["levitate"]),
  versions: new Set(["scarlet", "violet"]),
}
const parse = (query: string) =>
  parseDexQuery(new URLSearchParams(query), known)

describe("parseDexQuery and toDexQuery", () => {
  it("round-trips every filter, the sort and the view", () => {
    const query =
      "q=rot&type=steel,fairy&weak=ice&resist=fairy&game=scarlet-violet&gen=8,9&ability=levitate&hp=90-&spe=-80&total=500-600&forms=all&sort=-spe&view=list&version=scarlet"
    const view = parse(query)
    expect(view).toEqual<DexView>({
      filter: {
        q: "rot",
        type: ["steel", "fairy"],
        weak: ["ice"],
        resist: ["fairy"],
        game: "scarlet-violet",
        gen: [8, 9],
        ability: "levitate",
        stats: {
          hp: { min: 90 },
          speed: { max: 80 },
          total: { min: 500, max: 600 },
        },
        forms: "all",
      },
      sort: { key: "speed", descending: true },
      view: "list",
      version: "scarlet",
    })
    expect(toDexQuery(view)).toBe(query)
  })

  it("writes nothing for the default view", () => {
    const view = parse("")
    expect(view).toEqual<DexView>({
      filter: {},
      sort: { key: "number", descending: false },
      view: "grid",
    })
    expect(toDexQuery(view)).toBe("")
  })

  it("drops an unknown value and keeps the rest", () => {
    const view = parse(
      "type=fire,plasma&gen=10&game=pokemon-z&ability=wonder&hp=abc&atk=90-50&forms=shiny&sort=height&view=table&version=gold&weak=ice"
    )
    expect(view).toEqual<DexView>({
      filter: { type: ["fire"], weak: ["ice"] },
      sort: { key: "number", descending: false },
      view: "grid",
    })
  })

  it("keeps a name with spaces or symbols readable and safe", () => {
    const view = parse("q=Mr.%20Mime")
    expect(view.filter.q).toBe("Mr. Mime")
    expect(toDexQuery(view)).toBe("q=Mr.%20Mime")
    expect(toDexQuery(parse("q=a%26b"))).toBe("q=a%26b")
  })
})
