"use client"

import {
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react"
import type { Route } from "next"
import { useSearchParams } from "next/navigation"
import { LayoutGridIcon, ListIcon, PlusIcon, SearchIcon } from "lucide-react"
import type { Locale } from "next-intl"

import {
  DEFAULT_SORT,
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
 * `value`, once the browser has drawn the frame showing what changed it:
 * after the next animation frame and a task, as a transition.
 */
function useAfterPaint<T>(value: T): T {
  const [shown, setShown] = useState(value)
  const [, startTransition] = useTransition()
  useEffect(() => {
    let task: ReturnType<typeof setTimeout> | undefined
    const frame = requestAnimationFrame(() => {
      task = setTimeout(() => startTransition(() => setShown(value)))
    })
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(task)
    }
  }, [value])
  return shown
}

/** The view from the address, and how to write a new one. */
type Address = {
  view: DexView
  /** The address's `q` as typed, spaces and all. */
  text: string
  write: (next: DexView, entry: "push" | "replace") => void
  /** The view as it is now: for a handler that mustn't change each render. */
  read: () => DexView
  /** The static page's stand-in: shows the forms given, as they are. */
  preview?: boolean
}

/**
 * Browse the Dex (spec 003): the forms filtered, sorted and shown as a grid
 * or a list, the view held here and mirrored in the address, so a link or
 * Back brings it back. Filtering runs here, over the
 * forms already loaded: no request, no spinner. A filter change is a new
 * history entry (Back undoes it); typing replaces the current one.
 */
export function DexBrowser(props: Props) {
  const { games, abilities } = props
  const params = useSearchParams()
  const known = useMemo(
    () => ({
      games: new Set(games.map((game) => game.key)),
      abilities: new Set(abilities.map((ability) => ability.key)),
    }),
    [games, abilities]
  )
  // The view is held here and the address follows it. A change shows on
  // the next paint: Next.js applies an address change as a transition, so a
  // control that waited for it painted late (spec 003, criterion 5). The
  // address still wins when it changes from elsewhere: Back, Forward, or a
  // link to another view of this page.
  const query = params.toString()
  const [state, setState] = useState(() => ({
    query,
    view: parseDexQuery(new URLSearchParams(query), known),
  }))
  let view = state.view
  if (query !== state.query) {
    view = parseDexQuery(new URLSearchParams(query), known)
    setState({ query, view })
  }
  const write = useCallback((next: DexView, entry: "push" | "replace") => {
    const written = toDexQuery(next)
    // Stored as the address will read back, so this write isn't taken for
    // a change from elsewhere.
    setState({ query: new URLSearchParams(written).toString(), view: next })
    const url = written === "" ? window.location.pathname : `?${written}`
    if (entry === "push") {
      window.history.pushState(null, "", url)
    } else {
      window.history.replaceState(null, "", url)
    }
  }, [])
  const read = useCallback(
    () => parseDexQuery(new URLSearchParams(window.location.search), known),
    [known]
  )
  return (
    <DexScreen
      {...props}
      address={{ view, text: params.get("q") ?? "", write, read }}
    />
  )
}

/**
 * The full browser on every form, the forms loaded as a file of their own
 * (a hashed chunk the browser and the service worker cache; plan 003,
 * "Rendering"). Suspends until they're in.
 */
export function DexBrowserLoader(props: Omit<Props, "forms">) {
  const forms = use(loadForms())
  return <DexBrowser {...props} forms={forms} />
}

let formsFile: Promise<FormSummary[]> | undefined
function loadForms(): Promise<FormSummary[]> {
  formsFile ??= import("@workspace/dex/forms.json").then(
    (module) => module.default as unknown as FormSummary[]
  )
  return formsFile
}

const DEFAULT_VIEW: DexView = { filter: {}, sort: DEFAULT_SORT, view: "grid" }

/**
 * The screen before the forms load: the default view of the forms given
 * (the first few), counted as `total`, so the first paint is real content
 * in the final layout and nothing shifts when the browser takes over. It
 * reads no address, so it's part of the static page.
 */
export function DexPreview(props: Props & { total: number }) {
  return (
    <DexScreen
      {...props}
      address={{
        view: DEFAULT_VIEW,
        text: "",
        write: () => {},
        read: () => DEFAULT_VIEW,
        preview: true,
      }}
    />
  )
}

function DexScreen({
  address,
  total,
  ...props
}: Props & { address: Address; total?: number }) {
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
  const { view, write, read } = address

  // The text box shows what's typed. It takes the address's text only on
  // Back and Forward: while typing, the address lags a keystroke behind and
  // would undo it.
  const [text, setText] = useState(address.text)
  useEffect(() => {
    const restore = () =>
      setText(new URLSearchParams(window.location.search).get("q") ?? "")
    window.addEventListener("popstate", restore)
    return () => window.removeEventListener("popstate", restore)
  }, [])

  // Each reads the view as it is now, so it stays the same function from
  // one render to the next, and the memoized parts skip rendering.
  const updateFilter = useCallback(
    (update: (filter: DexFilter) => DexFilter) => {
      const current = read()
      write({ ...current, filter: update(current.filter) }, "push")
    },
    [read, write]
  )
  const setSort = useCallback(
    (sort: DexSort) => write({ ...read(), sort }, "push"),
    [read, write]
  )

  // The results follow the view once the control's change has been drawn:
  // after the next frame, then as a transition that gives way to the next
  // keystroke or click. Rendering them first held that frame back (spec
  // 003, criterion 5; web.dev's "Optimize INP": yield after the visual
  // feedback). The grid and the list are memoized, so the control's own
  // render skips them.
  const shownView = useAfterPaint(view)
  const results = useMemo(
    () =>
      sortForms(filterForms(forms, shownView.filter, chart), shownView.sort),
    [forms, shownView.filter, chart, shownView.sort]
  )
  const card = useCallback(
    (form: FormSummary) => (
      <FormCard
        form={form}
        href={`/${locale}${formPath(form)}` as Route}
        label={cardLabel(labels.card, form, typeNames, locale)}
        typeNames={typeNames}
        typeLang={typeLang}
        noImage={labels.noImage}
      />
    ),
    [locale, labels, typeNames, typeLang]
  )
  const chips = chipsFor(view.filter, {
    labels,
    typeNames,
    typeLang,
    games,
    abilities,
  })
  const href = useCallback(
    (form: FormSummary) => `/${locale}${formPath(form)}` as Route,
    [locale]
  )
  // A column header sorts by it, or turns its order round.
  const sortColumn = useCallback(
    (key: DexSort["key"]) => {
      const current = read()
      write(
        {
          ...current,
          sort:
            current.sort.key === key
              ? { key, descending: !current.sort.descending }
              : { key, descending: key !== "number" && key !== "name" },
        },
        "push"
      )
    },
    [read, write]
  )
  const filters = (
    <DexFilters
      {...props}
      filter={view.filter}
      onChange={updateFilter}
      labels={labels}
    />
  )
  const clear = useCallback(() => updateFilter(() => ({})), [updateFilter])

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
            onRemove={(chip) => updateFilter(chip.remove)}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p role="status" className="font-medium tabular-nums">
            {plural(labels.count, total ?? results.length, locale)}
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
        ) : shownView.view === "list" ? (
          <DexList
            forms={results}
            href={href}
            sort={shownView.sort}
            onSort={sortColumn}
            labels={labels}
            typeNames={typeNames}
            typeLang={typeLang}
          />
        ) : (
          <DexGrid
            forms={results}
            card={card}
            virtual={!address.preview}
            total={total ?? results.length}
          />
        )}
      </div>
    </div>
  )
}
