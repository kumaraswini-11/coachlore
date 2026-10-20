import type { Metadata } from "next"
import Link from "next/link"

import { EmptyState } from "@workspace/ui/components/empty-state"
import { buttonVariants } from "@workspace/ui/components/shadcn-ui/button"
import { cn } from "@workspace/ui/lib/utils"

// Next.js answers with a 404 status and adds <meta name="robots"
// content="noindex"> to this page itself.
export const metadata: Metadata = {
  title: "Page not found",
  description: "There’s no page at this address on Draftboard.",
}

export default function NotFound() {
  return (
    <main className="flex min-h-svh p-6">
      <EmptyState
        titleAs="h1"
        title="Page not found"
        description="There’s no page at this address. Check the link, or start again from the home page."
      >
        {/* A link styled as a button keeps its link role, as shadcn's
            Base UI Button docs advise. */}
        <Link href="/" className={cn(buttonVariants(), "h-11 px-4")}>
          Go to the home page
        </Link>
      </EmptyState>
    </main>
  )
}
