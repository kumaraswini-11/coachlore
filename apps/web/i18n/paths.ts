import type { Route } from "next"
import type { Locale } from "next-intl"

import { routing } from "@/i18n/routing"

/**
 * Every page, without its language: the one list the sitemap, links and
 * metadata take paths from. paths.test.ts checks that each has its
 * `app/[lang]/…/page.tsx`. A spec that adds a page adds it here.
 */
export const PAGES = ["/", "/about", "/legal", "/offline"] as const

export type Path = (typeof PAGES)[number]

/** The sitemap's pages: the public ones (`/offline` is for the offline Dex). */
export const PUBLIC_PAGES: readonly Path[] = ["/", "/about", "/legal"]

/**
 * An address in a language: `/hi/about` from `hi` and `/about`. Typed routes
 * see `/[lang]/…`, so it's `Path` that's checked, and the result is cast
 * once, here (Next.js's TypeScript docs: "cast with `as Route`").
 */
export function localeHref(locale: Locale, path: Path): Route {
  return (path === "/" ? `/${locale}` : `/${locale}${path}`) as Route
}

/**
 * The same page in another language: `/en/x` to `/hi/x`. It takes any
 * address the browser is on, so it isn't limited to `Path`.
 */
export function switchLocale(pathname: string, locale: Locale): Route {
  const [, first, ...rest] = pathname.split("/")
  const isLocale = (routing.locales as readonly string[]).includes(first ?? "")
  const path = isLocale ? `/${rest.join("/")}` : pathname
  return (path === "/" ? `/${locale}` : `/${locale}${path}`) as Route
}

/**
 * A page's canonical address and its other languages: `hreflang` for each
 * language, and `x-default` for the default one. Used by its metadata and by
 * the sitemap, so the two always agree.
 */
export function pageAlternates(locale: Locale, path: Path) {
  return {
    canonical: localeHref(locale, path),
    languages: {
      ...Object.fromEntries(
        routing.locales.map((other) => [other, localeHref(other, path)])
      ),
      "x-default": localeHref(routing.defaultLocale, path),
    } as Record<string, Route>,
  }
}
