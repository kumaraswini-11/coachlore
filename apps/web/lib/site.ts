/**
 * Coachlore's name and colours: the one source for them in page titles,
 * link previews (Open Graph, https://ogp.me/), the web app manifest, robots
 * and the sitemap. Titles and descriptions are in each language's messages
 * (`messages/`), written to Google's guidance on title links and snippets
 * (https://developers.google.com/search/docs/appearance/title-link,
 * https://developers.google.com/search/docs/appearance/snippet).
 */
export const SITE = {
  name: "Coachlore",
  // The theme's --background in light and dark (packages/ui/src/styles/
  // globals.css: oklch(1 0 0) and oklch(0.145 0 0)) as hex, which the web
  // app manifest and the browser's theme colour expect.
  colors: { light: "#ffffff", dark: "#0a0a0a" },
} as const

/**
 * A page's full title, "Not found · Coachlore". The layout's title template
 * is this; the pages Next.js gives no template (not-found, the error
 * pages) call it themselves.
 */
export function pageTitle(title: string): string {
  return `${title} · ${SITE.name}`
}

/**
 * The Open Graph fields every page shares. A page that sets `openGraph`
 * replaces the layout's whole object (Next.js merges metadata shallowly), so
 * it spreads these back in and adds its own `url`, which Open Graph requires,
 * and its language's `locale`.
 */
export const OPEN_GRAPH = {
  siteName: SITE.name,
  type: "website",
} as const
