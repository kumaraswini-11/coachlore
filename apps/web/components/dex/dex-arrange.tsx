"use client"

import {
  ArrowDownWideNarrowIcon,
  ArrowUpNarrowWideIcon,
  LayoutGridIcon,
  Rows3Icon,
} from "lucide-react"

import { SORT_KEYS, type DexSort } from "@workspace/dex/filter"
import { Button } from "@workspace/ui/components/shadcn-ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/shadcn-ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/shadcn-ui/toggle-group"

import type { DexLabels } from "@/lib/dex-labels"
import type { DexView } from "@/lib/dex-query"

// One option of the view switch: the button stays clear, and its
// `::before` draws the tile, raised when pressed: 4 px from the track's
// edges and 2 px from the shared side, so every gap is 4 px.
const SEGMENT =
  "relative size-11 rounded-lg bg-transparent before:absolute before:inset-y-1 before:inset-s-1 before:inset-e-0.5 last:before:inset-s-0.5 last:before:inset-e-1 before:rounded-md before:transition-colors before:content-[''] hover:bg-transparent hover:before:bg-background/60 aria-pressed:bg-transparent aria-pressed:before:bg-background aria-pressed:before:shadow-sm dark:hover:before:bg-foreground/10 dark:aria-pressed:before:bg-foreground/15 [&_svg]:relative"

/**
 * How the results are arranged: the sort, its direction, and grid or list.
 * In the pinned bar on a wide screen, in the filters' drawer on a phone.
 */
export function DexArrange({
  sort,
  view,
  labels,
  onSortKey,
  onFlip,
  onView,
}: {
  sort: DexSort
  view: DexView["view"]
  labels: DexLabels
  /** A new sort key, in the order it starts in. */
  onSortKey: (key: DexSort["key"]) => void
  /** The same key, the other way round. */
  onFlip: () => void
  onView: (view: DexView["view"]) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        items={SORT_KEYS.map((key) => ({
          value: key,
          label: labels.sortKeys[key],
        }))}
        value={sort.key}
        onValueChange={(key) => key !== null && onSortKey(key)}
      >
        {/* As wide as its list's least width, so the two line up. */}
        <SelectTrigger
          aria-label={labels.sortLabel}
          className="min-h-11 min-w-36"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {SORT_KEYS.map((key) => (
              <SelectItem key={key} value={key}>
                {labels.sortKeys[key]}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {/* Pressed is high to low. */}
      <Button
        variant="outline"
        size="icon-touch"
        aria-label={labels.descending}
        aria-pressed={sort.descending}
        onClick={onFlip}
      >
        {sort.descending ? (
          <ArrowDownWideNarrowIcon aria-hidden="true" />
        ) : (
          <ArrowUpNarrowWideIcon aria-hidden="true" />
        )}
      </Button>
      {/* A segmented switch: a muted track, the chosen view on a raised
          tile. Each button is a full 44 px target; the tile is drawn 4 px
          inside it. */}
      <ToggleGroup
        spacing={0}
        className="rounded-lg bg-muted"
        aria-label={labels.viewLabel}
        value={[view]}
        onValueChange={(value) => {
          const next = value[0]
          if (next === "grid" || next === "list") {
            onView(next)
          }
        }}
      >
        <ToggleGroupItem
          value="grid"
          aria-label={labels.grid}
          className={SEGMENT}
        >
          <LayoutGridIcon aria-hidden="true" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="list"
          aria-label={labels.list}
          className={SEGMENT}
        >
          <Rows3Icon aria-hidden="true" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
