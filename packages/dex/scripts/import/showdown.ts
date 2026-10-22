import { Dex, type Species } from "@pkmn/dex"

import {
  STAT_KEYS,
  type FormSummary,
  type ShowdownNames,
} from "../../src/types.ts"

/**
 * Step 9 of spec 002's plan: Showdown's names for our forms, from
 * `@pkmn/dex` (Generation 9's data, every species it knows, the retired
 * ones too, so old battle logs read). Only the battle simulator's own
 * inventions (CAP, Custom) are left out.
 */

type ShowdownMatch = {
  showdown: ShowdownNames
  /** Showdown species that match no form, by name. */
  unmatched: string[]
  /** Matches whose types or base stats differ: a wrong match. */
  mismatched: string[]
}

const INVENTED = new Set(["CAP", "Custom"])

/** Showdown's IDs: lowercase letters and digits only. */
export function showdownId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "")
}

/**
 * Matches every Showdown species to one form: by the exceptions table, by
 * ID (`rotomwash` ↔ `rotom-wash`), a base species to its Pokémon's default
 * form (by National Dex number), a Totem to its form without "Totem", a
 * shortened forme to the one form of its Pokémon its ID begins
 * (`taurospaldeacombat` → `tauros-paldea-combat-breed`), and a forme with
 * no form of its own here (Vivillon's patterns, Arceus's plates, Ogerpon's
 * Tera forms) to its base species' form. A match made by name must have
 * the form's types and base stats; one made through the base needn't.
 * Fills each form's `gen9` and `tags` from the species named for it.
 */
/** A Showdown ID that doesn't match our key by rule, and why. */
type ShowdownException = {
  showdown: string
  key: string
  reason: string
}

export type ShowdownExceptions = Record<
  "species" | "moves" | "abilities",
  ShowdownException[]
>

export function matchShowdown(
  forms: FormSummary[],
  moves: readonly { key: string }[],
  abilities: readonly { key: string }[],
  exceptionLists: ShowdownExceptions
): ShowdownMatch {
  const exceptions = Object.fromEntries(
    exceptionLists.species.map((each) => [each.showdown, each.key])
  )
  const dex = Dex.forGen(9)
  const byId = new Map(forms.map((form) => [showdownId(form.key), form]))
  const byKey = new Map(forms.map((form) => [form.key, form]))
  const defaults = new Map(
    forms.filter((form) => form.isDefault).map((form) => [form.number, form])
  )
  const ids: Record<string, string> = {}
  const names: Record<string, string> = {}
  const unmatched: string[] = []
  const mismatched: string[] = []
  // Only species whose Pokémon the data has: all of them for the full
  // import, a few for the test sample.
  const numbers = new Set(forms.map((form) => form.number))
  const species = dex.species
    .all()
    .filter(
      (each) =>
        !INVENTED.has(String(each.isNonstandard)) && numbers.has(each.num)
    )
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))

  const used = new Set<string>()
  const byName = (each: Species): FormSummary | undefined => {
    const exception = exceptions[each.id]
    if (exception !== undefined) {
      used.add(each.id)
      const form = byKey.get(exception)
      if (form === undefined) {
        throw new Error(
          `showdown-exceptions.json maps ${each.id} to ${exception}, which isn't a form.`
        )
      }
      return form
    }
    const exact = byId.get(each.id)
    if (exact !== undefined) {
      return exact
    }
    if (each.forme === "") {
      // "Maushold" is its Family of Three: the base forme Showdown names.
      const base = showdownId(each.baseForme)
      const named = forms
        .filter(
          (form) =>
            form.number === each.num &&
            base !== "" &&
            showdownId(form.key).startsWith(each.id) &&
            showdownId(form.key).includes(base)
        )
        .sort((a, b) => a.key.length - b.key.length)
      return named[0] ?? defaults.get(each.num)
    }
    if (each.forme.includes("Totem")) {
      return byId.get(showdownId(each.name.replace(/-?Totem/, "")))
    }
    const prefixed = forms
      .filter(
        (form) =>
          form.number === each.num && showdownId(form.key).startsWith(each.id)
      )
      .sort((a, b) => a.key.length - b.key.length)
    return prefixed[0] !== undefined &&
      prefixed[0].key.length !== prefixed[1]?.key.length
      ? prefixed[0]
      : undefined
  }

  for (const each of species) {
    let form = byName(each)
    if (form !== undefined) {
      if (!sameBattleData(each, form)) {
        mismatched.push(`${each.name} → ${form.key}`)
      }
      // The first species named for a form gives its name, flag and tags.
      if (names[form.key] === undefined) {
        names[form.key] = each.name
        form.gen9 = each.isNonstandard === null
        form.tags = [...each.tags].sort()
      }
    } else if (each.forme !== "") {
      // No form of its own: the form it changes from (Ogerpon-Wellspring
      // for its Tera form), else its base species'.
      const from =
        typeof each.battleOnly === "string"
          ? each.battleOnly
          : (each.changesFrom ?? each.baseSpecies)
      const base = dex.species.get(from)
      form = base.exists ? byName(base) : undefined
    }
    if (form === undefined) {
      unmatched.push(each.name)
      continue
    }
    ids[each.id] = form.key
  }
  const unused = Object.keys(exceptions).filter(
    (id) => !used.has(id) && numbers.has(dex.species.get(id).num)
  )
  if (unused.length > 0) {
    throw new Error(
      `showdown-exceptions.json names species Showdown doesn't have: ${unused.join(", ")}.`
    )
  }
  return {
    showdown: {
      ids,
      names,
      moves: keysById(moves, exceptionLists.moves),
      abilities: keysById(abilities, exceptionLists.abilities),
    },
    unmatched,
    mismatched,
  }
}

/**
 * Each of our moves or abilities by its Showdown ID (`u-turn` is `uturn`),
 * plus the exceptions; an exception to a key we don't have fails.
 */
function keysById(
  items: readonly { key: string }[],
  exceptions: readonly ShowdownException[]
): Record<string, string> {
  const keys = new Set(items.map((item) => item.key))
  for (const each of exceptions) {
    if (!keys.has(each.key)) {
      throw new Error(
        `showdown-exceptions.json maps ${each.showdown} to ${each.key}, which we don't have.`
      )
    }
  }
  return Object.fromEntries(
    [
      ...items.map((item) => [showdownId(item.key), item.key] as const),
      ...exceptions.map((each) => [each.showdown, each.key] as const),
    ].sort(([a], [b]) => (a < b ? -1 : 1))
  )
}

const SHOWDOWN_STATS = ["hp", "atk", "def", "spa", "spd", "spe"] as const

function sameBattleData(species: Species, form: FormSummary): boolean {
  return (
    species.types.map((type) => type.toLowerCase()).join() ===
      form.types.join() &&
    STAT_KEYS.every(
      (key, index) =>
        species.baseStats[SHOWDOWN_STATS[index] ?? "hp"] === form.stats[key]
    )
  )
}
