import {
  STAT_KEYS,
  TYPE_KEYS,
  type Ability,
  type FormSummary,
  type Move,
  type MoveCategory,
  type TypeChart,
  type TypeKey,
} from "../../src/types.ts"
import { idOf, type ApiData, type Link } from "./api-data.ts"
import { effectOf, english } from "./text.ts"

// Steps 2 to 4 of spec 002's plan ("The import"): what each reads from
// api-data, and what it leaves out, is written there.

/** By key, in code-unit order: the same on every machine, unlike a locale's. */
export function byKey(a: { key: string }, b: { key: string }): number {
  return a.key < b.key ? -1 : a.key > b.key ? 1 : 0
}

const CATEGORIES: readonly string[] = ["physical", "special", "status"]

function isTypeKey(name: string): name is TypeKey {
  return (TYPE_KEYS as readonly string[]).includes(name)
}

function typeKey(link: Link, where: string): TypeKey {
  if (!isTypeKey(link.name)) {
    throw new Error(`${where} has the type ${link.name}, not one of the 18.`)
  }
  return link.name
}

type TypeResource = {
  name: string
  damage_relations: Record<
    "no_damage_to" | "half_damage_to" | "double_damage_to",
    Link[]
  >
}

/** Step 2: the current chart, for the eighteen battle types only. */
export function importChart(api: ApiData): TypeChart {
  const chart = Object.fromEntries(
    TYPE_KEYS.map((type) => [type, {}])
  ) as TypeChart
  const found = new Set<string>()
  for (const id of api.ids("type")) {
    const type = api.get<TypeResource>("type", id)
    if (!isTypeKey(type.name)) {
      continue // stellar, unknown, shadow: no form has them
    }
    found.add(type.name)
    const relations = type.damage_relations
    const row = chart[type.name]
    for (const [field, value] of [
      ["double_damage_to", 2],
      ["half_damage_to", 0.5],
      ["no_damage_to", 0],
    ] as const) {
      for (const link of relations[field]) {
        row[typeKey(link, `type ${type.name}`)] = value
      }
    }
  }
  const missing = TYPE_KEYS.filter((type) => !found.has(type))
  if (missing.length > 0) {
    throw new Error(`api-data has no type ${missing.join(", ")}.`)
  }
  return chart
}

type Species = {
  id: number
  name: string
  is_legendary: boolean
  is_mythical: boolean
  generation: Link
  names: { name: string; language: Link }[]
  varieties: { is_default: boolean; pokemon: Link }[]
}

type Pokemon = {
  id: number
  name: string
  types: { slot: number; type: Link }[]
  stats: { base_stat: number; stat: Link }[]
  abilities: { slot: number; is_hidden: boolean; ability: Link }[]
  forms: Link[]
  sprites: { front_default: string | null }
}

type PokemonForm = {
  form_name: string
  is_battle_only: boolean
  is_mega: boolean
  form_names: { name: string; language: Link }[]
  version_group: Link
}

const REGIONAL = /^(Alolan|Galarian|Hisuian|Paldean) Form/

/**
 * Step 3: one row per `pokemon` (a species' variety), never per cosmetic
 * `pokemon-form`, minus the excluded forms. `games`, `gen9` and `tags` are
 * filled by the later steps.
 */
export function importForms(
  api: ApiData,
  excluded: ReadonlySet<string>
): FormSummary[] {
  const forms: FormSummary[] = []
  const unused = new Set(excluded)
  for (const id of api.ids("pokemon-species")) {
    const species = api.get<Species>("pokemon-species", id)
    const speciesName = english(species.names)?.name ?? species.name
    for (const variety of species.varieties) {
      if (excluded.has(variety.pokemon.name)) {
        unused.delete(variety.pokemon.name)
        continue
      }
      const pokemon = api.follow<Pokemon>(variety.pokemon)
      const [formLink] = pokemon.forms
      if (formLink === undefined) {
        throw new Error(`pokemon ${pokemon.name} has no form.`)
      }
      const form = api.follow<PokemonForm>(formLink)
      forms.push(
        formSummary(
          api,
          species,
          speciesName,
          variety.is_default,
          pokemon,
          form
        )
      )
    }
  }
  if (unused.size > 0) {
    throw new Error(
      `excluded-forms.json names forms api-data doesn't have: ${[...unused].join(", ")}.`
    )
  }
  return forms.sort(
    (a, b) =>
      a.number - b.number ||
      Number(b.isDefault) - Number(a.isDefault) ||
      byKey(a, b)
  )
}

