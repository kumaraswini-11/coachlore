"use client"

import { useId, useState } from "react"

import {
  FORM_KINDS,
  STAT_FILTER_KEYS,
  type DexFilter,
  type StatFilterKey,
} from "@workspace/dex/filter"
import { TYPE_KEYS, type TypeKey } from "@workspace/dex/types"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/shadcn-ui/accordion"
import { Checkbox } from "@workspace/ui/components/shadcn-ui/checkbox"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/shadcn-ui/combobox"
import { Input } from "@workspace/ui/components/shadcn-ui/input"
import { Label } from "@workspace/ui/components/shadcn-ui/label"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/shadcn-ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/shadcn-ui/select"
import { Slider } from "@workspace/ui/components/shadcn-ui/slider"
import { TypeBadge } from "@workspace/ui/components/type-badge"

import { fill } from "@/i18n/error-messages"
import type { DexLabels } from "@/lib/dex-labels"

import { roman } from "./words"

export type Named = { key: string; name: string }

type Props = {
  filter: DexFilter
  onChange: (filter: DexFilter) => void
  games: readonly Named[]
  abilities: readonly Named[]
  statMax: Record<StatFilterKey, number>
  labels: DexLabels
  typeNames: Record<TypeKey, string>
  typeLang: string
}

const GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

/**
 * The Dex's filters (spec 003, "Browse the Dex"), one group each: the panel
 * on a wide screen, the bottom drawer on a phone. Every change goes to
 * `onChange` at once; the browser writes it to the address.
 */
