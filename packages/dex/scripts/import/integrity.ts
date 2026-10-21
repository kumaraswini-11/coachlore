import {
  TYPE_KEYS,
  type Ability,
  type FormSummary,
  type Move,
  type TypeChart,
} from "../../src/types.ts"

export type Dataset = {
  forms: FormSummary[]
  chart: TypeChart
  moves: Move[]
  abilities: Ability[]
}

/**
 * Spec 002, criterion 3: every key the dataset refers to exists in it. Each
 * problem is one line, so a test can list them all.
 */
export function problems(dataset: Dataset): string[] {
  const found: string[] = []
  const types = new Set<string>(TYPE_KEYS)
  const abilities = new Set(dataset.abilities.map((ability) => ability.key))
  const pokemon = new Map<string, number>()

  for (const [name, list] of [
    ["forms", dataset.forms],
    ["moves", dataset.moves],
    ["abilities", dataset.abilities],
  ] as const) {
    const seen = new Set<string>()
    for (const { key } of list) {
      if (seen.has(key)) {
        found.push(`${name}: ${key} appears twice`)
      }
      seen.add(key)
    }
  }

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
    if (form.isDefault) {
      pokemon.set(form.pokemon, (pokemon.get(form.pokemon) ?? 0) + 1)
    }
  }
  for (const form of dataset.forms) {
    const defaults = pokemon.get(form.pokemon) ?? 0
    if (form.isDefault && defaults !== 1) {
      found.push(`forms: ${form.pokemon} has ${defaults} default forms`)
    }
    if (defaults === 0) {
      found.push(
        `forms: ${form.key}'s Pokémon ${form.pokemon} has no default form`
      )
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
  return [...new Set(found)]
}
