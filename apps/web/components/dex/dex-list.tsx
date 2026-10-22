import { memo } from "react"
import type { Route } from "next"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import type { Locale } from "next-intl"

import type { DexSort, StatFilterKey } from "@workspace/dex/filter"
import { STAT_KEYS, type FormSummary } from "@workspace/dex/types"
import { Button } from "@workspace/ui/components/shadcn-ui/button"
import { Card } from "@workspace/ui/components/shadcn-ui/card"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/shadcn-ui/table"
import { TypeBadges } from "@workspace/ui/components/type-badge"
import { cn } from "@workspace/ui/lib/utils"

import { fill } from "@/i18n/fill"
import type { DexLabels } from "@/lib/dex-labels"
import type { TypeWords } from "@/lib/dex-types"

import { IntentLink } from "./intent-link"
import { dexNumber, statList } from "./words"

const STAT_COLUMNS: StatFilterKey[] = [...STAT_KEYS, "total"]

// Column headers: small, uppercase, muted; the sorted one in full colour,
// with its arrow (the arrow and aria-sort say which, not the colour).
const HEAD =
  "text-xs font-medium tracking-wider text-muted-foreground uppercase"

/**
 * The forms as a table with their base stats (spec 003, "Screens"), in a
 * card, the numbers centred in their columns: on a phone, number, name,
 * types and total, the six stats on a line under the name; with room, a
 * column per stat. Each name has its sprite beside it, and a click anywhere
 * on a row opens the form. Every stat column sorts by its header; the
 * number and name columns too.
 */
export const DexList = memo(function DexList({
  forms,
  href,
  sort,
  onSort,
  labels,
  locale,
  typeNames,
  typeLang,
}: TypeWords & {
  forms: readonly FormSummary[]
  href: (form: FormSummary) => Route
  sort: DexSort
  onSort: (key: DexSort["key"]) => void
  labels: DexLabels
  locale: Locale
}) {
  const header = (key: DexSort["key"], className?: string) => {
    const active = sort.key === key
    const short = labels.columns[key]
    return (
      <TableHead
        key={key}
        className={className}
        aria-sort={
          active ? (sort.descending ? "descending" : "ascending") : undefined
        }
      >
        {/* Named from what it shows ("Atk, sort by Attack"), so a voice
            command that says the shown text finds it (WCAG 2.5.3). */}
        <Button
          variant="ghost"
          size="touch"
          className={cn("-mx-2 px-2", HEAD, active && "text-foreground")}
          onClick={() => onSort(key)}
          aria-label={fill(labels.sortColumn, {
            short,
            column: labels.sortKeys[key],
          })}
        >
          {short}
          {active &&
            (sort.descending ? (
              <ArrowDownIcon aria-hidden="true" />
            ) : (
              <ArrowUpIcon aria-hidden="true" />
            ))}
        </Button>
      </TableHead>
    )
  }
  const wide = "hidden @2xl:table-cell"
  const badges = (form: FormSummary, className?: string) => (
    <TypeBadges
      types={form.types}
      names={typeNames}
      lang={typeLang}
      className={className}
    />
  )

  return (
    // A card like the grid's. Cells 8 px from their neighbours on a phone,
    // where the row is narrow, 16 px once every column shows.
    <Card className="gap-0 overflow-hidden p-0">
      <Table className="[&_td]:px-2 @2xl:[&_td]:px-4 [&_th]:px-2 @2xl:[&_th]:px-4">
        <TableCaption className="sr-only">{labels.tableCaption}</TableCaption>
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent">
            {header("number", "h-12")}
            {header("name")}
            <TableHead className={cn(wide, HEAD)}>
              {labels.columns.types}
            </TableHead>
            {STAT_COLUMNS.map((key) =>
              header(
                key,
                key === "total" ? "text-center" : `${wide} text-center`
              )
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {forms.map((form) => {
            // The small sprite suits a row; the artwork where there's none.
            const image = form.sprite ?? form.artwork
            return (
              // The whole row opens the form: the name's link stretches over
              // it (its ::after), so it stays one real link, Ctrl-click and
              // all, and its focus ring outlines the row.
              <TableRow key={form.key} className="relative">
                <TableCell className="py-2 text-muted-foreground tabular-nums">
                  {dexNumber(form.number)}
                </TableCell>
                <TableCell className="py-2 whitespace-normal">
                  <span className="flex items-center gap-3">
                    {image === null ? (
                      // The row names the form; a gap keeps names aligned.
                      <span aria-hidden="true" className="size-10 shrink-0" />
                    ) : (
                      // A plain image, as on the cards (form-card.tsx).
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt=""
                        width={40}
                        height={40}
                        loading="lazy"
                        decoding="async"
                        className="size-10 shrink-0 object-contain"
                      />
                    )}
                    <span className="flex min-w-0 flex-col gap-1">
                      <IntentLink
                        href={href(form)}
                        lang="en"
                        className="font-semibold outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:ring-3 focus-visible:after:ring-ring/50 focus-visible:after:ring-inset"
                      >
                        {form.name}
                      </IntentLink>
                      {badges(form, "@2xl:hidden")}
                      {/* The stats on a phone: abbreviated for the eye,
                          named in full for a screen reader. */}
                      <span className="text-xs text-muted-foreground tabular-nums @2xl:hidden">
                        <span aria-hidden="true">
                          {STAT_KEYS.map(
                            (key) => `${labels.columns[key]} ${form.stats[key]}`
                          ).join(labels.statSeparator)}
                        </span>
                        <span className="sr-only">
                          {statList(form, labels.sortKeys, locale)}
                        </span>
                      </span>
                    </span>
                  </span>
                </TableCell>
                <TableCell className={cn(wide, "py-2")}>
                  {badges(form)}
                </TableCell>
                {STAT_KEYS.map((key) => (
                  <TableCell
                    key={key}
                    className={cn(
                      wide,
                      "py-2 text-center tabular-nums",
                      sort.key === key
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {form.stats[key]}
                  </TableCell>
                ))}
                <TableCell className="py-2 text-center font-semibold tabular-nums">
                  {form.statTotal}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
})
