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

// Charizard: Megas and Gigantamax. Raticate: Alolan and Totem forms.
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

for (const id of SPECIES) {
  const species = api.get<{
    name: string
    varieties: { pokemon: Link }[]
  }>("pokemon-species", id)
  copy("pokemon-species", id, species)
  for (const variety of species.varieties) {
    const pokemon = api.follow<Pokemon>(variety.pokemon)
    const [form] = pokemon.forms
    if (form === undefined) {
      throw new Error(`${pokemon.name} has no form.`)
    }
    copy("pokemon", idOf(variety.pokemon.url), {
      ...pokemon,
      moves: pokemon.moves.filter((each) => moveNames.has(each.move.name)),
      sprites: {
        front_default: pokemon.sprites.front_default,
        other: {
          "official-artwork": pokemon.sprites.other?.["official-artwork"],
        },
      },
    })
    copyLink(form)
    const { version_group } = api.follow<{ version_group: Link }>(form)
    copyLink(version_group)
    for (const { ability } of pokemon.abilities) {
      copyLink(ability)
    }
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
