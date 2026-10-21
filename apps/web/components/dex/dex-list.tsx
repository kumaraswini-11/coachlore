import type { Route } from "next"
import Link from "next/link"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

import type { DexSort, StatFilterKey } from "@workspace/dex/filter"
import { STAT_KEYS, type FormSummary, type TypeKey } from "@workspace/dex/types"
import { Button } from "@workspace/ui/components/shadcn-ui/button"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/shadcn-ui/table"
import { TypeBadge } from "@workspace/ui/components/type-badge"

import { fill } from "@/i18n/error-messages"
import type { DexLabels } from "@/lib/dex-labels"

import { dexNumber } from "./form-card"

const STAT_COLUMNS: StatFilterKey[] = [...STAT_KEYS, "total"]

/**
 * The forms as a table with their base stats (spec 003, "Screens"): on a
 * phone, number, name, types and total, the six stats on a line under the
 * name; with room, a column per stat. Every stat column sorts by its
 * header; the number and name columns too.
 */
export function DexList({
  forms,
  href,
  sort,
  onSort,
  labels,
  typeNames,
  typeLang,
}: {
  forms: readonly FormSummary[]
  href: (form: FormSummary) => Route
  sort: DexSort
  onSort: (key: DexSort["key"]) => void
  labels: DexLabels
  typeNames: Record<TypeKey, string>
  typeLang: string
}) {
  const header = (key: DexSort["key"], text: string, className?: string) => {
    const active = sort.key === key
    return (
      <TableHead
        key={key}
        className={className}
        aria-sort={
          active ? (sort.descending ? "descending" : "ascending") : undefined
        }
      >
        <Button
          variant="ghost"
          size="sm"
          className="-mx-2"
          onClick={() => onSort(key)}
          aria-label={fill(labels.sortColumn, { column: labels.sortKeys[key] })}
        >
          {text}
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

  return (
    <Table>
      <TableCaption className="sr-only">{labels.tableCaption}</TableCaption>
      <TableHeader>
        <TableRow>
          {header("number", labels.columns.number)}
          {header("name", labels.columns.name)}
          <TableHead className={wide}>{labels.columns.types}</TableHead>
          {STAT_COLUMNS.map((key) =>
            header(
              key,
              labels.columns[key],
              key === "total" ? "text-end" : `${wide} text-end`
            )
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {forms.map((form) => (
          <TableRow key={form.key}>
            <TableCell className="text-muted-foreground tabular-nums">
              {dexNumber(form.number)}
            </TableCell>
            <TableCell className="whitespace-normal">
              <Link
                href={href(form)}
                lang="en"
                className="font-medium underline-offset-4 hover:underline"
              >
                {form.name}
              </Link>
              <span className="mt-1 flex flex-wrap gap-1 @2xl:hidden">
                {form.types.map((type) => (
                  <TypeBadge key={type} type={type} lang={typeLang}>
                    {typeNames[type]}
                  </TypeBadge>
                ))}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground tabular-nums @2xl:hidden">
                {STAT_KEYS.map(
                  (key) => `${labels.columns[key]} ${form.stats[key]}`
                ).join(" · ")}
              </span>
            </TableCell>
            <TableCell className={wide}>
              <span className="flex flex-wrap gap-1">
                {form.types.map((type) => (
                  <TypeBadge key={type} type={type} lang={typeLang}>
                    {typeNames[type]}
                  </TypeBadge>
                ))}
              </span>
            </TableCell>
            {STAT_KEYS.map((key) => (
              <TableCell key={key} className={`${wide} text-end tabular-nums`}>
                {form.stats[key]}
              </TableCell>
            ))}
            <TableCell className="text-end font-medium tabular-nums">
              {form.statTotal}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
