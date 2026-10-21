import {
  TYPE_KEYS,
  type Ability,
  type FormSummary,
  type Game,
  type Learnset,
  type Move,
  type PokemonDetail,
  type TypeChart,
  type Usage,
} from "../../src/types.ts"
import type { ShowdownNames } from "./showdown.ts"

export type Dataset = {
  forms: FormSummary[]
  chart: TypeChart
  moves: Move[]
  abilities: Ability[]
  details: PokemonDetail[]
  /** Form → its learnset. */
  learnsets: Record<string, Learnset>
  games: Game[]
  /** Location area → its English name. */
  locations: Record<string, string>
  showdown: ShowdownNames
  usage: Usage
}

/**
 * Spec 002, criterion 3: every key the dataset refers to exists in it. Each
 * problem is one line, so a test can list them all.
 */
export function problems(dataset: Dataset): string[] {
  const found: string[] = []
  const types = new Set<string>(TYPE_KEYS)
  const forms = new Set(dataset.forms.map((form) => form.key))
  const abilities = new Set(dataset.abilities.map((ability) => ability.key))
  const moves = new Set(dataset.moves.map((move) => move.key))
  const games = new Set(dataset.games.map((game) => game.key))
  const versions = new Set(
    dataset.games.flatMap((game) => game.versions.map((version) => version.key))
  )
  const pokemon = new Set(dataset.details.map((detail) => detail.key))

  for (const [name, list] of [
    ["forms", dataset.forms],
    ["moves", dataset.moves],
    ["abilities", dataset.abilities],
    ["games", dataset.games],
    ["pokemon", dataset.details],
  ] as const) {
    const seen = new Set<string>()
    for (const { key } of list) {
      if (seen.has(key)) {
        found.push(`${name}: ${key} appears twice`)
      }
      seen.add(key)
    }
  }

  const defaults = new Map<string, number>()
  for (const form of dataset.forms) {
    for (const type of form.types) {
      if (!types.has(type)) {
        found.push(`forms: ${form.key} has the unknown type ${type}`)
      }
    }
    for (const ability of form.abilities) {
      if (!abilities.has(ability.key)) {
        found.push(`forms: ${form.key} has the unknown ability ${ability.key}`)
      }
    }
    for (const game of form.games) {
      if (!games.has(game)) {
        found.push(`forms: ${form.key} is in the unknown game ${game}`)
      }
    }
    if (!pokemon.has(form.pokemon)) {
      found.push(`forms: ${form.key}'s Pokémon ${form.pokemon} has no file`)
    }
    if (dataset.learnsets[form.key] === undefined) {
      found.push(`forms: ${form.key} has no learnset`)
    }
    if (form.isDefault) {
      defaults.set(form.pokemon, (defaults.get(form.pokemon) ?? 0) + 1)
    }
  }
  for (const [key, count] of defaults) {
    if (count !== 1) {
      found.push(`forms: ${key} has ${count} default forms`)
    }
  }

  for (const move of dataset.moves) {
    if (!types.has(move.type)) {
      found.push(`moves: ${move.key} has the unknown type ${move.type}`)
    }
  }
  for (const [attacking, row] of Object.entries(dataset.chart)) {
    for (const defending of [attacking, ...Object.keys(row)]) {
      if (!types.has(defending)) {
        found.push(`types: the chart names the unknown type ${defending}`)
      }
    }
  }

  for (const detail of dataset.details) {
    if (!defaults.has(detail.key)) {
      found.push(`pokemon: ${detail.key} has no default form`)
    }
    for (const step of detail.evolution) {
      for (const key of [step.from, step.to]) {
        if (key !== null && !pokemon.has(key)) {
          found.push(`pokemon: ${detail.key}'s evolution names ${key}`)
        }
      }
    }
    for (const form of detail.forms) {
      for (const [version, rows] of Object.entries(form.encounters)) {
        if (!versions.has(version)) {
          found.push(
            `pokemon: ${form.key} is found in the unknown version ${version}`
          )
        }
        for (const row of rows) {
          if (dataset.locations[row.location] === undefined) {
            found.push(
              `pokemon: ${form.key} is found at ${row.location}, which has no name`
            )
          }
        }
      }
    }
  }

  for (const [form, learned] of Object.entries(dataset.learnsets)) {
    if (!forms.has(form)) {
      found.push(`learnsets: ${form} isn't a form`)
    }
    for (const [game, rows] of Object.entries(learned)) {
      if (!games.has(game)) {
        found.push(
          `learnsets: ${form} learns moves in the unknown game ${game}`
        )
      }
      for (const [move] of rows) {
        if (!moves.has(move)) {
          found.push(`learnsets: ${form} learns the unknown move ${move}`)
        }
      }
    }
  }

  for (const game of dataset.games) {
    const own = new Set(game.versions.map((version) => version.key))
    for (const pokedex of game.pokedexes) {
      for (const entry of pokedex.entries) {
        if (!forms.has(entry.form)) {
          found.push(`games: ${game.key}'s ${pokedex.key} lists ${entry.form}`)
        }
        if (entry.onlyIn !== undefined && !own.has(entry.onlyIn)) {
          found.push(
            `games: ${entry.form} is only in ${entry.onlyIn}, not a version of ${game.key}`
          )
        }
      }
    }
  }
  for (const [format, entries] of Object.entries(dataset.usage.formats)) {
    for (const [form, entry] of Object.entries(entries)) {
      const missing = [
        ...[form, ...entry.partners.map(([key]) => key)].filter(
          (key) => !forms.has(key)
        ),
        ...entry.moves.map(([key]) => key).filter((key) => !moves.has(key)),
        ...entry.abilities
          .map(([key]) => key)
          .filter((key) => !abilities.has(key)),
      ]
      for (const key of missing) {
        found.push(`usage: ${format}'s ${form} names ${key}`)
      }
    }
  }
  for (const [id, form] of Object.entries(dataset.showdown.ids)) {
    if (!forms.has(form)) {
      found.push(`showdown: ${id} names ${form}, which isn't a form`)
    }
  }
  for (const form of Object.keys(dataset.showdown.names)) {
    if (!forms.has(form)) {
      found.push(`showdown: ${form} has a name but isn't a form`)
    }
  }
  return [...new Set(found)]
}
