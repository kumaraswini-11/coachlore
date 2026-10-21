/// <reference types="node" />
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

/** A link to another resource, as PokéAPI writes it. */
export type Link = { name: string; url: string }

/**
 * Reads an extracted `api-data` commit: each resource is
 * `data/api/v2/<endpoint>/<id>/index.json`, and each endpoint's own
 * `index.json` lists them all. Resources are keyed by ID, so a link's URL
 * (`/api/v2/pokemon-form/10059/`) is how one finds another.
 */
export class ApiData {
  readonly #root: string
  readonly #cache = new Map<string, unknown>()

  constructor(root: string) {
    this.#root = join(root, "data", "api", "v2")
    if (!existsSync(this.#root)) {
      throw new Error(`No api-data at ${root}.`)
    }
  }

  /** The IDs an endpoint lists, in the source's order. */
  ids(endpoint: string): number[] {
    const index = this.#read<{ results: Link[] }>(join(endpoint, "index.json"))
    return index.results.map((link) => idOf(link.url))
  }

  get<T>(endpoint: string, id: number): T {
    return this.#read<T>(join(endpoint, String(id), "index.json"))
  }

  /** The resource a link points to. */
  follow<T>(link: Link | { url: string }): T {
    const [endpoint, id] = parts(link.url)
    return this.get<T>(endpoint, id)
  }

  has(endpoint: string, id: number): boolean {
    return existsSync(join(this.#root, endpoint, String(id), "index.json"))
  }

  #read<T>(path: string): T {
    let value = this.#cache.get(path)
    if (value === undefined) {
      value = JSON.parse(readFileSync(join(this.#root, path), "utf8"))
      this.#cache.set(path, value)
    }
    return value as T
  }
}

/** `/api/v2/pokemon/10009/` → 10009. */
export function idOf(url: string): number {
  return parts(url)[1]
}

function parts(url: string): [endpoint: string, id: number] {
  const match = /\/api\/v2\/([a-z-]+)\/(\d+)\/?$/.exec(url)
  if (match?.[1] === undefined || match[2] === undefined) {
    throw new Error(`Not a PokéAPI resource link: ${url}`)
  }
  return [match[1], Number(match[2])]
}
