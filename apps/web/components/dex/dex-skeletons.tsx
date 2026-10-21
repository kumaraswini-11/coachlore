import { Card } from "@workspace/ui/components/shadcn-ui/card"
import { Skeleton } from "@workspace/ui/components/shadcn-ui/skeleton"

/**
 * The grid while the forms load: cards the size and shape of the real
 * ones, so nothing shifts when they arrive (spec 001, "States every view
 * has"). Hidden from screen readers, which hear `label` instead.
 */
export function DexGridSkeleton({
  count = 18,
  label,
}: {
  count?: number
  label: string
}) {
  return (
    <div role="status" aria-label={label} className="@container">
      <div
        aria-hidden="true"
        className="grid grid-cols-3 gap-2.5 @xl:grid-cols-4 @3xl:grid-cols-6 @6xl:grid-cols-8"
      >
        {Array.from({ length: count }, (_, index) => (
          <Card key={index} size="sm" className="items-center gap-1.5 px-2">
            <Skeleton className="size-24 rounded-lg" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-14 rounded-4xl" />
          </Card>
        ))}
      </div>
    </div>
  )
}

/** The list while the forms load: rows the height of the real ones. */
export function DexListSkeleton({
  count = 10,
  label,
}: {
  count?: number
  label: string
}) {
  return (
    <div role="status" aria-label={label}>
      <div aria-hidden="true" className="flex flex-col">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="flex items-center gap-4 border-b p-2">
            <Skeleton className="h-4 w-12" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-24 rounded-4xl" />
            </div>
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
      </div>
    </div>
  )
}
