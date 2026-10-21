import { XIcon } from "lucide-react"

import { STAT_FILTER_KEYS, type DexFilter } from "@workspace/dex/filter"
import type { TypeKey } from "@workspace/dex/types"
import { Button } from "@workspace/ui/components/shadcn-ui/button"
import { ItemGroup } from "@workspace/ui/components/shadcn-ui/item"

import { fill } from "@/i18n/error-messages"
import type { DexLabels } from "@/lib/dex-labels"

import type { Named } from "./dex-filters"
import { roman } from "./words"

export type Chip = {
  id: string
  label: string
  /** The language of the label's name, where it's a name ("en"). */
  lang?: string
  remove: (filter: DexFilter) => DexFilter
}

/** Each active filter as a removable chip, in the panel's order. */
export function chipsFor(
  filter: DexFilter,
  {
    labels,
    typeNames,
    typeLang,
    games,
    abilities,
  }: {
    labels: DexLabels
    typeNames: Record<TypeKey, string>
    typeLang: string
    games: readonly Named[]
    abilities: readonly Named[]
  }
): Chip[] {
  const chips: Chip[] = []
  const without = <T,>(list: readonly T[] | undefined, item: T) => {
    const next = (list ?? []).filter((each) => each !== item)
    return next.length > 0 ? next : undefined
  }
  if (filter.q) {
    chips.push({
      id: "q",
      label: fill(labels.chips.q, { q: filter.q }),
      remove: (f) => ({ ...f, q: undefined }),
    })
  }
  for (const type of filter.type ?? []) {
    chips.push({
      id: `type-${type}`,
      label: typeNames[type],
      lang: typeLang,
      remove: (f) => ({ ...f, type: without(f.type, type) }),
    })
  }
  for (const [group, template] of [
    ["weak", labels.chips.weak],
    ["resist", labels.chips.resist],
  ] as const) {
    for (const type of filter[group] ?? []) {
      chips.push({
        id: `${group}-${type}`,
        label: fill(template, { type: typeNames[type] }),
        remove: (f) => ({ ...f, [group]: without(f[group], type) }),
      })
    }
  }
  if (filter.game) {
    chips.push({
      id: "game",
      label:
        games.find((game) => game.key === filter.game)?.name ?? filter.game,
      lang: "en",
      remove: (f) => ({ ...f, game: undefined }),
    })
  }
  for (const generation of filter.gen ?? []) {
    chips.push({
      id: `gen-${generation}`,
      label: fill(labels.chips.generation, { roman: roman(generation) }),
      remove: (f) => ({ ...f, gen: without(f.gen, generation) }),
    })
  }
  if (filter.ability) {
    chips.push({
      id: "ability",
      label:
        abilities.find((ability) => ability.key === filter.ability)?.name ??
        filter.ability,
      lang: "en",
      remove: (f) => ({ ...f, ability: undefined }),
    })
  }
  for (const key of STAT_FILTER_KEYS) {
    const range = filter.stats?.[key]
    if (range === undefined) {
      continue
    }
    const stat = labels.sortKeys[key]
    const label =
      range.min !== undefined && range.max !== undefined
        ? fill(labels.chips.statRange, {
            stat,
            min: String(range.min),
            max: String(range.max),
          })
        : range.min !== undefined
          ? fill(labels.chips.statMin, { stat, min: String(range.min) })
          : fill(labels.chips.statMax, { stat, max: String(range.max) })
    chips.push({
      id: `stat-${key}`,
      label,
      remove: (f) => {
        const stats = { ...f.stats }
        delete stats[key]
        return {
          ...f,
          stats: Object.keys(stats).length > 0 ? stats : undefined,
        }
      },
    })
  }
  if (filter.forms && filter.forms !== "default") {
    chips.push({
      id: "forms",
      label: labels.formKinds[filter.forms],
      remove: (f) => ({ ...f, forms: undefined }),
    })
  }
  return chips
}

export function FilterChips({
  chips,
  label,
  removeLabel,
  onRemove,
}: {
  chips: readonly Chip[]
  /** The chips' list name, "Active filters". */
  label: string
  /** "Remove the filter {label}". */
  removeLabel: string
  onRemove: (chip: Chip) => void
}) {
  if (chips.length === 0) {
    return null
  }
  return (
    <ItemGroup aria-label={label} className="flex-row flex-wrap gap-2">
      {chips.map((chip) => (
        <div key={chip.id} role="listitem">
          <Button
            variant="secondary"
            size="sm"
            className="min-h-11 sm:min-h-8"
            aria-label={fill(removeLabel, { label: chip.label })}
            onClick={() => onRemove(chip)}
          >
            <span lang={chip.lang}>{chip.label}</span>
            <XIcon aria-hidden="true" />
          </Button>
        </div>
      ))}
    </ItemGroup>
  )
}
