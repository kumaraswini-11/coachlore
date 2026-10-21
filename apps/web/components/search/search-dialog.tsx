"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { XIcon } from "lucide-react"
import { createTranslator, type Locale } from "next-intl"

import { Button } from "@workspace/ui/components/shadcn-ui/button"
import {
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/shadcn-ui/command"
import { DialogClose } from "@workspace/ui/components/shadcn-ui/dialog"
import { Spinner } from "@workspace/ui/components/shadcn-ui/spinner"

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
 * filtering is off (`shouldFilter={false}`, cmdk's docs). The status is
 * announced politely; Escape closes, and Base UI returns focus to what was
 * focused before.
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
  // The results with the query they answer, so the status never pairs a new
  // query with old results.
  const [found, setFound] = React.useState<{
    query: string
    groups: Group[]
  }>({ query: "", groups: [] })
  const wanted = query.trim()

  React.useEffect(() => {
    if (!wanted) {
      return
    }
    // Only the latest query's results are kept, whatever order they arrive.
    let current = true
    // A source that fails leaves the others' results standing.
    Promise.allSettled(
      SEARCH_SOURCES.map(async (source) => ({
        source,
        results: (await source.search(wanted, locale)).slice(0, MAX_RESULTS),
      }))
    ).then((settled) => {
      if (current) {
        setFound({
          query: wanted,
          groups: settled
            .filter((result) => result.status === "fulfilled")
            .map((result) => result.value)
            .filter((group) => group.results.length > 0),
        })
      }
    })
    return () => {
      current = false
    }
  }, [wanted, locale])

  const pending = wanted !== "" && wanted !== found.query
  const groups = wanted === "" || pending ? [] : found.groups
  const count = groups.reduce((sum, group) => sum + group.results.length, 0)
  const status = !wanted
    ? t("empty")
    : pending
      ? t("searching")
      : count === 0
        ? t.rich("noResults", {
            query: wanted,
            // What was typed keeps its own direction (W3C: wrap text
            // inserted at run time in a bdi).
            q: (chunks) => <bdi>{chunks}</bdi>,
          })
        : t("results", { count })

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("title")}
      description={t("description")}
      className="max-md:inset-s-0 max-md:top-0 max-md:h-dvh max-md:max-w-none! max-md:translate-x-0 max-md:rounded-none! md:max-w-[40rem]! max-md:rtl:translate-x-0"
    >
      <Command
        shouldFilter={false}
        className="max-md:flex-1 max-md:rounded-none!"
      >
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder={t("placeholder")}
          aria-label={t("title")}
          trailing={
            // Beside the field, 44 px, never over what's typed; on a phone
            // the palette fills the screen and this is the way out.
            <DialogClose
              render={
                <Button variant="ghost" size="icon" className="size-11" />
              }
            >
              <XIcon aria-hidden />
              <span className="sr-only">{t("close")}</span>
            </DialogClose>
          }
        />
        {/* An empty listbox breaks WAI-ARIA's "required owned elements"
            (axe: aria-required-children), so the list is hidden while it
            has nothing, and the status below says why. */}
        <CommandList
          hidden={count === 0}
          className="max-md:max-h-none max-md:flex-1"
        >
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
            ? "flex items-center justify-center gap-2 px-3 pt-2 pb-6 text-sm text-muted-foreground"
            : "sr-only"
        }
      >
        {pending ? <Spinner label={t("searching")} /> : null}
        {status}
      </p>
    </CommandDialog>
  )
}
