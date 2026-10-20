import { EmptyState } from "@workspace/ui/components/empty-state"
import { Button } from "@workspace/ui/components/shadcn-ui/button"

/**
 * What error.tsx and global-error.tsx show: what failed and a way to try
 * again, announced to screen readers as an alert. Both are Client Components,
 * so this needs no "use client" of its own; as an entry point it couldn't
 * take `retry`, a function, since such props must be serializable.
 */
function ErrorState({ digest, retry }: { digest?: string; retry: () => void }) {
  return (
    <main className="flex min-h-svh p-6">
      <EmptyState
        titleAs="h1"
        role="alert"
        title="Something went wrong"
        description={
          <>
            This page couldn&apos;t load. Try again; if it keeps happening, come
            back later.
            {digest ? <> (Error reference: {digest})</> : null}
          </>
        }
      >
        <Button className="h-11 px-4" onClick={() => retry()}>
          Try again
        </Button>
      </EmptyState>
    </main>
  )
}

export { ErrorState }