function formSummary(
  api: ApiData,
  species: Species,
  speciesName: string,
  isDefault: boolean,
  pokemon: Pokemon,
  form: PokemonForm
): FormSummary {
  const where = `pokemon ${pokemon.name}`
  const types = [...pokemon.types]
    .sort((a, b) => a.slot - b.slot)
    .map((each) => typeKey(each.type, where))
  if (types.length < 1 || types.length > 2) {
    throw new Error(`${where} has ${types.length} types.`)
  }
  const stats = Object.fromEntries(
    STAT_KEYS.map((key) => {
      const stat = pokemon.stats.find((each) => each.stat.name === key)
      if (stat === undefined) {
        throw new Error(`${where} has no ${key} stat.`)
      }
      return [key, stat.base_stat]
    })
  ) as FormSummary["stats"]
  const formName = english(form.form_names)?.name
  // A form's generation is that of the games it came in (Alolan Ninetales:
  // 7), a default form's that of its species.
  const generation = idOf(
    isDefault
      ? species.generation.url
      : api.follow<{ generation: Link }>(form.version_group).generation.url
  )
  return {
    key: pokemon.name,
    pokemon: species.name,
    number: species.id,
    sourceId: pokemon.id,
    name: isDefault ? speciesName : formTitle(speciesName, species, pokemon),
    ...(formName === undefined ? {} : { formName }),
    isDefault,
    isBattleOnly: form.is_battle_only,
    types: types as FormSummary["types"],
    stats,
    statTotal: STAT_KEYS.reduce((total, key) => total + stats[key], 0),
    abilities: [...pokemon.abilities]
      .sort((a, b) => a.slot - b.slot)
      .map((each) => ({ key: each.ability.name, hidden: each.is_hidden })),
    generation,
    ...(species.is_legendary ? { legendary: true as const } : {}),
    ...(species.is_mythical ? { mythical: true as const } : {}),
    gen9: false,
    tags: [],
    games: [],
    kind: isDefault
      ? "default"
      : form.is_mega
        ? "mega"
        : form.form_name === "gmax"
          ? "gigantamax"
          : REGIONAL.test(formName ?? "")
            ? "regional"
            : "other",
    sprite:
      pokemon.sprites.front_default === null
        ? null
        : `/dex-images/sprites/${pokemon.name}.webp`,
  }
}

/** "Rotom" and `rotom-wash` → "Rotom-Wash"; "Mr. Mime" and `mr-mime-galar` → "Mr. Mime-Galar". */
function formTitle(
  speciesName: string,
  species: Species,
  pokemon: Pokemon
): string {
  const suffix = pokemon.name.startsWith(`${species.name}-`)
    ? pokemon.name.slice(species.name.length + 1)
    : pokemon.name
  const words = suffix
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  return [speciesName, ...words].join("-")
}

type Described = Parameters<typeof effectOf>[0] & {
  name: string
  names: { name: string; language: Link }[]
  generation: Link
}

type MoveResource = Described & {
  type: Link
  damage_class: Link
  power: number | null
  accuracy: number | null
  pp: number | null
  priority: number
  effect_chance: number | null
}

function category(move: MoveResource): MoveCategory {
  if (!CATEGORIES.includes(move.damage_class.name)) {
    throw new Error(
      `move ${move.name} has the category ${move.damage_class.name}.`
    )
  }
  return move.damage_class.name as MoveCategory
}

/** Step 4: every move but the Shadow moves of Colosseum and XD. */
export function importMoves(api: ApiData): Move[] {
  const moves: Move[] = []
  for (const id of api.ids("move")) {
    const move = api.get<MoveResource>("move", id)
    if (move.type.name === "shadow") {
      continue
    }
    const effect = effectOf(move)
    moves.push({
      key: move.name,
      name: english(move.names)?.name ?? move.name,
      type: typeKey(move.type, `move ${move.name}`),
      category: category(move),
      power: move.power,
      accuracy: move.accuracy,
      pp: move.pp ?? 0,
      priority: move.priority,
      generation: idOf(move.generation.url),
      ...(effect === undefined ? {} : { effect }),
      ...(move.effect_chance === null
        ? {}
        : { effectChance: move.effect_chance }),
    })
  }
  return moves.sort((a, b) => byKey(a, b))
}

/** Step 4: the main series' abilities (`is_main_series`). */
export function importAbilities(api: ApiData): Ability[] {
  const abilities: Ability[] = []
  for (const id of api.ids("ability")) {
    const ability = api.get<Described & { is_main_series: boolean }>(
      "ability",
      id
    )
    if (!ability.is_main_series) {
      continue
    }
    const effect = effectOf(ability)
    abilities.push({
      key: ability.name,
      name: english(ability.names)?.name ?? ability.name,
      generation: idOf(ability.generation.url),
      ...(effect === undefined ? {} : { effect }),
    })
  }
  return abilities.sort((a, b) => byKey(a, b))
}
