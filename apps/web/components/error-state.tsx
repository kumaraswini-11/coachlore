import { EmptyState } from "@workspace/ui/components/empty-state"
import { Button } from "@workspace/ui/components/shadcn-ui/button"

/**
 * What error.tsx and global-error.tsx show: what failed and a way to try
 * again, announced to screen readers as an alert, in strings the page has
 * already translated. Both are Client Components, so this needs no
 * "use client" of its own; as an entry point it couldn't take `retry`, a
 * function, since such props must be serializable.
 *
 * It renders no <main>: inside a language it sits in the shell's, and
 * global-error brings its own.
 */
function ErrorState({
  title,
  description,
  reference,
  retryLabel,
  retry,
}: {
  title: string
  description: string
  /** The error reference (its digest), when there is one. */
  reference?: string
  retryLabel: string
  retry: () => void
}) {
  return (
    <div className="flex p-6">
      <EmptyState
        titleAs="h1"
        role="alert"
        title={title}
        description={
          <>
            {description}
            {reference ? <> {reference}</> : null}
          </>
        }
      >
        <Button className="h-11 px-4" onClick={() => retry()}>
          {retryLabel}
        </Button>
      </EmptyState>
    </div>
  )
}

export { ErrorState }
