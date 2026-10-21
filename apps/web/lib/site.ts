/**
 * Coachlore's name and line: the one source for page titles,
 * descriptions, link previews (Open Graph, https://ogp.me/), the web app
 * manifest, robots and the sitemap. Titles and descriptions follow Google's
 * guidance on title links and snippets
 * (https://developers.google.com/search/docs/appearance/title-link,
 * https://developers.google.com/search/docs/appearance/snippet).
 */
export const SITE = {
  name: "Coachlore",
  // The home page's title: the brand, then what it is.
  title: "Coachlore · Pokédex and draft leagues",
  description:
    "A fast, mobile-first Pokédex and a home for Pokémon draft leagues: live drafts, schedules, trades, standings and match recaps.",
  locale: "en_US",
  // The theme's --background in light and dark (packages/ui/src/styles/
  // globals.css: oklch(1 0 0) and oklch(0.145 0 0)) as hex, which the web
  // app manifest and the browser's theme colour expect.
  colors: { light: "#ffffff", dark: "#0a0a0a" },
} as const

/**
 * The Open Graph fields every page shares. A page that sets `openGraph`
 * replaces the layout's whole object (Next.js merges metadata shallowly), so
 * it spreads these back in and adds its own `url`, which Open Graph requires.
 */
export const OPEN_GRAPH = {
  siteName: SITE.name,
  type: "website",
  locale: SITE.locale,
} as const
