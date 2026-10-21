"use client"

import { useDeferredValue, useMemo, useState, useTransition } from "react"
import type { Route } from "next"
import { useSearchParams } from "next/navigation"
import { LayoutGridIcon, ListIcon, PlusIcon, SearchIcon } from "lucide-react"
import type { Locale } from "next-intl"

import {
  filterForms,
  SORT_KEYS,
  sortForms,
  type DexFilter,
  type DexSort,
  type StatFilterKey,
} from "@workspace/dex/filter"
import { formPath } from "@workspace/dex/paths"
import type { FormSummary, TypeChart, TypeKey } from "@workspace/dex/types"
import { EmptyState } from "@workspace/ui/components/empty-state"
import { Button } from "@workspace/ui/components/shadcn-ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/ui/components/shadcn-ui/drawer"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@workspace/ui/components/shadcn-ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/shadcn-ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/shadcn-ui/toggle-group"

import type { DexLabels } from "@/lib/dex-labels"
import { parseDexQuery, toDexQuery, type DexView } from "@/lib/dex-query"
import { plural } from "@/lib/plural"

import { DexFilters, type Named } from "./dex-filters"
import { DexGrid } from "./dex-grid"
import { DexList } from "./dex-list"
import { chipsFor, FilterChips } from "./filter-chips"
import { FormCard } from "./form-card"
import { cardLabel } from "./words"

// A letter in any script but Latin: Devanagari, for one.
const NON_LATIN = /(?!\p{Script=Latin})\p{L}/u

/** What the browser shows, given by the page: the forms and what they name. */
export type DexData = {
  forms: FormSummary[]
  chart: TypeChart
  /** The games the forms' Pokédexes name, in release order. */
  games: Named[]
  /** The abilities the forms can have. */
  abilities: Named[]
  /** Each stat's highest in the dataset: the sliders' ends. */
  statMax: Record<StatFilterKey, number>
}

type Props = DexData & {
  locale: Locale
  labels: DexLabels
  typeNames: Record<TypeKey, string>
  typeLang: string
}

/**
 * Browse the Dex (spec 003): the forms filtered, sorted and shown as a grid
 * or a list, the view held in the address. Filtering runs here, over the
 * forms already loaded: no request, no spinner. A filter change is a new
 * history entry (Back undoes it); typing replaces the current one.
 */
