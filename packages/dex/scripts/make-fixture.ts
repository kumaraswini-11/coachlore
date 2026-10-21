/// <reference types="node" />
/**
 * Copies a fixed sample of the pinned api-data into `test/fixtures/`, for
 * the import's tests (spec 002's plan, "Tests", criterion 4): a few
 * Pokémon, chosen for what they test, trimmed to the fields the import
 * reads. Run it again when the import reads a new endpoint.
 */
import { existsSync, readdirSync, rmSync } from "node:fs"
import { join } from "node:path"

import { fetchSources, readSources } from "./fetch.ts"
import { ApiData, idOf, type Link } from "./import/api-data.ts"
import { writeJson } from "./import/write.ts"

// With their evolution chains' other species (below). Charizard: Megas
// and Gigantamax. Raticate: Alolan and Totem forms.
// Tauros: Paldea's three breeds. Rotom: five forms. Vivillon: cosmetic
// patterns that are one form. Urshifu: a default form keyed unlike its
// Pokémon.
const SPECIES = [6, 20, 128, 479, 666, 892]
// Ember: an effect chance. Dire Claw: no short effect. Blazing Torque: no
// English text at all. Shadow Rush: a Shadow move. The rest: common moves.
const MOVES = [24, 52, 56, 89, 827, 851, 896, 10001]

// The fields the import reads, per endpoint; English only where it reads
// only English. An endpoint not listed keeps every field.
const FIELDS: Record<string, string[]> = {
  move: [
    "name",
    "names",
    "type",
    "damage_class",
    "power",
    "accuracy",
    "pp",
    "priority",
    "effect_chance",
    "effect_entries",
    "flavor_text_entries",
    "generation",
  ],
  ability: [
    "name",
    "names",
    "is_main_series",
    "generation",
    "effect_entries",
    "flavor_text_entries",
  ],
  type: ["name", "damage_relations"],
  "pokemon-species": [
    "id",
    "name",
    "is_legendary",
    "is_mythical",
    "generation",
    "names",
    "varieties",
    "evolution_chain",
    "pokedex_numbers",
    "flavor_text_entries",
    "genera",
  ],
  pokemon: [
    "id",
    "name",
    "is_default",
    "types",
    "stats",
    "abilities",
    "forms",
    "height",
    "weight",
    "species",
    "moves",
    "sprites",
  ],
  "location-area": ["name", "names", "location"],
  location: ["name", "names"],
  version: ["name", "names", "version_group"],
  pokedex: ["name", "names", "region", "pokemon_entries"],
  "pokemon-form": [
    "id",
    "name",
    "form_name",
    "is_battle_only",
    "is_mega",
    "form_names",
    "pokemon",
    "version_group",
  ],
}
const ENGLISH_ONLY = new Set([
  "effect_entries",
  "flavor_text_entries",
  "genera",
])

type Resource = Record<string, unknown> & { name: string }

function trim(endpoint: string, value: Resource): Resource {
  const fields = FIELDS[endpoint]
  if (fields === undefined) {
    return value
  }
  return Object.fromEntries(
    fields.map((field) => {
      const entries = value[field]
      return [
        field,
        ENGLISH_ONLY.has(field) && Array.isArray(entries)
          ? entries.filter(
              (entry: { language: Link }) => entry.language.name === "en"
            )
          : entries,
      ]
    })
  ) as Resource
}

const OUT = join(import.meta.dirname, "..", "test", "fixtures", "api-data")
const V2 = join(OUT, "data", "api", "v2")

type Pokemon = {
  name: string
  forms: Link[]
  abilities: { ability: Link }[]
  moves: { move: Link }[]
  sprites: Record<string, unknown> & { other?: Record<string, unknown> }
}

const api = new ApiData((await fetchSources(readSources())).apiData)
const written = new Map<string, Map<number, string>>()

function copy(endpoint: string, id: number, value: Resource): void {
  writeJson(join(V2, endpoint, String(id), "index.json"), trim(endpoint, value))
  const ids = written.get(endpoint) ?? new Map<number, string>()
  ids.set(id, value.name)
  written.set(endpoint, ids)
}

