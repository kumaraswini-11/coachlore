"use client"

import {
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
import type { Route } from "next"
import { useSearchParams } from "next/navigation"
import {
  ArrowDownWideNarrowIcon,
  ArrowUpNarrowWideIcon,
  LayoutGridIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  TableIcon,
} from "lucide-react"
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
import { Badge } from "@workspace/ui/components/shadcn-ui/badge"
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
  /** The page's heading, "Dex". */
  title: string
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

/** The games and abilities an address may name; any other is ignored. */
function useKnown({ games, abilities }: Pick<Props, "games" | "abilities">) {
  return useMemo(
    () => ({
      games: new Set(games.map((game) => game.key)),
      abilities: new Set(abilities.map((ability) => ability.key)),
    }),
    [games, abilities]
  )
}

/** Reads the view from the address as it is now. */
function useReadAddress(known: ReturnType<typeof useKnown>) {
  return useCallback(
    () => parseDexQuery(new URLSearchParams(window.location.search), known),
    [known]
  )
}

/** Writes a view to the address: a new entry Back undoes, or the same one. */
function writeAddress(next: DexView, entry: "push" | "replace") {
  const written = toDexQuery(next)
  const url = written === "" ? window.location.pathname : `?${written}`
  if (entry === "push") {
    window.history.pushState(null, "", url)
  } else {
    window.history.replaceState(null, "", url)
  }
}

// Whether the preview's search field had focus when the full browser took
// its place: the browser's field takes it back, so typing carries on.
let previewSearchFocused = false

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
function DexBrowser(props: Props) {
  const params = useSearchParams()
  const known = useKnown(props)
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
    // Stored as the address will read back, so this write isn't taken for
    // a change from elsewhere.
    setState({
      query: new URLSearchParams(toDexQuery(next)).toString(),
      view: next,
    })
    writeAddress(next, entry)
  }, [])
  const read = useReadAddress(known)
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
 * renders no address, so it's part of the static page; what's typed or
 * chosen before the forms load is written to the address, which the
 * browser opens with, so none of it is lost.
 */
