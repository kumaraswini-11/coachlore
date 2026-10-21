"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createTranslator, type Locale } from "next-intl"

import {
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/shadcn-ui/command"

import type { PaletteMessages } from "@/components/search/search-button"
import { SEARCH_SOURCES } from "@/components/search/sources"
import {
  MAX_RESULTS,
  type SearchResult,
  type SearchSource,
} from "@/components/search/types"

type Group = { source: SearchSource; results: SearchResult[] }

/**
 * The palette itself, loaded on first open (search-button.tsx). Phone: full
 * screen, the input at the top. Wider: a 640 px dialog in the top third
 * (spec 001, "The search palette"). The sources filter, so cmdk's own
 * filtering is off (`shouldFilter={false}`, cmdk's docs). The result count
 * is announced politely; Escape closes, and Base UI returns focus to what
 * was focused before.
 */
export default function SearchDialog({
  open,
  onOpenChange,
  locale,
  messages,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  locale: Locale
  messages: PaletteMessages
}) {
  const t = React.useMemo(
    () =>
      createTranslator({
        locale,
        messages: { palette: messages },
        namespace: "palette",
      }),
    [locale, messages]
  )
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [groups, setGroups] = React.useState<Group[]>([])

  React.useEffect(() => {
    // Only the latest query's results are kept, whatever order they arrive.
    let current = true
    const wanted = query.trim()
    Promise.all(
      SEARCH_SOURCES.map(async (source) => ({
        source,
        results: wanted
          ? (await source.search(wanted, locale)).slice(0, MAX_RESULTS)
          : [],
      }))
    ).then((found) => {
      if (current) {
        setGroups(found.filter((group) => group.results.length > 0))
      }
    })
    return () => {
      current = false
    }
  }, [query, locale])

  const count = groups.reduce((sum, group) => sum + group.results.length, 0)
  const status = !query.trim()
    ? t("empty")
    : count === 0
      ? t("noResults", { query: query.trim() })
      : t("results", { count })

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("title")}
      description={t("description")}
      closeLabel={t("close")}
      className="max-md:inset-s-0 max-md:top-0 max-md:h-dvh max-md:max-w-none! max-md:translate-x-0 max-md:rounded-none! md:max-w-[40rem]! max-md:rtl:translate-x-0"
    >
      <Command shouldFilter={false} className="max-md:rounded-none!">
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder={t("placeholder")}
          aria-label={t("title")}
        />
        {/* An empty listbox breaks WAI-ARIA's "required owned elements"
            (axe: aria-required-children), so the list is hidden while it
            has nothing, and the status below says why. */}
        <CommandList hidden={count === 0}>
          {groups.map(({ source, results }) => (
            <CommandGroup key={source.kind} heading={source.heading(locale)}>
              {results.map((result) => (
                <CommandItem
                  key={result.id}
                  value={result.id}
                  onSelect={() => {
                    onOpenChange(false)
                    router.push(result.href)
                  }}
                >
                  <span>{result.label}</span>
                  {result.detail ? (
                    <span className="ms-auto text-xs text-muted-foreground">
                      {result.detail}
                    </span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
      {/* The status, said politely when it changes (WCAG 4.1.3): shown
          while there are no results, read only once there are. */}
      <p
        aria-live="polite"
        className={
          count === 0
            ? "px-3 pt-2 pb-6 text-center text-sm text-muted-foreground"
            : "sr-only"
        }
      >
        {status}
      </p>
    </CommandDialog>
  )
}
