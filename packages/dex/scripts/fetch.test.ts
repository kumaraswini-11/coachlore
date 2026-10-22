/// <reference types="node" />
import { execFileSync } from "node:child_process"
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { fetchSources, readSources, type Sources } from "./fetch.ts"

const COMMIT = "0123456789abcdef0123456789abcdef01234567"
const sources: Sources = {
  "api-data": { commit: COMMIT, date: "2026-10-07" },
  sprites: { commit: COMMIT, date: "2026-10-07" },
  "smogon-usage": { month: "2026-09", cutoff: 1500, formats: ["gen9ou"] },
}

let work: string
let tarball: Uint8Array
let requests: string[]

// A stand-in for GitHub and Smogon: the tarball GitHub would give (one
// folder named after the commit), and a chaos file.
const download = (async (input: string | URL | Request) => {
  const url = String(input)
  requests.push(url)
  if (url.includes("codeload.github.com")) {
    return new Response(tarball)
  }
  if (url.includes("smogon.com")) {
    return new Response('{"data":{}}')
  }
  return new Response(null, { status: 404 })
}) as typeof fetch

beforeEach(() => {
  work = mkdtempSync(join(tmpdir(), "dex-fetch-"))
  requests = []
  const source = join(work, "source")
  const file = join(source, `api-data-${COMMIT}`, "data", "api", "v2")
  mkdirSync(file, { recursive: true })
  writeFileSync(join(file, "index.json"), "{}")
  execFileSync("tar", ["-czf", "api-data.tar.gz", `api-data-${COMMIT}`], {
    cwd: source,
  })
  tarball = readFileSync(join(source, "api-data.tar.gz"))
})

afterEach(() => {
  rmSync(work, { recursive: true, force: true })
})

describe("fetchSources", () => {
  it("downloads each pinned source once, then reuses it", async () => {
    const cache = join(work, "cache")
    const first = await fetchSources(sources, cache, download)
    expect(
      existsSync(join(first.apiData, "data", "api", "v2", "index.json"))
    ).toBe(true)
    expect(readFileSync(first.usage.gen9ou ?? "", "utf8")).toBe('{"data":{}}')
    expect(requests).toEqual([
      `https://codeload.github.com/PokeAPI/api-data/tar.gz/${COMMIT}`,
      "https://www.smogon.com/stats/2026-09/chaos/gen9ou-1500.json",
    ])

    const second = await fetchSources(sources, cache, download)
    expect(second).toEqual(first)
    expect(requests).toHaveLength(2)
  })

  it("fails on a missing file and keeps nothing half-written", async () => {
    const cache = join(work, "cache")
    const missing = {
      ...sources,
      "smogon-usage": { ...sources["smogon-usage"], month: "2026-10" },
    }
    const notFound = (async (input: string | URL | Request) =>
      String(input).includes("smogon.com")
        ? new Response(null, { status: 404 })
        : download(input)) as typeof fetch
    await expect(fetchSources(missing, cache, notFound)).rejects.toThrow("404")
    expect(existsSync(join(cache, "smogon", "2026-10"))).toBe(false)
  })

  it("refuses an archive that isn't the pinned commit", async () => {
    const other = {
      ...sources,
      "api-data": { commit: "f".repeat(40), date: "" },
    }
    await expect(
      fetchSources(other, join(work, "cache"), download)
    ).rejects.toThrow("not api-data-ffff")
    expect(existsSync(join(work, "cache", "api-data", "f".repeat(40)))).toBe(
      false
    )
  })
})

describe("sources.json", () => {
  it("pins each source to a full commit or a month", () => {
    const pinned = readSources()
    expect(pinned["api-data"].commit).toMatch(/^[0-9a-f]{40}$/)
    expect(pinned.sprites.commit).toMatch(/^[0-9a-f]{40}$/)
    expect(pinned["smogon-usage"].month).toMatch(/^\d{4}-\d{2}$/)
  })
})