export function DexPreview(props: Props & { total: number }) {
  const read = useReadAddress(useKnown(props))
  return (
    <DexScreen
      {...props}
      address={{
        view: DEFAULT_VIEW,
        text: "",
        write: writeAddress,
        read,
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
    title,
    locale,
    labels,
    typeNames,
    typeLang,
  } = props
  const { view, write, read, preview } = address

  // The preview's search field, focused as the browser replaces it, hands
  // its focus on, caret at the end. A cleanup runs before the field leaves
  // the page; the browser's layout effect runs in the same commit, and the
  // note is dropped after it, so leaving the page instead never passes it
  // to a later visit.
  const search = useRef<HTMLInputElement>(null)
  useLayoutEffect(() => {
    const field = search.current
    if (preview) {
      return () => {
        previewSearchFocused = document.activeElement === field
        queueMicrotask(() => {
          previewSearchFocused = false
        })
      }
    }
    if (previewSearchFocused && field !== null) {
      previewSearchFocused = false
      field.focus()
      field.setSelectionRange(field.value.length, field.value.length)
    }
  }, [preview])

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

  const empty = results.length === 0
  // A name typed in another script finds nothing, since names are English:
  // say so, rather than only "no match" (spec 003, 4).
  const otherScript = NON_LATIN.test(view.filter.q ?? "")
  // Sort and view: in the sticky bar on a wide screen, in the drawer on a
  // phone, where the bar holds only the search and the filters' button.
  const arrange = (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        items={SORT_KEYS.map((key) => ({
          value: key,
          label: labels.sortKeys[key],
        }))}
        value={view.sort.key}
        onValueChange={(key) =>
          key !== null && setSort({ ...read().sort, key })
        }
      >
        <SelectTrigger aria-label={labels.sortLabel} className="min-h-11">
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
      {/* Pressed is high to low. */}
      <Button
        variant="outline"
        size="icon"
        className="size-11"
        aria-label={labels.descending}
        aria-pressed={view.sort.descending}
        onClick={() => {
          const { sort } = read()
          setSort({ ...sort, descending: !sort.descending })
        }}
      >
        {view.sort.descending ? (
          <ArrowDownWideNarrowIcon aria-hidden="true" />
        ) : (
          <ArrowUpNarrowWideIcon aria-hidden="true" />
        )}
      </Button>
      <ToggleGroup
        variant="outline"
        spacing={0}
        aria-label={labels.viewLabel}
        value={[view.view]}
        onValueChange={(value) => {
          const next = value[0]
          if (next === "grid" || next === "list") {
            write({ ...read(), view: next }, "push")
          }
        }}
      >
        <ToggleGroupItem
          value="grid"
          aria-label={labels.grid}
          className="size-11"
        >
          <LayoutGridIcon aria-hidden="true" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="list"
          aria-label={labels.list}
          className="size-11"
        >
          <TableIcon aria-hidden="true" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p role="status" className="text-muted-foreground tabular-nums">
          {plural(labels.count, total ?? results.length, locale)}
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        {/* Stays in reach while the results scroll, and scrolls on its own
            when it is taller than the screen. Its 8 px each side are room
            for the groups' row highlight, which a scrolling box would clip. */}
        <aside className="sticky top-[calc(var(--sticky-top)+1rem)] -mx-2 hidden max-h-[calc(100dvh-var(--sticky-top)-2rem)] w-80 shrink-0 flex-col gap-2 overflow-y-auto overscroll-contain px-2 lg:flex">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              {labels.filters}
            </h2>
            {chips.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clear}>
                {labels.clearAll}
              </Button>
            )}
          </div>
          {filters}
        </aside>

        <div className="@container flex min-w-0 flex-1 flex-col gap-3">
          {/* The controls used most, pinned under the top bar; one row of
              44 px controls, which the page's scroll padding allows for
              (the root layout's `data-sticky-bar`). */}
          <div
            data-sticky-bar=""
            className="sticky top-(--sticky-top) z-30 -mx-1 flex flex-wrap items-center gap-2 bg-background/95 px-1 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80"
          >
            <InputGroup className="h-11 min-w-48 flex-1">
              <InputGroupAddon>
                <SearchIcon aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                ref={search}
                type="search"
                value={text}
                aria-label={labels.searchLabel}
                placeholder={labels.searchPlaceholder}
                onChange={(event) => {
                  const value = event.target.value
                  const current = read()
                  setText(value)
                  write(
                    {
                      ...current,
                      filter: { ...current.filter, q: value || undefined },
                    },
                    "replace"
                  )
                }}
              />
            </InputGroup>
            <Drawer>
              <DrawerTrigger
                render={
                  <Button variant="outline" className="min-h-11 lg:hidden" />
                }
              >
                <SlidersHorizontalIcon aria-hidden="true" />
                {labels.openFilters}
                {/* The number shows; "3 active filters" is what's read. */}
                {chips.length > 0 && (
                  <>
                    <Badge
                      variant="secondary"
                      aria-hidden="true"
                      className="tabular-nums"
                    >
                      {chips.length}
                    </Badge>
                    <span className="sr-only">
                      {plural(labels.activeFilters, chips.length, locale)}
                    </span>
                  </>
                )}
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
                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4">
                  {arrange}
                  {filters}
                </div>
                <DrawerFooter className="pt-4">
                  <DrawerClose render={<Button className="min-h-11" />}>
                    {plural(labels.showResults, results.length, locale)}
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
            <div className="hidden lg:block">{arrange}</div>
          </div>

          <FilterChips
            chips={chips}
            label={labels.chips.label}
            removeLabel={labels.chips.remove}
            onRemove={(chip) => updateFilter(chip.remove)}
          />

          {empty ? (
            <EmptyState
              title={otherScript ? labels.englishNamesTitle : labels.emptyTitle}
              description={
                otherScript
                  ? labels.englishNamesDescription
                  : labels.emptyDescription
              }
            >
              <Button onClick={clear}>{labels.clearAll}</Button>
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
    </div>
  )
}
