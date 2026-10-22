/// <reference types="node" />
/**
 * Downloads the pinned sources (sources.json) into `.cache/`, only what's
 * missing, so a refresh downloads once and every later run reuses it (spec
 * 002's plan, "The import", step 1). Sprites are fetched one file at a time
 * by the image step instead: their repository is about 25 GB.
 */
import { execFileSync } from "node:child_process"
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
} from "node:fs"
import { dirname, join } from "node:path"
import { Readable } from "node:stream"
import { pipeline } from "node:stream/promises"

export type Sources = {
  "api-data": { commit: string; date: string; imported?: string }
  sprites: { commit: string; date: string; imported?: string }
  "smogon-usage": {
    month: string
    cutoff: number
    formats: string[]
    imported?: string
  }
}

type CachedSources = {
  /** The extracted `api-data` commit; its files are `data/api/v2/…`. */
  apiData: string
  /** Format → the chaos file for the pinned month and cutoff. */
  usage: Record<string, string>
}

const PACKAGE = join(import.meta.dirname, "..")

export function readSources(file = join(PACKAGE, "sources.json")): Sources {
  return JSON.parse(readFileSync(file, "utf8")) as Sources
}

export async function fetchSources(
  sources: Sources,
  cacheDir = join(PACKAGE, ".cache"),
  download: typeof fetch = fetch
): Promise<CachedSources> {
  const { commit } = sources["api-data"]
  const apiData = join(cacheDir, "api-data", commit)
  if (!existsSync(apiData)) {
    await fetchApiData(commit, apiData, download)
  }

  const { month, cutoff, formats } = sources["smogon-usage"]
  const usage: Record<string, string> = {}
  for (const format of formats) {
    const name = `${format}-${cutoff}.json`
    const file = join(cacheDir, "smogon", month, name)
    if (!existsSync(file)) {
      await save(
        `https://www.smogon.com/stats/${month}/chaos/${name}`,
        file,
        download
      )
    }
    usage[format] = file
  }

  return { apiData, usage }
}

/**
 * The commit's tarball, extracted with the system `tar`. It unpacks into a
 * `.partial` folder first, and is moved into place only when it holds the
 * one folder GitHub names after the commit, so an interrupted run is never
 * taken for a finished one.
 */
async function fetchApiData(
  commit: string,
  target: string,
  download: typeof fetch
): Promise<void> {
  const parent = dirname(target)
  const archive = `${commit}.tar.gz`
  const partial = `${commit}.partial`
  rmSync(join(parent, partial), { recursive: true, force: true })
  await save(
    `https://codeload.github.com/PokeAPI/api-data/tar.gz/${commit}`,
    join(parent, archive),
    download
  )
  mkdirSync(join(parent, partial))
  // Relative paths from the cache folder: GNU tar reads "C:\…" as a remote
  // host, and Windows' bsdtar has no --force-local.
  execFileSync("tar", ["-xzf", archive, "-C", partial], {
    cwd: parent,
    stdio: "inherit",
  })
  const root = readdirSync(join(parent, partial))
  if (root.length !== 1 || root[0] !== `api-data-${commit}`) {
    throw new Error(
      `The api-data archive for ${commit} holds ${root.join(", ")}, not api-data-${commit}.`
    )
  }
  renameSync(join(parent, partial, root[0]), target)
  rmSync(join(parent, partial), { recursive: true })
  rmSync(join(parent, archive))
}

/** Streams one download to a file, through a temporary name. */
async function save(
  url: string,
  file: string,
  download: typeof fetch
): Promise<void> {
  const response = await download(url)
  if (!response.ok || response.body === null) {
    throw new Error(`${url} answered ${response.status}.`)
  }
  mkdirSync(dirname(file), { recursive: true })
  const temporary = `${file}.download`
  await pipeline(Readable.fromWeb(response.body), createWriteStream(temporary))
  renameSync(temporary, file)
}

if (import.meta.main) {
  const cached = await fetchSources(readSources())
  console.log(`api-data: ${cached.apiData}`)
  for (const [format, file] of Object.entries(cached.usage)) {
    console.log(`${format}: ${file}`)
  }
}
