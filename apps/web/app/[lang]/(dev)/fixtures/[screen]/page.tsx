import type * as React from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CloudOffIcon, LockIcon, SparklesIcon } from "lucide-react"
import { getTranslations } from "next-intl/server"

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

// Fixture screens (spec 001, "How a screen is built", step 2): every state
// with sample data, for the owner's review on a phone and for the
// end-to-end tests. Built into previews; production has none.
const SCREENS = ["states", "list"] as const
type Screen = (typeof SCREENS)[number]

// Sample data: names stay English in every language (spec 001,
// "Languages").
const PICKS = [
  { coach: "Ash", pokemon: "Garchomp" },
  { coach: "Misty", pokemon: "Rotom-Wash" },
  { coach: "Brock", pokemon: "Flabébé" },
]

export function generateStaticParams() {
  return SCREENS.map((screen) => ({ screen }))
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("states")
  return {
    title: t("title"),
    description: t("metaDescription"),
    robots: { index: false },
  }
}

export default async function FixturePage({
  params,
}: PageProps<"/[lang]/fixtures/[screen]">) {
  // Decided at build time: production builds these pages as 404s.
  if (process.env.VERCEL_ENV === "production") {
    notFound()
  }
  const { screen } = await params
  if (!(SCREENS as readonly string[]).includes(screen)) {
    notFound()
  }
  const t = await getTranslations("states")

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      {(screen as Screen) === "list" ? (
        <LongList title={t("listTitle")} row={(n) => t("row", { n })} />
      ) : (
        <States t={t} />
      )}
    </div>
  )
}

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

function States({ t }: { t: T }) {
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
              <TypeBadge type={type}>
                {type[0]?.toUpperCase() + type.slice(1)}
              </TypeBadge>
            </li>
          ))}
        </ul>
      </Section>
    </>
  )
}

/**
 * A long list under the sticky top bar, for criterion 9: a focused row is
 * never hidden under a sticky bar (WCAG 2.4.11).
 */
function LongList({
  title,
  row,
}: {
  title: string
  row: (n: number) => string
}) {
  return (
    <Section title={title}>
      <ItemGroup>
        {Array.from({ length: 40 }, (_, index) => (
          <Item
            key={index}
            variant="outline"
            render={<button type="button" />}
            className="min-h-11 text-start"
          >
            <ItemContent>
              <ItemTitle>{row(index + 1)}</ItemTitle>
            </ItemContent>
          </Item>
        ))}
      </ItemGroup>
    </Section>
  )
}