export function DexBrowser(props: Props) {
  const {
    forms,
    chart,
    games,
    abilities,
    locale,
    labels,
    typeNames,
    typeLang,
  } = props
  const params = useSearchParams()
  const known = useMemo(
    () => ({
      games: new Set(games.map((game) => game.key)),
      abilities: new Set(abilities.map((ability) => ability.key)),
    }),
    [games, abilities]
  )
  const view = useMemo(
    () => parseDexQuery(new URLSearchParams(params.toString()), known),
    [params, known]
  )
  const [, startTransition] = useTransition()

  // The text box follows what's typed; Back or a link resets it.
  const addressText = params.get("q") ?? ""
  const [text, setText] = useState(addressText)
  const [shown, setShown] = useState(addressText)
  if (addressText !== shown) {
    setShown(addressText)
    setText(addressText)
  }

  const write = (next: DexView, entry: "push" | "replace") => {
    const query = toDexQuery(next)
    const url = query === "" ? window.location.pathname : `?${query}`
    startTransition(() => {
      if (entry === "push") {
        window.history.pushState(null, "", url)
      } else {
        window.history.replaceState(null, "", url)
      }
    })
  }
  const setFilter = (filter: DexFilter) => write({ ...view, filter }, "push")
  const setSort = (sort: DexSort) => write({ ...view, sort }, "push")

  const filter = useDeferredValue(view.filter)
  const results = useMemo(
    () => sortForms(filterForms(forms, filter, chart), view.sort),
    [forms, filter, chart, view.sort]
  )
  const chips = chipsFor(view.filter, {
    labels,
    typeNames,
    typeLang,
    games,
    abilities,
  })
  const href = (form: FormSummary) => `/${locale}${formPath(form)}` as Route
  const filters = (
    <DexFilters
      {...props}
      filter={view.filter}
      onChange={setFilter}
      labels={labels}
    />
  )
  const clear = () => write({ ...view, filter: {} }, "push")

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
      <aside className="hidden w-64 shrink-0 flex-col gap-2 lg:flex">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-medium">{labels.filters}</h2>
          {chips.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clear}>
              {labels.clearAll}
            </Button>
          )}
        </div>
        {filters}
      </aside>

      <div className="@container flex min-w-0 flex-1 flex-col gap-3">
        <InputGroup className="h-11">
          <InputGroupAddon>
            <SearchIcon aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            value={text}
            aria-label={labels.searchLabel}
            placeholder={labels.searchPlaceholder}
            onChange={(event) => {
              const value = event.target.value
              setText(value)
              setShown(value)
              write(
                { ...view, filter: { ...view.filter, q: value || undefined } },
                "replace"
              )
            }}
          />
        </InputGroup>

        <div className="flex flex-wrap items-center gap-2">
          <Drawer>
            <DrawerTrigger
              render={
                <Button variant="outline" className="min-h-11 lg:hidden" />
              }
            >
              <PlusIcon aria-hidden="true" />
              {labels.openFilters}
            </DrawerTrigger>
            <DrawerContent className="max-h-[85dvh]">
              <DrawerHeader className="flex-row items-center justify-between">
                <DrawerTitle>{labels.filters}</DrawerTitle>
                {chips.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clear}>
                    {labels.clearAll}
                  </Button>
                )}
              </DrawerHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-4">
                {filters}
              </div>
              <DrawerFooter className="pt-4">
                <DrawerClose render={<Button className="min-h-11" />}>
                  {plural(labels.showResults, results.length, locale)}
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
          <FilterChips
            chips={chips}
            label={labels.chips.label}
            removeLabel={labels.chips.remove}
            onRemove={(chip) => setFilter(chip.remove(view.filter))}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p role="status" className="font-medium tabular-nums">
            {plural(labels.count, results.length, locale)}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              items={SORT_KEYS.map((key) => ({
                value: key,
                label: labels.sortKeys[key],
              }))}
              value={view.sort.key}
              onValueChange={(key) =>
                key !== null && setSort({ ...view.sort, key })
              }
            >
              <SelectTrigger
                aria-label={labels.sortLabel}
                className="min-h-11 sm:min-h-8"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_KEYS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {labels.sortKeys[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              items={[
                { value: "ascending", label: labels.ascending },
                { value: "descending", label: labels.descending },
              ]}
              value={view.sort.descending ? "descending" : "ascending"}
              onValueChange={(direction) =>
                setSort({
                  ...view.sort,
                  descending: direction === "descending",
                })
              }
            >
              <SelectTrigger
                aria-label={labels.directionLabel}
                className="min-h-11 sm:min-h-8"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ascending">{labels.ascending}</SelectItem>
                <SelectItem value="descending">{labels.descending}</SelectItem>
              </SelectContent>
            </Select>
            <ToggleGroup
              aria-label={labels.viewLabel}
              value={[view.view]}
              onValueChange={(value) => {
                const next = value[0]
                if (next === "grid" || next === "list") {
                  write({ ...view, view: next }, "push")
                }
              }}
            >
              <ToggleGroupItem
                value="grid"
                aria-label={labels.grid}
                className="size-11 sm:size-8"
              >
                <LayoutGridIcon aria-hidden="true" />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="list"
                aria-label={labels.list}
                className="size-11 sm:size-8"
              >
                <ListIcon aria-hidden="true" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {results.length === 0 ? (
          // A name typed in another script finds nothing, since names are
          // English: say so, rather than only "no match" (spec 003, 4).
          <EmptyState
            title={
              NON_LATIN.test(view.filter.q ?? "")
                ? labels.englishNamesTitle
                : labels.emptyTitle
            }
            description={
              NON_LATIN.test(view.filter.q ?? "")
                ? labels.englishNamesDescription
                : labels.emptyDescription
            }
          >
            <Button onClick={clear}>{labels.emptyAction}</Button>
          </EmptyState>
        ) : view.view === "list" ? (
          <DexList
            forms={results}
            href={href}
            sort={view.sort}
            onSort={(key) =>
              setSort(
                view.sort.key === key
                  ? { key, descending: !view.sort.descending }
                  : { key, descending: key !== "number" && key !== "name" }
              )
            }
            labels={labels}
            typeNames={typeNames}
            typeLang={typeLang}
          />
        ) : (
          <DexGrid
            forms={results}
            card={(form) => (
              <FormCard
                form={form}
                href={href(form)}
                label={cardLabel(labels.card, form, typeNames, locale)}
                typeNames={typeNames}
                typeLang={typeLang}
                noImage={labels.noImage}
              />
            )}
          />
        )}
      </div>
    </div>
  )
}