export function DexFilters(props: Props) {
  const { filter, onChange, labels } = props
  const set = (patch: Partial<DexFilter>) => onChange({ ...filter, ...patch })

  return (
    <Accordion multiple defaultValue={["type"]} className="w-full">
      {(["type", "weak", "resist"] as const).map((group) => (
        <AccordionItem key={group} value={group}>
          <AccordionTrigger>{labels.groups[group]}</AccordionTrigger>
          <AccordionContent>
            <TypeChoice
              {...props}
              chosen={filter[group] ?? []}
              label={labels.groups[group]}
              onChoose={(types) =>
                set({ [group]: types.length > 0 ? types : undefined })
              }
            />
          </AccordionContent>
        </AccordionItem>
      ))}

      <AccordionItem value="game">
        <AccordionTrigger>{labels.groups.game}</AccordionTrigger>
        <AccordionContent>
          <Select
            items={[
              { value: "", label: labels.anyGame },
              ...props.games.map((game) => ({
                value: game.key,
                label: game.name,
              })),
            ]}
            value={filter.game ?? ""}
            onValueChange={(game) => set({ game: game || undefined })}
          >
            <SelectTrigger className="w-full" aria-label={labels.groups.game}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{labels.anyGame}</SelectItem>
              {props.games.map((game) => (
                <SelectItem key={game.key} value={game.key} lang="en">
                  {game.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="generation">
        <AccordionTrigger>{labels.groups.generation}</AccordionTrigger>
        <AccordionContent>
          <div
            role="group"
            aria-label={labels.groups.generation}
            className="grid grid-cols-3 gap-2"
          >
            {GENERATIONS.map((generation) => {
              const chosen = filter.gen ?? []
              return (
                <Label key={generation} className="min-h-11">
                  <Checkbox
                    checked={chosen.includes(generation)}
                    aria-label={fill(labels.generation, {
                      roman: roman(generation),
                    })}
                    onCheckedChange={(checked) => {
                      const next = checked
                        ? [...chosen, generation].sort((a, b) => a - b)
                        : chosen.filter((each) => each !== generation)
                      set({ gen: next.length > 0 ? next : undefined })
                    }}
                  />
                  {roman(generation)}
                </Label>
              )
            })}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="ability">
        <AccordionTrigger>{labels.groups.ability}</AccordionTrigger>
        <AccordionContent>
          <AbilityChoice {...props} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="stats">
        <AccordionTrigger>{labels.groups.stats}</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-5">
          {STAT_FILTER_KEYS.map((key) => (
            <StatRange
              key={key}
              stat={key}
              range={filter.stats?.[key]}
              max={props.statMax[key]}
              labels={labels}
              onRange={(range) => {
                const stats = { ...filter.stats }
                if (range === undefined) {
                  delete stats[key]
                } else {
                  stats[key] = range
                }
                set({
                  stats: Object.keys(stats).length > 0 ? stats : undefined,
                })
              }}
            />
          ))}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="forms">
        <AccordionTrigger>{labels.groups.forms}</AccordionTrigger>
        <AccordionContent>
          <RadioGroup
            aria-label={labels.groups.forms}
            value={filter.forms ?? "default"}
            onValueChange={(kind) =>
              set({
                forms:
                  kind === "default" ? undefined : (kind as DexFilter["forms"]),
              })
            }
          >
            {FORM_KINDS.map((kind) => (
              <Label key={kind} className="min-h-11">
                <RadioGroupItem value={kind} />
                {labels.formKinds[kind]}
              </Label>
            ))}
          </RadioGroup>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

/** Up to two of the eighteen types, each a checkbox labelled with its badge. */
function TypeChoice({
  chosen,
  label,
  onChoose,
  labels,
  typeNames,
  typeLang,
}: Props & {
  chosen: readonly TypeKey[]
  label: string
  onChoose: (types: TypeKey[]) => void
}) {
  const hint = useId()
  const full = chosen.length >= 2
  return (
    <div className="flex flex-col gap-2">
      <p id={hint} className="text-muted-foreground">
        {labels.upToTwo}
      </p>
      <div
        role="group"
        aria-label={label}
        aria-describedby={hint}
        className="grid grid-cols-2 gap-x-3 gap-y-1"
      >
        {TYPE_KEYS.map((type) => {
          const checked = chosen.includes(type)
          return (
            <Label key={type} className="min-h-11">
              <Checkbox
                checked={checked}
                disabled={full && !checked}
                onCheckedChange={(next) =>
                  onChoose(
                    next
                      ? [...chosen, type]
                      : chosen.filter((each) => each !== type)
                  )
                }
              />
              <TypeBadge type={type} lang={typeLang}>
                {typeNames[type]}
              </TypeBadge>
            </Label>
          )
        })}
      </div>
    </div>
  )
}

function AbilityChoice({ filter, onChange, abilities, labels }: Props) {
  const items = abilities.map((ability) => ({
    value: ability.key,
    label: ability.name,
  }))
  const selected = items.find((item) => item.value === filter.ability) ?? null
  return (
    <Combobox
      items={items}
      value={selected}
      onValueChange={(item) => onChange({ ...filter, ability: item?.value })}
      itemToStringLabel={(item) => item.label}
      isItemEqualToValue={(item, value) => item.value === value.value}
    >
      <ComboboxInput
        className="w-full"
        aria-label={labels.groups.ability}
        placeholder={labels.abilityPlaceholder}
        triggerLabel={labels.abilityTrigger}
        showClear
        clearLabel={labels.abilityClear}
      />
      <ComboboxContent>
        <ComboboxEmpty>{labels.abilityEmpty}</ComboboxEmpty>
        <ComboboxList>
          {(item: (typeof items)[number]) => (
            <ComboboxItem key={item.value} value={item}>
              <span lang="en">{item.label}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

type Range = { min?: number; max?: number }

/**
 * One stat's range: a slider with two thumbs, and a number field beside
 * each end (spec 001: "sliders have number inputs beside them"). The
 * slider moves freely and writes when it's let go; an end at the slider's
 * edge is open.
 */
function StatRange({
  stat,
  range,
  max,
  labels,
  onRange,
}: {
  stat: StatFilterKey
  range: Range | undefined
  max: number
  labels: DexLabels
  onRange: (range: Range | undefined) => void
}) {
  const id = useId()
  const committed: [number, number] = [range?.min ?? 0, range?.max ?? max]
  const [dragging, setDragging] = useState<[number, number] | null>(null)
  const [low, high] = dragging ?? committed
  const name = labels.sortKeys[stat]
  const lowLabel = fill(labels.statMin, { stat: name })
  const highLabel = fill(labels.statMax, { stat: name })

  const commit = (from: number, to: number) => {
    setDragging(null)
    const min = Math.max(0, Math.min(from, to))
    const top = Math.min(max, Math.max(from, to))
    onRange(
      min <= 0 && top >= max
        ? undefined
        : {
            ...(min > 0 ? { min } : {}),
            ...(top < max ? { max: top } : {}),
          }
    )
  }
  const field = (
    value: number,
    label: string,
    onValue: (value: number) => void
  ) => (
    <Input
      type="number"
      inputMode="numeric"
      min={0}
      max={max}
      value={value}
      aria-label={label}
      className="w-20 tabular-nums"
      onChange={(event) => {
        const next = Number(event.target.value)
        if (Number.isFinite(next)) {
          onValue(next)
        }
      }}
    />
  )

  return (
    <div role="group" aria-labelledby={id} className="flex flex-col gap-2">
      <span id={id} className="font-medium">
        {name}
      </span>
      <Slider
        min={0}
        max={max}
        value={[low, high]}
        thumbLabels={[lowLabel, highLabel]}
        onValueChange={(value) => {
          const [from = 0, to = max] = value as number[]
          setDragging([from, to])
        }}
        onValueCommitted={(value) => {
          const [from = 0, to = max] = value as number[]
          commit(from, to)
        }}
      />
      <div className="flex items-center justify-between gap-2">
        {field(low, lowLabel, (value) => commit(value, high))}
        {field(high, highLabel, (value) => commit(low, value))}
      </div>
    </div>
  )
}
