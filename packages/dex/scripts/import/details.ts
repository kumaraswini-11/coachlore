import type {
  Encounter,
  EvolutionStep,
  FormSummary,
  Game,
  LearnMethod,
  Learnset,
  PokemonDetail,
} from "../../src/types.ts"
import { idOf, type ApiData, type Link } from "./api-data.ts"
import { english, normalise } from "./text.ts"

// Steps 5 to 8 of spec 002's plan ("The import").

type Named = { name: string; language: Link }

type ChainLink = {
  species: Link
  evolution_details: (Record<string, unknown> & {
    trigger: Link
    is_default?: boolean
  })[]
  evolves_to: ChainLink[]
}

// Fields of an evolution detail that say which detail it is, not what it
// takes.
const NOT_CONDITIONS = new Set(["trigger", "version_group", "is_default"])

/**
 * Step 5: the chain, flattened with each step's parent, its first species
 * with `from: null`. A step keeps the details PokéAPI marks `is_default`
 * (one per method, where the games' differ), or all of them if none is.
 */
export function evolution(api: ApiData, chainUrl: string): EvolutionStep[] {
  const chain = api.follow<{ chain: ChainLink }>({ url: chainUrl }).chain
  const steps: EvolutionStep[] = [
    { from: null, to: chain.species.name, trigger: null, conditions: {} },
  ]
  const walk = (link: ChainLink) => {
    for (const next of link.evolves_to) {
      const defaults = next.evolution_details.filter((each) => each.is_default)
      for (const detail of defaults.length > 0
        ? defaults
        : next.evolution_details) {
        steps.push({
          from: link.species.name,
          to: next.species.name,
          trigger: detail.trigger.name,
          conditions: conditions(detail),
        })
      }
      walk(next)
    }
  }
  walk(chain)
  return steps
}

function conditions(
  detail: Record<string, unknown>
): EvolutionStep["conditions"] {
  const found: EvolutionStep["conditions"] = {}
  for (const [field, value] of Object.entries(detail)) {
    if (
      NOT_CONDITIONS.has(field) ||
      value === null ||
      value === false ||
      value === ""
    ) {
      continue
    }
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      value === true
    ) {
      found[field] = value
    } else if (isLink(value)) {
      found[field] = value.name
    } else if (Array.isArray(value) && value.every(isLink)) {
      found[field] = value.map((link) => link.name)
    } else if (field === "condition_expression" && isExpression(value)) {
      // A hidden value the game rolls or checks: its chance where it's one
      // (Dudunsparce), else the source's expression (Alcremie's spins).
      if (value.percentage_chance === null) {
        found.expression = value.expression
      } else {
        found.chance = value.percentage_chance
      }
    } else {
      throw new Error(
        `An evolution condition ${field} isn't a value or a link.`
      )
    }
  }
  return found
}

function isExpression(
  value: unknown
): value is { expression: string; percentage_chance: number | null } {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof (value as { expression?: unknown }).expression === "string"
  )
}

function isLink(value: unknown): value is Link {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof (value as Link).name === "string"
  )
}

type MoveEntry = {
  move: Link
  version_group_details: {
    level_learned_at: number
    move_learn_method: Link
    version_group: Link
  }[]
}

const METHODS: Record<string, LearnMethod> = {
  "level-up": "level",
  machine: "machine",
  egg: "egg",
  tutor: "tutor",
}
const METHOD_ORDER: LearnMethod[] = [
  "level",
  "machine",
  "egg",
  "tutor",
  "other",
]

/** Step 7: a form's moves, grouped by game, PokéAPI's other methods kept as "other". */
export function learnset(
  moves: MoveEntry[],
  known: ReadonlySet<string>
): Learnset {
  const byGame = new Map<string, Map<string, Learnset[string][number]>>()
  for (const entry of moves) {
    if (!known.has(entry.move.name)) {
      continue // a Shadow move, left out with the moves themselves
    }
    for (const detail of entry.version_group_details) {
      const method = METHODS[detail.move_learn_method.name] ?? "other"
      const row: Learnset[string][number] =
        method === "level"
          ? [entry.move.name, method, detail.level_learned_at]
          : [entry.move.name, method]
      const game = byGame.get(detail.version_group.name) ?? new Map()
      game.set(row.join(" "), row)
      byGame.set(detail.version_group.name, game)
    }
  }
  return Object.fromEntries(
    [...byGame].map(([game, rows]) => [
      game,
      [...rows.values()].sort(
        (a, b) =>
          METHOD_ORDER.indexOf(a[1]) - METHOD_ORDER.indexOf(b[1]) ||
          (a[2] ?? 0) - (b[2] ?? 0) ||
          (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)
      ),
    ])
  )
}

export type EncounterEntry = {
  location_area: Link
  version_details: {
    version: Link
    max_chance: number
    encounter_details: {
      min_level: number
      max_level: number
      method: Link
    }[]
  }[]
}

/**
 * Step 8: where a form is found, by version: one row per place and method,
 * its levels from lowest to highest, and the version's chance there.
 */
export function encounters(
  entries: EncounterEntry[]
): Record<string, Encounter[]> {
  const byVersion = new Map<string, Map<string, Encounter>>()
  for (const entry of entries) {
    for (const version of entry.version_details) {
      const rows = byVersion.get(version.version.name) ?? new Map()
      for (const detail of version.encounter_details) {
        const key = `${entry.location_area.name} ${detail.method.name}`
        const row: Encounter = rows.get(key) ?? {
          location: entry.location_area.name,
          method: detail.method.name,
          minLevel: detail.min_level,
          maxLevel: detail.max_level,
          chance: version.max_chance,
        }
        row.minLevel = Math.min(row.minLevel, detail.min_level)
        row.maxLevel = Math.max(row.maxLevel, detail.max_level)
        rows.set(key, row)
      }
      byVersion.set(version.version.name, rows)
    }
  }
  return Object.fromEntries(
    [...byVersion]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([version, rows]) => [
        version,
        [...rows.values()].sort(
          (a, b) =>
            (a.location < b.location ? -1 : a.location > b.location ? 1 : 0) ||
            (a.method < b.method ? -1 : a.method > b.method ? 1 : 0)
        ),
      ])
  )
}

