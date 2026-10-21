import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { buttonVariants } from "@workspace/ui/components/shadcn-ui/button"
import { Separator } from "@workspace/ui/components/shadcn-ui/separator"
import { cn } from "@workspace/ui/lib/utils"

import { PageCrumbs } from "@/components/page-crumbs"
import { pageMetadata } from "@/i18n/metadata"

// Each source's name (a name, the same in every language) and where it
// lives; the licence text is in the messages.
const SOURCES = [
  { key: "pokeapi", name: "PokéAPI", url: "https://pokeapi.co" },
  {
    key: "showdown",
    name: "Pokémon Showdown",
    url: "https://github.com/smogon/pokemon-showdown",
  },
  { key: "pkmn", name: "@pkmn", url: "https://github.com/pkmn" },
  { key: "smogon", name: "Smogon", url: "https://www.smogon.com/stats/" },
  {
    key: "sprites",
    name: "PokeAPI/sprites",
    url: "https://github.com/PokeAPI/sprites",
  },
] as const

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal")
  return pageMetadata("/legal", {
    title: t("title"),
    description: t("metaDescription"),
  })
}

// The not-affiliated notice, the licences of the data and images, and the
// privacy notice, which spec 014 completes (spec 001, "About, Legal").
export default async function LegalPage() {
  const t = await getTranslations("legal")
  const sections = [
    { id: "notice", heading: t("noticeHeading") },
    { id: "licences", heading: t("licencesHeading") },
    { id: "privacy", heading: t("privacyHeading") },
  ]

  return (
    <div className="mx-auto flex max-w-5xl gap-10 p-4 md:p-6">
      <article className="flex max-w-prose min-w-0 flex-col gap-6">
        <PageCrumbs current={t("title")} />
        <h1 className="text-2xl font-semibold">{t("title")}</h1>

        <section id="notice" className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">{t("noticeHeading")}</h2>
          <p>{t("notice")}</p>
        </section>
        <Separator />

        <section id="licences" className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">{t("licencesHeading")}</h2>
          <ul className="flex flex-col gap-3">
            {SOURCES.map((source) => (
              <li key={source.key} className="flex flex-col">
                <a
                  href={source.url}
                  lang="en"
                  className={cn(
                    buttonVariants({ variant: "link" }),
                    "h-11 self-start px-0"
                  )}
                >
                  {source.name}
                </a>
                <span className="text-muted-foreground">
                  {t(`licences.${source.key}`)}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <Separator />

        <section id="privacy" className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">{t("privacyHeading")}</h2>
          <p>{t("privacy")}</p>
        </section>
      </article>

      {/* On this page, beside the text from 1024 px (spec 001's wireframe). */}
      <nav
        aria-label={t("onThisPage")}
        className="sticky top-[calc(var(--sticky-top)+1.5rem)] hidden h-fit flex-col gap-1 text-sm lg:flex"
      >
        <p className="font-medium">{t("onThisPage")}</p>
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground"
          >
            {section.heading}
          </a>
        ))}
      </nav>
    </div>
  )
}
