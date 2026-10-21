import type { Route } from "next"
import Image from "next/image"
import Link from "next/link"

import type { FormSummary, TypeKey } from "@workspace/dex/types"
import { Card } from "@workspace/ui/components/shadcn-ui/card"
import { TypeBadge } from "@workspace/ui/components/type-badge"

/** "#0082": the national number as the games write it. */
export function dexNumber(number: number): string {
  return `#${String(number).padStart(4, "0")}`
}

/**
 * One form in the grid (spec 003, "Browse the Dex"): its sprite at a fixed
 * size, number, name and types, all one link named for the whole card
 * ("#0208 Steelix, Steel and Ground"). Names wrap rather than cut off.
 */
export function FormCard({
  form,
  href,
  label,
  typeNames,
  typeLang,
  noImage,
}: {
  form: FormSummary
  href: Route
  /** The link's name, in the page's language. */
  label: string
  typeNames: Record<TypeKey, string>
  typeLang: string
  /** The placeholder's text for a form without a sprite. */
  noImage: string
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="group/form block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card
        size="sm"
        className="h-full items-center gap-1.5 px-2 text-center transition-colors duration-(--duration-fast) group-hover/form:bg-muted/60 motion-reduce:transition-none"
      >
        {form.sprite === null ? (
          <span className="flex size-24 items-center justify-center rounded-lg bg-muted px-2 text-xs text-muted-foreground">
            {noImage}
          </span>
        ) : (
          <Image
            src={form.sprite}
            alt=""
            width={96}
            height={96}
            unoptimized
            loading="lazy"
            className="size-24"
          />
        )}
        <span className="text-xs text-muted-foreground tabular-nums">
          {dexNumber(form.number)}
        </span>
        <span
          lang="en"
          className="text-sm font-medium [overflow-wrap:anywhere]"
        >
          {form.name}
        </span>
        <span className="flex flex-wrap justify-center gap-1">
          {form.types.map((type) => (
            <TypeBadge key={type} type={type} lang={typeLang}>
              {typeNames[type]}
            </TypeBadge>
          ))}
        </span>
      </Card>
    </Link>
  )
}