function copyLink(link: Link): void {
  const [, endpoint] = /\/api\/v2\/([a-z-]+)\//.exec(link.url) ?? []
  if (endpoint === undefined) {
    throw new Error(`Not a resource link: ${link.url}`)
  }
  copy(endpoint, idOf(link.url), api.follow<Resource>(link))
}

// The old sample's files, not its folders: on Windows a folder something
// has open (an editor's watcher) can't be removed, and git ignores empty
// folders.
for (const entry of existsSync(OUT)
  ? readdirSync(OUT, { recursive: true, withFileTypes: true })
  : []) {
  if (entry.isFile()) {
    rmSync(join(entry.parentPath, entry.name))
  }
}

const moveNames = new Set<string>()
for (const id of MOVES) {
  const move = api.get<Resource>("move", id)
  moveNames.add(move.name)
  copy("move", id, move)
}

for (const id of api.ids("type")) {
  copy("type", id, api.get<Resource>("type", id))
}

type Species = {
  name: string
  varieties: { pokemon: Link }[]
  evolution_chain: { url: string }
}
type Chain = { species: Link; evolves_to: Chain[] }

// The sample's species and every species in their evolution chains, so
// each step's Pokémon is in the sample too.
const species = new Map<number, Species>()
for (const id of SPECIES) {
  const first = api.get<Species>("pokemon-species", id)
  const chain = api.follow<{ chain: Chain }>(first.evolution_chain)
  copyLink(first.evolution_chain as Link)
  const walk = (link: Chain) => {
    species.set(idOf(link.species.url), api.follow<Species>(link.species))
    link.evolves_to.forEach(walk)
  }
  walk(chain.chain)
}

const areas = new Map<number, Link>()
for (const [id, each] of species) {
  copy("pokemon-species", id, each as unknown as Resource)
  for (const variety of each.varieties) {
    const pokemon = api.follow<Pokemon>(variety.pokemon)
    const [form] = pokemon.forms
    if (form === undefined) {
      throw new Error(`${pokemon.name} has no form.`)
    }
    const pokemonId = idOf(variety.pokemon.url)
    copy("pokemon", pokemonId, {
      ...pokemon,
      moves: pokemon.moves.filter((entry) => moveNames.has(entry.move.name)),
      sprites: {
        front_default: pokemon.sprites.front_default,
        other: {
          "official-artwork": pokemon.sprites.other?.["official-artwork"],
        },
      },
    })
    // Five places a form at most: enough to test the step, not Rattata's
    // whole map.
    const found = api
      .optional<{ location_area: Link }[]>(`pokemon/${pokemonId}/encounters`)
      ?.slice(0, 5)
    if (found !== undefined) {
      writeJson(
        join(V2, "pokemon", String(pokemonId), "encounters", "index.json"),
        found
      )
      for (const entry of found) {
        areas.set(idOf(entry.location_area.url), entry.location_area)
      }
    }
    copyLink(form)
    for (const { ability } of pokemon.abilities) {
      copyLink(ability)
    }
  }
}

for (const area of areas.values()) {
  copyLink(area)
  copyLink(api.follow<{ location: Link }>(area).location)
}

// Every game, its versions, and its Pokédexes cut to the sample's species.
const names = new Set([...species.values()].map((each) => each.name))
for (const id of api.ids("version-group")) {
  const group = api.get<Resource & { versions: Link[]; pokedexes: Link[] }>(
    "version-group",
    id
  )
  copy("version-group", id, group)
  group.versions.forEach(copyLink)
  for (const link of group.pokedexes) {
    const pokedex = api.follow<
      Resource & { pokemon_entries: { pokemon_species: Link }[] }
    >(link)
    copy("pokedex", idOf(link.url), {
      ...pokedex,
      pokemon_entries: pokedex.pokemon_entries.filter((entry) =>
        names.has(entry.pokemon_species.name)
      ),
    })
  }
}

// Each endpoint's index lists only what the sample has.
for (const [endpoint, ids] of written) {
  const results = [...ids]
    .sort(([a], [b]) => a - b)
    .map(([id, name]) => ({ name, url: `/api/v2/${endpoint}/${id}/` }))
  writeJson(join(V2, endpoint, "index.json"), {
    count: results.length,
    results,
  })
}
console.log(
  [...written].map(([endpoint, ids]) => `${endpoint}: ${ids.size}`).join("\n")
)
