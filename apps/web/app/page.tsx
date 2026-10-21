import type { Metadata } from "next"

import { Button } from "@workspace/ui/components/shadcn-ui/button"

import { ThemeToggle } from "@/components/theme-toggle"
import { OPEN_GRAPH, SITE } from "@/lib/site"
import { siteUrl } from "@/lib/site-url"

// No title: the home page shows the root layout's title.default, since a
// layout's title template doesn't apply to the page in its own segment.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { ...OPEN_GRAPH, url: "/" },
}

// Structured data for search engines (https://schema.org/WebSite), rendered
// as Next.js's JSON-LD guide shows: "<" escaped, so the JSON can't close the
// script tag.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  url: siteUrl(),
}

export default function Page() {
  return (
    <div className="flex min-h-svh p-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">Project ready!</h1>
          <p>You may now add components and start building.</p>
          <p>We&apos;ve already added the button component for you.</p>
          <Button className="mt-2">Button</Button>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <p className="font-mono text-xs text-muted-foreground">
            (Press <kbd>d</kbd> to toggle dark mode; turn it off in the theme
            menu)
          </p>
        </div>
      </div>
    </div>
  )
}
