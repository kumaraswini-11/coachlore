import { describe, expect, it } from "vitest"

import type { Sources } from "./fetch.ts"
import { issueBody, newestPins } from "./update-pins.ts"

const OLD = "a".repeat(40)
const NEW = "b".repeat(40)
const sources: Sources = {
  "api-data": { commit: OLD, date: "2026-09-01", imported: "2026-09-02" },
  sprites: { commit: OLD, date: "2026-09-01" },
  "smogon-usage": {
    month: "2026-08",
    cutoff: 1500,
    formats: ["gen9ou", "gen9doublesou"],
    imported: "2026-09-02",
  },
}

// A stand-in for GitHub's commits API and Smogon's files: api-data has a
// newer commit, sprites doesn't, and Smogon has every month up to 2026-09.
function stub(requests: string[]): typeof fetch {
  return (async (input: string | URL | Request) => {
    const url = String(input)
    requests.push(url)
    if (url.includes("api.github.com")) {
      const sha = url.includes("api-data") ? NEW : OLD
      return Response.json([
        { sha, commit: { committer: { date: "2026-10-07T14:22:43Z" } } },
      ])
    }
    const month = /stats\/(\d{4}-\d{2})\//.exec(url)?.[1] ?? ""
    return new Response(null, { status: month <= "2026-09" ? 200 : 404 })
  }) as typeof fetch
}

describe("newestPins", () => {
  it("moves each pin to the newest at least two weeks old", async () => {
    const requests: string[] = []
    const { sources: next, changes } = await newestPins(
      sources,
      new Date("2026-10-22T06:00:00Z"),
      stub(requests)
    )
    expect(changes).toEqual([
      { source: "api-data", from: OLD, to: NEW },
      { source: "smogon-usage", from: "2026-08", to: "2026-09" },
    ])
    expect(next["api-data"]).toEqual({ commit: NEW, date: "2026-10-07" })
    expect(next.sprites).toEqual(sources.sprites)
    // A new month isn't imported yet.
    expect(next["smogon-usage"]).toEqual({
      month: "2026-09",
      cutoff: 1500,
      formats: ["gen9ou", "gen9doublesou"],
    })
    // Commits from before two weeks ago only.
    expect(requests.find((url) => url.includes("api-data"))).toContain(
      "until=2026-10-08T06:00:00.000Z"
    )
  })

  it("skips a month that ended less than two weeks ago", async () => {
    const { changes } = await newestPins(
      sources,
      new Date("2026-10-10T06:00:00Z"),
      stub([])
    )
    // September ended ten days before: August stays.
    expect(changes.map((change) => change.source)).toEqual(["api-data"])
  })
})

describe("issueBody", () => {
  it("lists each change and the command to run", () => {
    const body = issueBody([{ source: "api-data", from: OLD, to: NEW }])
    expect(body).toContain("| api-data | `aaaaaaaaaaaa` | `bbbbbbbbbbbb` |")
    expect(body).toContain("bun run data:refresh")
  })
})
