import { cn } from "cn"
import { Loader2Icon } from "lucide-react"

// `label` is what a screen reader announces, in the page's language.
function Spinner({
  className,
  label,
  ...props
}: React.ComponentProps<"svg"> & { label: string }) {
  return (
    <Loader2Icon
      data-slot="spinner"
      role="status"
      aria-label={label}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
