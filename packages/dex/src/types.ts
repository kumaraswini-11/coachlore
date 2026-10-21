/**
 * Coachlore's Pokémon data model (spec 002's plan, "Data model"). Keys are
 * PokéAPI's names: a Pokémon by its species (`rotom`), a form by its
 * Pokémon (`rotom-wash`), moves, abilities, types and games by theirs.
 */

export type PokemonKey = string
export type FormKey = string

export const TYPE_KEYS = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
] as const
export type TypeKey = (typeof TYPE_KEYS)[number]

export const STAT_KEYS = [
  "hp",
  "attack",
  "defense",
  "special-attack",
  "special-defense",
  "speed",
] as const
export type StatKey = (typeof STAT_KEYS)[number]

/** One row of forms.json: what the grid, search and filters need. */
export type FormSummary = {
  key: FormKey
  pokemon: PokemonKey
  /** National Dex number. */
  number: number
  /** PokéAPI's pokemon ID, for every form: where its images come from. */
  sourceId: number
  /** "Rotom-Wash": English, in every interface language. */
  name: string
  /** "Wash Rotom", for the form switcher. */
  formName?: string
  isDefault: boolean
  isBattleOnly: boolean
  types: [TypeKey] | [TypeKey, TypeKey]
  stats: Record<StatKey, number>
  /** The six base stats summed, for spec 003's filters and sort. */
  statTotal: number
  abilities: { key: string; hidden: boolean }[]
  generation: number
  legendary?: true
  mythical?: true
  /** Usable in Generation 9: its Gen 9 species has no `isNonstandard`. */
  gen9: boolean
  /** @pkmn/dex's species tags: "Restricted Legendary", "Sub-Legendary"… */
  tags: string[]
  /** Games whose regional Pokédex includes it. */
  games: string[]
  /** Spec 003's "Forms" filter. */
  kind: "default" | "regional" | "mega" | "gigantamax" | "other"
  /** "/dex-images/sprites/rotom-wash.webp", or null without an image. */
  sprite: string | null
}

/**
 * One step of an evolution chain, as data: how `to` evolves from `from`
 * (PokéAPI's trigger and the conditions it gives). Spec 004 words it.
 */
export type EvolutionStep = {
  from: PokemonKey | null
  to: PokemonKey
  trigger: string | null
  /**
   * PokéAPI's fields that are set (`min_level: 36`, `item: "water-stone"`),
   * links as their key; `allowed_natures` as a list, and a hidden random
   * roll as its `chance` in percent (Dudunsparce's three segments: 1), or
   * as the source's `expression` where it isn't a chance (Alcremie's spins).
   */
  conditions: Record<string, string | number | boolean | string[]>
}

/** Where a form is found in one version. */
export type Encounter = {
  location: string
  method: string
  minLevel: number
  maxLevel: number
  /** 0–100. */
  chance: number
}

export type PokemonDetail = {
  key: PokemonKey
  number: number
  name: string
  /** "Plasma Pokémon". */
  category: string
  generation: number
  forms: (FormSummary & {
    /** Decimetres and hectograms, as the source gives them. */
    height: number
    weight: number
    /** "/dex-images/artwork/rotom-wash.webp", or null without an image. */
    artwork: string | null
    /** Version → where this form is found; only versions the data covers. */
    encounters: Record<string, Encounter[]>
  })[]
  /** The whole chain, flattened, each step with its parent. */
  evolution: EvolutionStep[]
  /** English Pokédex entries. */
  entries: { version: string; text: string }[]
  /** PokéAPI language → name (no Hindi: the source has none). */
  names: Record<string, string>
}

export type MoveCategory = "physical" | "special" | "status"

export type Move = {
  key: string
  name: string
  type: TypeKey
  category: MoveCategory
  power: number | null
  accuracy: number | null
  pp: number
  priority: number
  generation: number
  /**
   * PokéAPI's English short effect, else its newest English game text;
   * absent when the source has neither (spec 002, "Missing data says so").
   */
  effect?: string
  /** The chance of the effect, 0–100: "Has a chance to burn" is 10% for Ember. */
  effectChance?: number
}

export type Ability = {
  key: string
  name: string
  generation: number
  /** As a move's `effect`. */
  effect?: string
}

/** PokéAPI's other methods are kept as "other", never dropped. */
export type LearnMethod = "level" | "machine" | "egg" | "tutor" | "other"

/** Game → the moves a form learns there. */
export type Learnset = Record<
  string,
  [move: string, method: LearnMethod, level?: number][]
>

export type Game = {
  key: string
  name: string
  generation: number
  versions: { key: string; name: string }[]
  /**
   * The game's Pokédexes in its own order (Scarlet and Violet: Paldea,
   * Kitakami, Blueberry), each in regional order; `onlyIn` is a version
   * key for a version exclusive.
   */
  pokedexes: {
    key: string
    name: string
    entries: { form: FormKey; regionalNumber: number; onlyIn?: string }[]
  }[]
  encountersCovered: boolean
}

export type UsageEntry = {
  /** 0–1. */
  share: number
  /** Each list: its top six, [key, share 0–1]. */
  moves: [string, number][]
  /** Items by English name ("Choice Scarf"): the dataset has no items. */
  items: [string, number][]
  abilities: [string, number][]
  partners: [FormKey, number][]
}

export type Usage = {
  /** "2026-09". */
  month: string
  formats: Record<string, Record<FormKey, UsageEntry>>
}

/**
 * Each attacking type's multiplier against each defending type, from
 * PokéAPI's current damage relations: only the entries that aren't 1.
 */
export type TypeChart = Record<TypeKey, Partial<Record<TypeKey, 0 | 0.5 | 2>>>
