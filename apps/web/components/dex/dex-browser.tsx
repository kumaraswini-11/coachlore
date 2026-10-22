"use client"

import {
  use,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  useTransition,
} from "react"
import type { Route } from "next"
import { SearchIcon, SearchXIcon, SlidersHorizontalIcon } from "lucide-react"
import type { Locale } from "next-intl"

import {
  DEFAULT_SORT,
  defaultDescending,
  filterForms,
  sortForms,
  type DexFilter,
  type DexSort,
} from "@workspace/dex/filter"
import { formPath } from "@workspace/dex/paths"
import type { FormSummary } from "@workspace/dex/types"
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

import { PageTitle } from "@/components/page"
import type { DexLabels } from "@/lib/dex-labels"
import type { DexView } from "@/lib/dex-query"
import type { DexData, TypeWords } from "@/lib/dex-types"
import { plural } from "@/lib/plural"

import {
  useDexAddress,
  usePreviewAddress,
  useSearchHandOff,
  type Address,
} from "./dex-address"
import { DexArrange } from "./dex-arrange"
import { DexFilters } from "./dex-filters"
import { DexGrid } from "./dex-grid"
import { DexList } from "./dex-list"
import { chipsFor, FilterChips } from "./filter-chips"
import { FormCard } from "./form-card"
import { cardLabel } from "./words"

// A letter in any script but Latin: Devanagari, for one.
const NON_LATIN = /(?!\p{Script=Latin})\p{L}/u

