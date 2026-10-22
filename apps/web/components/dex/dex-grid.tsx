"use client"

import { memo, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { useWindowVirtualizer } from "@tanstack/react-virtual"

import type { FormSummary } from "@workspace/dex/types"
import { ItemGroup } from "@workspace/ui/components/shadcn-ui/item"

// The grid's columns by its own width, as the CSS has them (`@xl`, `@4xl`,
// `@7xl`: 36, 56 and 80 rem): 2 on a phone, up to 5 on a wide screen
// (spec 003, "Screens").
const COLUMNS: [minRem: number, columns: number][] = [
  [80, 5],
  [56, 4],
  [36, 3],
]
const GAP = 12
const GRID =
  "grid grid-cols-2 gap-3 @xl:grid-cols-3 @4xl:grid-cols-4 @7xl:grid-cols-5"
// A card's height below its square image, before it's measured: the
// footer's padding, one line of name, the badges and the gap.
const CARD_TEXT = 96

function columnsFor(width: number): number {
  const rem = width / 16
  return COLUMNS.find(([min]) => rem >= min)?.[1] ?? 2
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
  const [columns, setColumns] = useState(2)
  const [width, setWidth] = useState(0)
  const [top, setTop] = useState(0)

  // Measured before the first paint, so the grid never shows the wrong
  // number of columns.
  useLayoutEffect(() => {
    const element = list.current
    if (element === null) {
      return
    }
    const measure = () => {
      const box = element.getBoundingClientRect()
      setWidth(box.width)
      setColumns(columnsFor(box.width))
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
    // The square image is a column wide.
    estimateSize: () =>
      (width - GAP * (columns - 1)) / columns + CARD_TEXT + GAP,
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
          className="absolute inset-x-0 top-0 grid gap-3 pb-3"
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
