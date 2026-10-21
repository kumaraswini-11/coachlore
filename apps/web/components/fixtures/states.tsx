import type * as React from "react"
import { CloudOffIcon, LockIcon, SparklesIcon } from "lucide-react"
import type { getTranslations } from "next-intl/server"

import { EmptyState } from "@workspace/ui/components/empty-state"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/shadcn-ui/alert"
import { Button } from "@workspace/ui/components/shadcn-ui/button"
import {
  Item,
  ItemContent,
  ItemGroup,
  ItemTitle,
} from "@workspace/ui/components/shadcn-ui/item"
import { Skeleton } from "@workspace/ui/components/shadcn-ui/skeleton"
import { TypeBadge } from "@workspace/ui/components/type-badge"
import { POKEMON_TYPES } from "@workspace/ui/lib/type-colors"

import { LiveUpdate } from "@/components/fixtures/live-update"
import { Lang } from "@/components/lang"

// The states fixture's sections (spec 001, "States every view has"), each
// with sample data.

// Sample data: names stay English in every language (spec 001,
// "Languages").
const STANDINGS = [
  { coach: "Ash", record: "5–1" },
  { coach: "Misty", record: "4–2" },
  { coach: "Brock", record: "3–3" },
]

const PICKS = [
  { coach: "Ash", pokemon: "Garchomp" },
  { coach: "Misty", pokemon: "Rotom-Wash" },
  { coach: "Brock", pokemon: "Flabébé" },
]

type T = Awaited<ReturnType<typeof getTranslations<"states">>>

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">{title}</h2>
      {children}
    </section>
  )
}

/** Every state, one section each, for `/[lang]/fixtures/states`. */
export function States({ t }: { t: T }) {
  return (
    <>
      <Section title={t("sections.loading")}>
        {/* Skeletons the size and shape of what arrives, so nothing shifts. */}
        <div className="flex flex-col gap-2" aria-busy="true">
          <span className="sr-only">{t("loading")}</span>
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </Section>

      <Section title={t("sections.empty")}>
        <EmptyState
          title={t("emptyTitle")}
          titleAs="h3"
          description={t("emptyDescription")}
        >
          <Button className="h-11">{t("emptyAction")}</Button>
        </EmptyState>
      </Section>

      <Section title={t("sections.error")}>
        <EmptyState
          role="alert"
          title={t("errorTitle")}
          titleAs="h3"
          description={t("errorDescription")}
        >
          <Button className="h-11">{t("retry")}</Button>
        </EmptyState>
      </Section>

      <Section title={t("sections.notFound")}>
        <EmptyState
          title={t("notFoundTitle")}
          titleAs="h3"
          description={t("notFoundDescription")}
        />
      </Section>

      <Section title={t("sections.offline")}>
        <Alert>
          <CloudOffIcon aria-hidden />
          <AlertTitle>{t("offlineTitle")}</AlertTitle>
          <AlertDescription>{t("offlineDescription")}</AlertDescription>
        </Alert>
        {/* The last data saved, still shown (spec 001, "Offline"). */}
        <ItemGroup aria-label={t("lastSaved")}>
          {STANDINGS.map((row) => (
            <Item key={row.coach} role="listitem" variant="outline" size="sm">
              <ItemContent>
                <ItemTitle>
                  <bdi>{row.coach}</bdi>
                </ItemTitle>
              </ItemContent>
              <span className="tabular-nums">{row.record}</span>
            </Item>
          ))}
        </ItemGroup>
        <Button className="h-11 self-start" disabled>
          {t("emptyAction")}
        </Button>
      </Section>

      <Section title={t("sections.noPermission")}>
        <EmptyState
          media={<LockIcon aria-hidden />}
          title={t("noPermissionTitle")}
          titleAs="h3"
          description={t("noPermissionDescription")}
        />
      </Section>

      <Section title={t("sections.ai")}>
        <Alert>
          <SparklesIcon aria-hidden />
          <AlertTitle>{t("aiTitle")}</AlertTitle>
          <AlertDescription>{t("aiDescription")}</AlertDescription>
        </Alert>
      </Section>

      <Section title={t("sections.live")}>
        <LiveUpdate
          actionLabel={t("liveAction")}
          picks={PICKS.map((pick) =>
            t.rich("livePick", {
              ...pick,
              name: (chunks) => <bdi>{chunks}</bdi>,
              en: (chunks) => <Lang lang="en">{chunks}</Lang>,
            })
          )}
        />
      </Section>

      <Section title={t("sections.types")}>
        <ul className="flex flex-wrap gap-2">
          {POKEMON_TYPES.map((type) => (
            <li key={type}>
              {/* Type names are data, English in every language for now. */}
              <TypeBadge type={type} lang="en">
                {type[0]?.toUpperCase() + type.slice(1)}
              </TypeBadge>
            </li>
          ))}
        </ul>
      </Section>
    </>
  )
}
