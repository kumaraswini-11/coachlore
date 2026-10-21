import {
  Item,
  ItemContent,
  ItemGroup,
  ItemTitle,
} from "@workspace/ui/components/shadcn-ui/item"

/**
 * A long list under the sticky top bar, for criterion 9: a focused row is
 * never hidden under a sticky bar (WCAG 2.4.11).
 */
export function LongList({ row }: { row: (n: number) => string }) {
  return (
    <section>
      <ItemGroup>
        {/* ItemGroup is a list; a button row can't also be its item. */}
        {Array.from({ length: 40 }, (_, index) => (
          <div key={index} role="listitem">
            <Item
              variant="outline"
              render={<button type="button" />}
              className="min-h-11 w-full text-start"
            >
              <ItemContent>
                <ItemTitle>{row(index + 1)}</ItemTitle>
              </ItemContent>
            </Item>
          </div>
        ))}
      </ItemGroup>
    </section>
  )
}
