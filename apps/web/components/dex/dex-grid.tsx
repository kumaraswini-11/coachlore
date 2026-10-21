import type { ReactNode } from "react"

import type { FormSummary } from "@workspace/dex/types"
import { ItemGroup } from "@workspace/ui/components/shadcn-ui/item"

/**
 * The forms as cards: 3 columns on a phone, up to 8 on a wide screen, by
 * the space the grid has (spec 003, "Screens"). The list is `ItemGroup`,
 * laid out as a grid; each card is a `Card` (a tile, where `Item` is a
 * row). A card off screen isn't rendered until it's near
 * (`content-visibility`), at a fixed height so nothing shifts.
 */
export function DexGrid({
  forms,
  card,
}: {
  forms: readonly FormSummary[]
  card: (form: FormSummary) => ReactNode
}) {
  return (
    <ItemGroup className="grid grid-cols-3 gap-2.5 @xl:grid-cols-4 @3xl:grid-cols-6 @6xl:grid-cols-8">
      {forms.map((form) => (
        // ItemGroup is a list; each card's link sits in its item.
        <div
          key={form.key}
          role="listitem"
          className="[contain-intrinsic-size:auto_12rem] [content-visibility:auto]"
        >
          {card(form)}
        </div>
      ))}
    </ItemGroup>
  )
}
