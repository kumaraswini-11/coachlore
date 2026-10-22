import type * as React from "react"

import { Badge } from "@workspace/ui/components/shadcn-ui/badge"
import {
  TYPE_CLASS_NAMES,
  type PokemonType,
} from "@workspace/ui/lib/type-colors"
import { cn } from "@workspace/ui/lib/utils"

/**
 * A Pokémon type: its name on its colour, so the type is always named and
 * never shown by colour alone (WCAG 1.4.1). `children` is the name, given by
 * the app in the page's language, and required.
 */
function TypeBadge({
  type,
  className,
  ...props
}: { type: PokemonType; children: string } & Omit<
  React.ComponentProps<typeof Badge>,
  "variant" | "children"
>) {
  return (
    <Badge
      {...props}
      data-type={type}
      className={cn(TYPE_CLASS_NAMES[type], className)}
    />
  )
}

/**
 * A form's types as badges, in order, wrapping: what a card, a list row or
 * a search result shows. `names` gives each type's name in the page's
 * language, `lang` the language they're written in.
 */
function TypeBadges({
  types,
  names,
  lang,
  className,
  ...props
}: {
  types: readonly PokemonType[]
  names: Record<PokemonType, string>
  lang?: string
} & React.ComponentProps<"span">) {
  return (
    <span className={cn("flex flex-wrap gap-1.5", className)} {...props}>
      {types.map((type) => (
        <TypeBadge key={type} type={type} lang={lang}>
          {names[type]}
        </TypeBadge>
      ))}
    </span>
  )
}

export { TypeBadge, TypeBadges }
