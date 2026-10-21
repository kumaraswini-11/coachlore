import type * as React from "react"
import { Geist_Mono, Inter, Noto_Sans_Devanagari } from "next/font/google"
import type { Locale } from "next-intl"

import { cn } from "@workspace/ui/lib/utils"

// Loaded once and imported where needed, as Next.js's "font definitions
// file" recommends.
// Their variables are the theme's names for them (packages/ui globals.css).
export const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-interface",
})

// Only for codes such as an error reference, so not preloaded: most pages
// show none (spec 001's audit measured 23 KB saved on every page).
export const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-code",
  preload: false,
})

// Inter has no Devanagari letters. Not preloaded: the root layout serves
// every language, and a preload there would fetch it on English pages too
// (Next.js's font docs, "Preloading"). Only Hindi pages name it, so an
// English page's one Devanagari word (the language switch's "हिन्दी") uses
// the system's font rather than fetching 119 KB for it.
export const fontDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  preload: false,
})

// The fonts a language adds after Inter, which keeps the Latin letters.
const SCRIPT_FONTS: Partial<Record<Locale, string>> = {
  hi: fontDevanagari.style.fontFamily,
}

// The classes on <html>: both fonts' variables, the sans font as the default,
// and antialiasing. The root layout and global-error both render <html>.
export const rootClassName = cn(
  "antialiased",
  fontMono.variable,
  "font-sans",
  fontSans.variable
)

/**
 * A language's script font, as `--font-script` on <html>: the theme puts it
 * after Inter, which keeps the Latin letters (packages/ui globals.css).
 */
export function fontStyle(locale: Locale): React.CSSProperties | undefined {
  const script = SCRIPT_FONTS[locale]
  return script
    ? ({ "--font-script": script } as React.CSSProperties)
    : undefined
}
