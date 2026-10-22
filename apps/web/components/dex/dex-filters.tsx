"use client"

import { memo, useCallback, useId, useState } from "react"
import { CheckIcon } from "lucide-react"

import {
  FORM_KINDS,
  STAT_FILTER_KEYS,
  TYPE_GROUPS,
  type DexFilter,
  type StatFilterKey,
  type StatRange,
  type TypeGroup,
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
import { Label } from "@workspace/ui/components/shadcn-ui/label"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/shadcn-ui/radio-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/shadcn-ui/select"
import { Slider } from "@workspace/ui/components/shadcn-ui/slider"
import { Toggle } from "@workspace/ui/components/shadcn-ui/toggle"
import { typeColorVars } from "@workspace/ui/lib/type-colors"
import { cn } from "@workspace/ui/lib/utils"

import { fill } from "@/i18n/fill"
import type { DexLabels } from "@/lib/dex-labels"
import type { Named, TypeWords } from "@/lib/dex-types"

import { roman } from "./words"

type Props = TypeWords & {
  filter: DexFilter
  /**
   * Takes how the filter changes, not the new filter, so a control's
   * handler never depends on the current filter and its row needn't render
   * again when another control changes it.
   */
  onChange: (update: (filter: DexFilter) => DexFilter) => void
  games: readonly Named[]
  abilities: readonly Named[]
  statMax: Record<StatFilterKey, number>
  labels: DexLabels
}

const GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

// A grid of checkbox or radio rows. The rows touch, each a 44 px target
// (AGENTS.md, "Interface") with its 20 px control centred, so 12 px of row
// sits above the first control and below the last; the margins take most of
// it back, so the group is spaced like the others, and the first row's
// target starts at the group's heading rather than over it.
const CHOICE_GRID = "-mt-1.5 -mb-2.5 grid gap-x-2 gap-y-0"

/**
 * The Dex's filters (spec 003, "Browse the Dex"), one group each: the panel
 * on a wide screen, the bottom drawer on a phone. Every change goes to
 * `onChange` at once; the browser writes it to the address.
 */
export const DexFilters = memo(function DexFilters(props: Props) {
  const { filter, onChange, labels } = props
  const set = (patch: Partial<DexFilter>) =>
    onChange((current) => ({ ...current, ...patch }))

  return (
    <Accordion multiple defaultValue={["type"]} className="w-full">
      {TYPE_GROUPS.map((group) => (
        <AccordionItem key={group} value={group}>
          <AccordionTrigger>{labels.groups[group]}</AccordionTrigger>
          <AccordionContent className="pt-1.5">
            <TypeChoice
              {...props}
              group={group}
              chosen={filter[group] ?? []}
              label={labels.groups[group]}
            />
          </AccordionContent>
        </AccordionItem>
      ))}

      <AccordionItem value="game">
        <AccordionTrigger>{labels.groups.game}</AccordionTrigger>
        <AccordionContent className="pt-1.5">
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
            <SelectTrigger
              className="min-h-11 w-full"
              aria-label={labels.groups.game}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="">{labels.anyGame}</SelectItem>
                {props.games.map((game) => (
                  <SelectItem key={game.key} value={game.key} lang="en">
                    {game.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="generation">
        <AccordionTrigger>{labels.groups.generation}</AccordionTrigger>
        <AccordionContent className="pt-1.5">
          <div
            role="group"
            aria-label={labels.groups.generation}
            className={cn(CHOICE_GRID, "grid-cols-3")}
          >
            {GENERATIONS.map((generation) => {
              const chosen = filter.gen ?? []
              return (
                <Label key={generation} className="min-h-11 font-normal">
                  <Checkbox
                    className="size-5"
                    checked={chosen.includes(generation)}
                    onCheckedChange={(checked) => {
                      const next = checked
                        ? [...chosen, generation].sort((a, b) => a - b)
                        : chosen.filter((each) => each !== generation)
                      set({ gen: next.length > 0 ? next : undefined })
                    }}
                  />
                  {fill(labels.generationShort, { roman: roman(generation) })}
                </Label>
              )
            })}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="ability">
        <AccordionTrigger>{labels.groups.ability}</AccordionTrigger>
        <AccordionContent className="pt-1.5">
          <AbilityChoice {...props} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="stats">
        <AccordionTrigger>{labels.groups.stats}</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 pt-1.5">
          {STAT_FILTER_KEYS.map((key) => (
            <StatSlider
              key={key}
              stat={key}
              range={filter.stats?.[key]}
              max={props.statMax[key]}
              labels={labels}
              onRange={(range) =>
                onChange((current) => {
                  const stats = { ...current.stats }
                  if (range === undefined) {
                    delete stats[key]
                  } else {
                    stats[key] = range
                  }
                  return {
                    ...current,
                    stats: Object.keys(stats).length > 0 ? stats : undefined,
                  }
                })
              }
            />
          ))}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="forms">
        <AccordionTrigger>{labels.groups.forms}</AccordionTrigger>
        <AccordionContent className="pt-1.5">
          <RadioGroup
            aria-label={labels.groups.forms}
            value={filter.forms ?? "default"}
            onValueChange={(kind) =>
              set({
                forms:
                  kind === "default" ? undefined : (kind as DexFilter["forms"]),
              })
            }
            // Two to a row, as the generations are three.
            className={cn(CHOICE_GRID, "grid-cols-2")}
          >
            {FORM_KINDS.map((kind) => (
              <Label key={kind} className="min-h-11 font-normal">
                <RadioGroupItem value={kind} className="size-5" />
                {labels.formKinds[kind]}
              </Label>
            ))}
          </RadioGroup>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
})

/** Up to two of the eighteen types, each a checkbox labelled with its badge. */
function TypeChoice({
  group,
  chosen,
  label,
  onChange,
  labels,
  typeNames,
  typeLang,
}: Props & {
  group: TypeGroup
  chosen: readonly TypeKey[]
  label: string
}) {
  const hint = useId()
  const full = chosen.length >= 2
  return (
    <div className="flex flex-col gap-2">
      {/* A span, not a p: the Accordion's panel puts a 1rem margin under
          every paragraph but the last. */}
      <span id={hint} className="block text-muted-foreground">
        {labels.upToTwo}
      </span>
      <div
        role="group"
        aria-label={label}
        aria-describedby={hint}
        // 24 px pills, each with a 44 px touch area: rows 44 px apart, so
        // neighbouring areas never overlap (AGENTS.md, "Interface").
        className="flex flex-wrap gap-x-2.5 gap-y-5 py-1"
      >
        {TYPE_KEYS.map((type) => {
          const checked = chosen.includes(type)
          return (
            <TypeOption
              key={type}
              group={group}
              type={type}
              checked={checked}
              disabled={full && !checked}
              name={typeNames[type]}
              lang={typeLang}
              onChange={onChange}
            />
          )
        })}
      </div>
    </div>
  )
}

// Renders again only when its own state changes.
const TypeOption = memo(function TypeOption({
  group,
  type,
  checked,
  disabled,
  name,
  lang,
  onChange,
}: {
  group: TypeGroup
  type: TypeKey
  checked: boolean
  disabled: boolean
  name: string
  lang: string
  onChange: Props["onChange"]
}) {
  const toggle = useCallback(
    (next: boolean) =>
      onChange((current) => {
        const chosen = current[group] ?? []
        const types = next
          ? [...chosen.filter((each) => each !== type), type]
          : chosen.filter((each) => each !== type)
        return { ...current, [group]: types.length > 0 ? types : undefined }
      }),
    [group, type, onChange]
  )
  return (
    <Toggle
      pressed={checked}
      disabled={disabled}
      onPressedChange={toggle}
      lang={lang}
      // The type's colours as variables, so every state of the Toggle (its
      // hover and pressed styles too) keeps them. Pressed adds a ring and a
      // check; an unpressed pill isn't dimmed, which took its name under
      // 4.5:1 (WCAG 1.4.3).
      style={typeColorVars(type)}
      className={cn(
        "relative h-6 min-h-6 min-w-0 gap-1 rounded-sm bg-(--type-color) px-2 text-xs font-medium text-(--type-color-foreground) after:absolute after:-inset-x-1 after:-inset-y-2.5 after:content-[''] hover:bg-(--type-color) hover:text-(--type-color-foreground) aria-pressed:bg-(--type-color) [&_svg:not([class*='size-'])]:size-3",
        checked && "ring-2 ring-foreground ring-offset-2 ring-offset-background"
      )}
    >
      {checked && <CheckIcon aria-hidden="true" />}
      {name}
    </Toggle>
  )
})

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
      onValueChange={(item) =>
        onChange((current) => ({ ...current, ability: item?.value }))
      }
      itemToStringLabel={(item) => item.label}
      isItemEqualToValue={(item, value) => item.value === value.value}
    >
      <ComboboxInput
        className="h-11 w-full"
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

/**
 * One stat's range: a slider with two thumbs, its values written beside
 * its name. The slider moves freely and writes when it's let go; an end at
 * the slider's edge is open. Without dragging, a click on the track moves
 * the nearer thumb and the arrow keys step it (WCAG 2.5.7), so it needs no
 * number fields (the owner's call, 2026-10-22; spec 001, "Browse the Dex").
 */
function StatSlider({
  stat,
  range,
  max,
  labels,
  onRange,
}: {
  stat: StatFilterKey
  range: StatRange | undefined
  max: number
  labels: DexLabels
  onRange: (range: StatRange | undefined) => void
}) {
  const id = useId()
  const committed: [number, number] = [range?.min ?? 0, range?.max ?? max]
  const [dragging, setDragging] = useState<[number, number] | null>(null)
  const [low, high] = dragging ?? committed
  const name = labels.sortKeys[stat]

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

  return (
    <div role="group" aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <span id={id} className="font-medium">
          {name}
        </span>
        {/* The thumbs announce their own values; this is for the eye. */}
        <span aria-hidden="true" className="text-muted-foreground tabular-nums">
          {fill(labels.statValues, { min: String(low), max: String(high) })}
        </span>
      </div>
      <Slider
        min={0}
        max={max}
        value={[low, high]}
        thumbLabels={[
          fill(labels.statMin, { stat: name }),
          fill(labels.statMax, { stat: name }),
        ]}
        onValueChange={(value) => {
          const [from = 0, to = max] = value as number[]
          setDragging([from, to])
        }}
        onValueCommitted={(value) => {
          const [from = 0, to = max] = value as number[]
          commit(from, to)
        }}
      />
    </div>
  )
}
