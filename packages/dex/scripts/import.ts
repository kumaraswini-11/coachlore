/// <reference types="node" />
/**
 * `bun run --filter @workspace/dex import`: downloads what's missing, runs
 * spec 002's import on the pinned sources, checks the result, prints what
 * changed against the committed data, then writes it to `data/`.
 */
import { writeFileSync } from "node:fs"
import { join } from "node:path"

import { fetchSources, readSources } from "./fetch.ts"
import { ApiData } from "./import/api-data.ts"
import {
  files,
  importDex,
  readHand,
  summary,
  writeDataset,
} from "./import/dataset.ts"
import { problems } from "./import/integrity.ts"
import { stableJson } from "./import/write.ts"

const PACKAGE = join(import.meta.dirname, "..")
const DATA = join(PACKAGE, "data")

const sources = readSources()
const cached = await fetchSources(sources)
const dataset = importDex(
  new ApiData(cached.apiData),
  readHand(join(PACKAGE, "overrides")),
  { month: sources["smogon-usage"].month, files: cached.usage }
)

const found = problems(dataset)
if (found.length > 0) {
  console.error(found.join("\n"))
  throw new Error(
    `The import found ${found.length} problems; nothing was written.`
  )
}

const output = files(dataset, sources)
console.log(summary(DATA, output).join("\n"))
writeDataset(DATA, output)

const today = new Date().toISOString().slice(0, 10)
sources["api-data"].imported = today
sources["smogon-usage"].imported = today
writeFileSync(join(PACKAGE, "sources.json"), stableJson(sources))
