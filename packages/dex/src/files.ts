/// <reference types="node" />
/**
 * The dataset's large files, read on demand with `node:fs`: a Pokémon's
 * page data, a form's learnset, the month's usage. For Server Components
 * at build time, the server and scripts; the browser never loads this.
 * Each reader takes the data folder, so a caller whose bundler moves this
 * file can say where the data is.
 */
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

import type { Learnset, PokemonDetail, Usage } from "./types.ts"

export const DATA_DIR = fileURLToPath(new URL("../data/", import.meta.url))

// PokéAPI's keys: lowercase letters, digits and hyphens. Anything else, a
// path above all, never reaches the file system.
const KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

async function readKeyed<T>(
  folder: string,
  key: string,
  dataDir: string
): Promise<T | undefined> {
  if (!KEY.test(key)) {
    return undefined
  }
  try {
    return JSON.parse(
      await readFile(join(dataDir, folder, `${key}.json`), "utf8")
    ) as T
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return undefined
    }
    throw error
  }
}

/** A Pokémon's page data by its key (`rotom`), or undefined if it has none. */
export function readPokemon(
  key: string,
  dataDir = DATA_DIR
): Promise<PokemonDetail | undefined> {
  return readKeyed("pokemon", key, dataDir)
}

/** A form's moves by game (`rotom-wash`), or undefined if it has none. */
export function readLearnset(
  form: string,
  dataDir = DATA_DIR
): Promise<Learnset | undefined> {
  return readKeyed("learnsets", form, dataDir)
}

export async function readUsage(dataDir = DATA_DIR): Promise<Usage> {
  return JSON.parse(
    await readFile(join(dataDir, "usage.json"), "utf8")
  ) as Usage
}

/** Location area → its English name, for a form's encounters. */
export async function readLocations(
  dataDir = DATA_DIR
): Promise<Record<string, string>> {
  return JSON.parse(
    await readFile(join(dataDir, "locations.json"), "utf8")
  ) as Record<string, string>
}
