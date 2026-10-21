/// <reference types="node" />
/**
 * `bun run --filter web import-images`: each form's sprite and artwork from
 * PokéAPI's sprites at the pinned commit, prepared at their display size
 * as WebP in `public/dex-images/` (spec 002's plan, "Images"). Downloads go
 * to `.cache/` (gitignored), four at a time, once.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { dirname, join } from "node:path"
import sharp from "sharp"

import { credits, forms } from "@workspace/dex"
import { readPokemon } from "@workspace/dex/files"

const WEB = join(import.meta.dirname, "..")
const OUT = join(WEB, "public", "dex-images")
const CACHE = join(WEB, ".cache", "sprites")
const CONCURRENCY = 4

const commit = credits.find((credit) => credit.source === "sprites")?.version
if (commit === undefined || !/^[0-9a-f]{40}$/.test(commit)) {
  throw new Error("@workspace/dex's credits have no pinned sprites commit.")
}

type Job = { source: string; target: string; artwork: boolean }

// Default and other forms alike, by the PokéAPI ID each form's images are
// filed under; the artwork only where the data says there is one.
const jobs: Job[] = []
for (const form of forms) {
  if (form.sprite !== null) {
    jobs.push({
      source: `sprites/pokemon/${form.sourceId}.png`,
      target: join("sprites", `${form.key}.webp`),
      artwork: false,
    })
  }
}
for (const key of new Set(forms.map((form) => form.pokemon))) {
  const detail = await readPokemon(key)
  for (const form of detail?.forms ?? []) {
    if (form.artwork !== null) {
      jobs.push({
        source: `sprites/pokemon/other/official-artwork/${form.sourceId}.png`,
        target: join("artwork", `${form.key}.webp`),
        artwork: true,
      })
    }
  }
}

async function download(path: string): Promise<Buffer> {
  const file = join(CACHE, commit ?? "", path)
  if (!existsSync(file)) {
    const url = `https://raw.githubusercontent.com/PokeAPI/sprites/${commit}/${path}`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`${url} answered ${response.status}.`)
    }
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, Buffer.from(await response.arrayBuffer()))
  }
  return readFileSync(file)
}

/** Sprites as they are, lossless at 96 px; artwork at 256 px, quality 80. */
async function prepare(job: Job): Promise<void> {
  const image = sharp(await download(job.source))
  const output = job.artwork
    ? image
        .resize(256, 256, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .webp({ quality: 80 })
    : image
        .resize(96, 96, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .webp({ lossless: true })
  const target = join(OUT, job.target)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, await output.toBuffer())
}

const failed: string[] = []
let next = 0
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (next < jobs.length) {
      const job = jobs[next++]
      if (job === undefined) {
        break
      }
      try {
        await prepare(job)
      } catch (error) {
        failed.push(`${job.target}: ${(error as Error).message}`)
      }
    }
  })
)
if (failed.length > 0) {
  throw new Error(failed.join("\n"))
}

// A form the data no longer has loses its images.
const expected = new Set(jobs.map((job) => job.target))
let removed = 0
for (const folder of ["sprites", "artwork"]) {
  for (const name of existsSync(join(OUT, folder))
    ? readdirSync(join(OUT, folder))
    : []) {
    if (!expected.has(join(folder, name))) {
      rmSync(join(OUT, folder, name))
      removed++
    }
  }
}
console.log(`${jobs.length} images written, ${removed} removed.`)
