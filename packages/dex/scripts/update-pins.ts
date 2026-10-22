/// <reference types="node" />
/**
 * Moves each pin in sources.json to the newest one at least two weeks old
 * (AGENTS.md, "Versions"; ADR 0009): PokéAPI's api-data and sprites to
 * their newest commit that old, Smogon's usage to the newest month that
 * ended that long ago and has every format's file.
 *
 *   bun scripts/update-pins.ts           writes sources.json
 *   bun scripts/update-pins.ts --check   writes nothing; prints the changes
 *                                        as Markdown (the monthly job's issue)
 *
 * It exits 0 either way; with --check and no change it prints nothing.
 */
import { writeFileSync } from "node:fs"
import { join } from "node:path"

import { readSources, type Sources } from "./fetch.ts"
import { stableJson } from "./import/write.ts"

const DAY = 24 * 60 * 60 * 1000
const MIN_AGE_DAYS = 14

type PinChange = { source: string; from: string; to: string }

type Fetch = typeof fetch

/** The newest commit on the repository's default branch at least 14 days old. */
async function newestCommit(
  repository: string,
  now: Date,
  download: Fetch
): Promise<{ commit: string; date: string }> {
  const until = new Date(now.getTime() - MIN_AGE_DAYS * DAY).toISOString()
  const url = `https://api.github.com/repos/${repository}/commits?sha=master&until=${until}&per_page=1`
  // Unauthenticated: two requests a month, well within GitHub's 60 an hour.
  const response = await download(url, {
    headers: { accept: "application/vnd.github+json" },
  })
  if (!response.ok) {
    throw new Error(`${url} answered ${response.status}.`)
  }
  const [latest] = (await response.json()) as {
    sha: string
    commit: { committer: { date: string } }
  }[]
  if (latest === undefined) {
    throw new Error(`${repository} has no commit before ${until}.`)
  }
  return { commit: latest.sha, date: latest.commit.committer.date.slice(0, 10) }
}

/**
 * The newest month, back from now, that ended at least 14 days ago and has
 * a chaos file for every format at the cutoff.
 */
async function newestMonth(
  usage: Sources["smogon-usage"],
  now: Date,
  download: Fetch
): Promise<string> {
  for (let back = 1; back <= 12; back++) {
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1)
    )
    const end = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1)
    )
    if (now.getTime() - end.getTime() < MIN_AGE_DAYS * DAY) {
      continue
    }
    const month = start.toISOString().slice(0, 7)
    const found = await Promise.all(
      usage.formats.map(async (format) => {
        const url = `https://www.smogon.com/stats/${month}/chaos/${format}-${usage.cutoff}.json`
        return (await download(url, { method: "HEAD" })).ok
      })
    )
    if (found.every(Boolean)) {
      return month
    }
  }
  throw new Error("Smogon has no month with every format in the last year.")
}

/** The pins as they'd be now, and what changes. */
export async function newestPins(
  sources: Sources,
  now = new Date(),
  download: Fetch = fetch
): Promise<{ sources: Sources; changes: PinChange[] }> {
  const [apiData, sprites, month] = await Promise.all([
    newestCommit("PokeAPI/api-data", now, download),
    newestCommit("PokeAPI/sprites", now, download),
    newestMonth(sources["smogon-usage"], now, download),
  ])
  const changes: PinChange[] = []
  const next: Sources = structuredClone(sources)
  for (const [source, pin] of [
    ["api-data", apiData],
    ["sprites", sprites],
  ] as const) {
    if (pin.commit !== sources[source].commit) {
      changes.push({ source, from: sources[source].commit, to: pin.commit })
      next[source] = { commit: pin.commit, date: pin.date }
    }
  }
  if (month !== sources["smogon-usage"].month) {
    changes.push({
      source: "smogon-usage",
      from: sources["smogon-usage"].month,
      to: month,
    })
    // A new month isn't imported yet: the import writes the date.
    next["smogon-usage"] = { ...sources["smogon-usage"], month }
    delete next["smogon-usage"].imported
  }
  return { sources: next, changes }
}

/** The monthly job's issue text: what's newer, and the one command to run. */
export function issueBody(changes: PinChange[]): string {
  const rows = changes.map(
    ({ source, from, to }) =>
      `| ${source} | \`${from.slice(0, 12)}\` | \`${to.slice(0, 12)}\` |`
  )
  return [
    "Newer Pokémon data is available, each pin at least two weeks old (ADR 0009).",
    "",
    "| Source | Pinned | Newest |",
    "| --- | --- | --- |",
    ...rows,
    "",
    "To refresh, on a branch:",
    "",
    "```sh",
    "bun run data:refresh",
    "```",
    "",
    'Then review the import\'s summary and the diff, run the checks in AGENTS.md, and commit `packages/dex/sources.json`, `packages/dex/data/` and `apps/web/public/dex-images/` together (packages/dex/README.md, "Refreshing the data").',
    "",
  ].join("\n")
}

if (import.meta.main) {
  const check = process.argv.includes("--check")
  const { sources, changes } = await newestPins(readSources())
  if (check) {
    if (changes.length > 0) {
      process.stdout.write(issueBody(changes))
    }
  } else {
    writeFileSync(
      join(import.meta.dirname, "..", "sources.json"),
      stableJson(sources)
    )
    console.log(
      changes.length === 0
        ? "Every pin is already the newest."
        : changes
            .map(({ source, from, to }) => `${source}: ${from} → ${to}`)
            .join("\n")
    )
  }
}
