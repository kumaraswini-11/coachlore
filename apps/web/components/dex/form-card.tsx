import type { Route } from "next"

import type { FormSummary } from "@workspace/dex/types"
import { Card } from "@workspace/ui/components/shadcn-ui/card"
import { TypeBadges } from "@workspace/ui/components/type-badge"
import { typeColorVars } from "@workspace/ui/lib/type-colors"

import type { TypeWords } from "@/lib/dex-types"

import { IntentLink } from "./intent-link"
import { dexNumber } from "./words"

/**
 * One form in the grid (spec 003, "Browse the Dex"): its artwork on its
 * first type's tint, number, name and types, all one link named for the
 * whole card ("#0208 Steelix, Steel and Ground"), prefetched on intent.
 * Names wrap rather than cut off.
 */
export function FormCard({
  form,
  href,
  label,
  typeNames,
  typeLang,
  noImage,
}: TypeWords & {
  form: FormSummary
  href: Route
  /** The link's name, in the page's language. */
  label: string
  /** The placeholder's text for a form without an image. */
  noImage: string
}) {
  // The official artwork; the pixel sprite where a form has none.
  const image = form.artwork ?? form.sprite
  return (
    <IntentLink
      href={href}
      aria-label={label}
      className="group/form block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {/* Tinted with its first type's colour (`--type-color`). */}
      <Card
        style={typeColorVars(form.types[0])}
        className="h-full gap-0 overflow-hidden p-0 transition-[translate,box-shadow] duration-(--duration-fast) group-hover/form:-translate-y-0.5 group-hover/form:shadow-lg group-hover/form:ring-[color-mix(in_oklab,var(--type-color)_55%,transparent)] motion-reduce:transition-none motion-reduce:group-hover/form:translate-y-0"
      >
        <span className="relative flex aspect-square items-center justify-center bg-[radial-gradient(circle_at_50%_40%,color-mix(in_oklab,var(--type-color)_30%,transparent),transparent_72%)]">
          {/* On the image's corner, in a layer above the artwork (its drop
              shadow puts it in a layer of its own), so a narrow card's
              artwork never covers it. */}
          <span className="inset-s-3 absolute top-3 z-10 text-xs text-muted-foreground tabular-nums">
            {dexNumber(form.number)}
          </span>
          {image === null ? (
            <span className="px-2 text-center text-xs text-muted-foreground">
              {noImage}
            </span>
          ) : (
            // A plain image: the artwork is prepared at its size (spec 002),
            // so next/image has nothing to optimise, and its client code on
            // each of the grid's cards slowed a filter change (spec 003,
            // criterion 5).
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt=""
              width={256}
              height={256}
              loading="lazy"
              decoding="async"
              className="size-[82%] object-contain drop-shadow-lg"
            />
          )}
        </span>
        <span className="flex flex-col gap-2 border-t p-4">
          <span
            lang="en"
            className="text-base leading-snug font-semibold wrap-anywhere"
          >
            {form.name}
          </span>
          <TypeBadges types={form.types} names={typeNames} lang={typeLang} />
        </span>
      </Card>
    </IntentLink>
  )
}
