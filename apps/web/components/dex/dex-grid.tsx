"use client"

import { memo, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { useWindowVirtualizer } from "@tanstack/react-virtual"

import type { FormSummary } from "@workspace/dex/types"
import { ItemGroup } from "@workspace/ui/components/shadcn-ui/item"

// The grid's columns by its own width, as the CSS has them (`@xl`, `@3xl`,
// `@6xl`: 36, 48 and 72 rem): 3 on a phone, up to 8 on a wide screen
// (spec 003, "Screens").
const COLUMNS: [minRem: number, columns: number][] = [
  [72, 8],
  [48, 6],
  [36, 4],
]
const GRID =
  "grid grid-cols-3 gap-2.5 @xl:grid-cols-4 @3xl:grid-cols-6 @6xl:grid-cols-8"
// A card's height before it's measured: its sprite, number, one line of
// name and one of badges, and the gap.
const ROW_ESTIMATE = 200

function columnsFor(width: number): number {
  const rem = width / 16
  return COLUMNS.find(([min]) => rem >= min)?.[1] ?? 3
}

/**
 * The forms as cards. The list is `ItemGroup`, laid out as a grid; each
 * card is a `Card` (a tile, where `Item` is a row).
 *
 * Only the rows on screen and a few beyond are in the page: laying out
 * 1,339 cards is what made a filter change slow on a phone (spec 003,
 * criterion 5; spec 001: "The grid renders only what's on screen"). Each
 * card still says where it is in the whole list (`aria-posinset`,
 * `aria-setsize`). `virtual={false}` renders the forms given as a plain
 * grid, for the static page before the browser loads.
 */
export const DexGrid = memo(function DexGrid({
  forms,
  card,
  virtual = true,
  total = forms.length,
}: {
  forms: readonly FormSummary[]
  card: (form: FormSummary) => ReactNode
  virtual?: boolean
  /** How many forms the list has: more than `forms` in the preview. */
  total?: number
}) {
  if (!virtual) {
    return (
      <ItemGroup className={GRID}>
        {forms.map((form, index) => (
          <Cell
            key={form.key}
            form={form}
            index={index}
            total={total}
            card={card}
          />
        ))}
      </ItemGroup>
    )
  }
  return <VirtualGrid forms={forms} card={card} />
})

function VirtualGrid({
  forms,
  card,
}: {
  forms: readonly FormSummary[]
  card: (form: FormSummary) => ReactNode
}) {
  const list = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(3)
  const [top, setTop] = useState(0)

  // Measured before the first paint, so the grid never shows the wrong
  // number of columns.
  useLayoutEffect(() => {
    const element = list.current
    if (element === null) {
      return
    }
    const measure = () => {
      setColumns(columnsFor(element.getBoundingClientRect().width))
      setTop(element.getBoundingClientRect().top + window.scrollY)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const rows = Math.ceil(forms.length / columns)
  const virtualizer = useWindowVirtualizer({
    count: rows,
    estimateSize: () => ROW_ESTIMATE,
    overscan: 3,
    scrollMargin: top,
  })

  return (
    <ItemGroup
      ref={list}
      className="relative block"
      style={{ height: virtualizer.getTotalSize() }}
    >
      {virtualizer.getVirtualItems().map((row) => (
        // A row only lays its cards out; it's not part of the list.
        <div
          key={row.key}
          role="none"
          data-index={row.index}
          ref={virtualizer.measureElement}
          className="absolute inset-x-0 top-0 grid gap-2.5 pb-2.5"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            transform: `translateY(${row.start - virtualizer.options.scrollMargin}px)`,
          }}
        >
          {forms
            .slice(row.index * columns, (row.index + 1) * columns)
            .map((form, offset) => (
              <Cell
                key={form.key}
                form={form}
                index={row.index * columns + offset}
                total={forms.length}
                card={card}
              />
            ))}
        </div>
      ))}
    </ItemGroup>
  )
}

function Cell({
  form,
  index,
  total,
  card,
}: {
  form: FormSummary
  index: number
  total: number
  card: (form: FormSummary) => ReactNode
}) {
  return (
    // ItemGroup is a list; each card's link sits in its item.
    <div role="listitem" aria-posinset={index + 1} aria-setsize={total}>
      {card(form)}
    </div>
  )
}