type Species = {
  id: number
  name: string
  generation: Link
  names: Named[]
  genera: (Named & { genus: string })[]
  flavor_text_entries: (Named & { flavor_text: string; version: Link })[]
  evolution_chain: { url: string }
}

/** Steps 5 and 6: a Pokémon's page data, its forms' extras given. */
export function pokemonDetail(
  api: ApiData,
  speciesId: number,
  forms: PokemonDetail["forms"]
): PokemonDetail {
  const species = api.get<Species>("pokemon-species", speciesId)
  return {
    key: species.name,
    number: species.id,
    name: english(species.names)?.name ?? species.name,
    category: english(species.genera)?.genus ?? "",
    generation: idOf(species.generation.url),
    forms,
    evolution: evolution(api, species.evolution_chain.url),
    entries: species.flavor_text_entries
      .filter((entry) => entry.language.name === "en")
      .map((entry) => ({
        version: entry.version.name,
        text: normalise(entry.flavor_text),
      })),
    names: Object.fromEntries(
      species.names
        .map((name) => [name.language.name, name.name] as const)
        .sort(([a], [b]) => (a < b ? -1 : 1))
    ),
  }
}

type VersionGroup = {
  name: string
  order: number
  generation: Link
  pokedexes: Link[]
  versions: Link[]
}

type Pokedex = {
  name: string
  names: Named[]
  region: Link | null
  pokemon_entries: { entry_number: number; pokemon_species: Link }[]
}

export type Exclusives = {
  game: string
  link: string
  /** Form → the version it's only in. */
  forms: Record<string, string>
}[]

/**
 * Step 8: each game (a version group) in release order, with its versions
 * and Pokédexes. A Pokédex lists species; each becomes its form native to
 * the Pokédex's region (the lowest PokéAPI ID among forms keyed with the
 * region, as Paldea's Tauros is its Combat Breed), else its default form.
 * Each form's `games` lists the games whose Pokédex names it.
 */
export function games(
  api: ApiData,
  forms: FormSummary[],
  covered: ReadonlySet<string>,
  exclusives: Exclusives
): Game[] {
  const bySpecies = new Map<string, FormSummary[]>()
  for (const form of forms) {
    bySpecies.set(form.pokemon, [...(bySpecies.get(form.pokemon) ?? []), form])
  }
  const result: Game[] = []
  const unusedExclusives = new Set(exclusives.map((each) => each.game))
  for (const id of api.ids("version-group")) {
    const group = api.get<VersionGroup>("version-group", id)
    const onlyIn =
      exclusives.find((each) => each.game === group.name)?.forms ?? {}
    unusedExclusives.delete(group.name)
    const versions = group.versions.map((link) => ({
      key: link.name,
      name:
        english(api.follow<{ names: Named[] }>(link).names)?.name ?? link.name,
    }))
    const pokedexes = group.pokedexes.map((link) => {
      const pokedex = api.follow<Pokedex>(link)
      return {
        key: pokedex.name,
        name: english(pokedex.names)?.name ?? pokedex.name,
        entries: [...pokedex.pokemon_entries]
          .sort((a, b) => a.entry_number - b.entry_number)
          .flatMap((entry) => {
            const form = nativeForm(
              bySpecies.get(entry.pokemon_species.name) ?? [],
              pokedex.region?.name
            )
            if (form === undefined) {
              return []
            }
            if (!form.games.includes(group.name)) {
              form.games.push(group.name)
            }
            const version = onlyIn[form.key]
            return [
              {
                form: form.key,
                regionalNumber: entry.entry_number,
                ...(version === undefined ? {} : { onlyIn: version }),
              },
            ]
          }),
      }
    })
    result.push({
      key: group.name,
      name: listName(versions.map((version) => version.name)),
      generation: idOf(group.generation.url),
      versions,
      pokedexes,
      encountersCovered: versions.some((version) => covered.has(version.key)),
    })
  }
  if (unusedExclusives.size > 0) {
    throw new Error(
      `exclusives.json names games api-data doesn't have: ${[...unusedExclusives].join(", ")}.`
    )
  }
  return result
}

function nativeForm(
  forms: FormSummary[],
  region: string | undefined
): FormSummary | undefined {
  const regional =
    region === undefined
      ? []
      : forms
          .filter(
            (form) =>
              form.kind === "regional" && form.key.split("-").includes(region)
          )
          .sort((a, b) => a.sourceId - b.sourceId)
  return regional[0] ?? forms.find((form) => form.isDefault)
}

/** "Scarlet and Violet"; "Red, Green and Blue". */
function listName(names: string[]): string {
  return names.length < 2
    ? (names[0] ?? "")
    : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`
}

/**
 * Each location area's English name, else its location's (many areas
 * have none of their own), else its key.
 */
export function locationNames(
  api: ApiData,
  areas: readonly Link[]
): Record<string, string> {
  return Object.fromEntries(
    [...new Map(areas.map((area) => [area.name, area]))]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([key, link]) => {
        const area = api.follow<{ names: Named[]; location: Link }>(link)
        const name =
          english(area.names)?.name ??
          english(api.follow<{ names: Named[] }>(area.location).names)?.name ??
          key
        return [key, name]
      })
  )
}