type Props = DexData &
  TypeWords & {
    /** The page's heading, "Dex". */
    title: string
    locale: Locale
    labels: DexLabels
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

/**
 * Browse the Dex (spec 003): the forms filtered, sorted and shown as a grid
 * or a list, the view mirrored in the address (dex-address.ts). Filtering
 * runs here, over the forms already loaded: no request, no spinner. A
 * filter change is a new history entry (Back undoes it); typing replaces
 * the current one.
 */
function DexBrowser(props: Props) {
  return <DexScreen {...props} address={useDexAddress(props)} />
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
 * in the final layout and nothing shifts when the browser takes over.
 */
export function DexPreview(props: Props & { total: number }) {
  return (
    <DexScreen {...props} address={usePreviewAddress(props, DEFAULT_VIEW)} />
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
  const search = useSearchHandOff(preview)
  const filtersHeading = useId()

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
  // A new key starts in its own order (the Select and a column header
  // alike); the same key again turns it round.
  const sortBy = useCallback(
    (key: DexSort["key"]) => {
      const { sort } = read()
      setSort(
        sort.key === key
          ? { key, descending: !sort.descending }
          : { key, descending: defaultDescending(key) }
      )
    },
    [read, setSort]
  )
  const flip = useCallback(() => {
    const { sort } = read()
    setSort({ ...sort, descending: !sort.descending })
  }, [read, setSort])
  const setView = useCallback(
    (next: DexView["view"]) => write({ ...read(), view: next }, "push"),
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
  const href = useCallback(
    (form: FormSummary) => `/${locale}${formPath(form)}` as Route,
    [locale]
  )
  const card = useCallback(
    (form: FormSummary) => (
      <FormCard
        form={form}
        href={href(form)}
        label={cardLabel(labels.card, form, typeNames, locale)}
        typeNames={typeNames}
        typeLang={typeLang}
        noImage={labels.noImage}
      />
    ),
    [href, locale, labels, typeNames, typeLang]
  )
  const chips = chipsFor(view.filter, {
    labels,
    typeNames,
    typeLang,
    games,
    abilities,
  })
  const filters = (
    <DexFilters
      {...props}
      filter={view.filter}
      onChange={updateFilter}
      labels={labels}
    />
  )
  const clear = useCallback(() => updateFilter(() => ({})), [updateFilter])
  const arrange = (
    <DexArrange
      sort={view.sort}
      view={view.view}
      labels={labels}
      onSortKey={sortBy}
      onFlip={flip}
      onView={setView}
    />
  )

  const empty = results.length === 0
  // A name typed in another script finds nothing, since names are English:
  // say so, rather than only "no match" (spec 003, 4).
  const otherScript = NON_LATIN.test(view.filter.q ?? "")

  return (
    // The left column and the results side by side from the top. The left
    // column comes first, so Tab reaches the filters before the cards.
    <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:gap-6">
      {/* The title's line, then, on a wide screen, the filters panel. There
         it stays in reach while the results scroll, and scrolls on its own
         when it is taller than the screen. Its 12 px each side are room for
         the groups' row highlight (8 px) and its focus ring (3 px), which a
         scrolling box would clip. The browser's own scrollbar, thin and in
         --control-border (3:1, WCAG 1.4.11), with its room always kept, so
         opening a group never narrows it. Its own height (`self-start`), so
         it can stick; the results column takes the row's, so an empty state
         fills it beside a taller column. */}
      <div className="scrollbar-gutter-stable scrollbar-thin flex flex-col gap-2 [scrollbar-color:var(--control-border)_transparent] lg:sticky lg:top-(--sticky-top) lg:-mx-3 lg:max-h-[calc(100dvh-var(--sticky-top)-1rem)] lg:w-80 lg:shrink-0 lg:self-start lg:overflow-y-auto lg:overscroll-contain lg:px-3">
        {/* As tall as the pinned bar beside it, so the two lines align. */}
        <div className="flex items-center justify-between gap-2 lg:h-(--sticky-bar)">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <PageTitle>{title}</PageTitle>
            <p role="status" className="text-muted-foreground tabular-nums">
              {plural(labels.count, total ?? results.length, locale)}
            </p>
          </div>
          {/* On a phone, "Clear all" is in the drawer. */}
          {chips.length > 0 && (
            <Button
              variant="ghost"
              size="touch"
              className="hidden lg:inline-flex"
              onClick={clear}
            >
              {labels.clearAll}
            </Button>
          )}
        </div>
        {/* Its heading for screen readers: the groups' own headings sit
            under it, not straight under the page's h1. */}
        <aside aria-labelledby={filtersHeading} className="hidden lg:block">
          <h2 id={filtersHeading} className="sr-only">
            {labels.filters}
          </h2>
          {filters}
        </aside>
      </div>

      <div className="@container flex min-w-0 flex-1 flex-col gap-3">
        {/* The controls used most, a search landmark pinned under the top
            bar: one row, as tall as --sticky-bar, which the page's scroll
            padding allows for (the root layout's `data-sticky-bar`). */}
        <search
          data-sticky-bar=""
          className="sticky top-(--sticky-top) z-30 -mx-1 flex h-(--sticky-bar) items-center gap-2 bg-background/95 px-1 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        >
          <InputGroup className="h-11 min-w-0 flex-1">
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
                <Button variant="outline" size="touch" className="lg:hidden" />
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
                  <Button variant="ghost" size="touch" onClick={clear}>
                    {labels.clearAll}
                  </Button>
                )}
              </DrawerHeader>
              <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4">
                {arrange}
                {filters}
              </div>
              <DrawerFooter className="pt-4">
                <DrawerClose render={<Button size="touch" />}>
                  {plural(labels.showResults, results.length, locale)}
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
          <div className="hidden lg:block">{arrange}</div>
        </search>

        <FilterChips
          chips={chips}
          label={labels.chips.label}
          removeLabel={labels.chips.remove}
          onRemove={(chip) => updateFilter(chip.remove)}
        />

        {empty ? (
          // Fills the results' place, down to the footer or the panel's
          // foot (each layer from <main> down takes the height left), with
          // the message in its middle.
          <EmptyState
            media={<SearchXIcon aria-hidden="true" />}
            className="border border-dashed"
            title={otherScript ? labels.englishNamesTitle : labels.emptyTitle}
            description={
              otherScript
                ? labels.englishNamesDescription
                : labels.emptyDescription
            }
          >
            <Button size="touch" onClick={clear}>
              {labels.clearAll}
            </Button>
          </EmptyState>
        ) : shownView.view === "list" ? (
          <DexList
            forms={results}
            href={href}
            sort={shownView.sort}
            onSort={sortBy}
            labels={labels}
            locale={locale}
            typeNames={typeNames}
            typeLang={typeLang}
          />
        ) : (
          <DexGrid
            forms={results}
            card={card}
            virtual={!preview}
            total={total ?? results.length}
          />
        )}
      </div>
    </div>
  )
}
