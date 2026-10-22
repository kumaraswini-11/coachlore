import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { buttonVariants } from "@workspace/ui/components/shadcn-ui/button"
import { Separator } from "@workspace/ui/components/shadcn-ui/separator"
import { cn } from "@workspace/ui/lib/utils"

import { Page, PageTitle, SectionTitle } from "@/components/page"
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
    <Page>
      <div className="mx-auto flex w-full max-w-5xl gap-10">
        <article className="flex max-w-prose min-w-0 flex-col gap-6">
          <PageCrumbs current={t("title")} />
          <PageTitle>{t("title")}</PageTitle>

          <section id="notice" className="flex flex-col gap-2">
            <SectionTitle>{t("noticeHeading")}</SectionTitle>
            <p>{t("notice")}</p>
          </section>
          <Separator />

          <section id="licences" className="flex flex-col gap-2">
            <SectionTitle>{t("licencesHeading")}</SectionTitle>
            <ul className="flex flex-col gap-3">
              {SOURCES.map((source) => (
                <li key={source.key} className="flex flex-col">
                  <a
                    href={source.url}
                    lang="en"
                    className={cn(
                      buttonVariants({ variant: "link", size: "touch" }),
                      "self-start px-0"
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
            <SectionTitle>{t("privacyHeading")}</SectionTitle>
            <p>{t("privacy")}</p>
          </section>
        </article>

        {/* On this page, beside the text from 1024 px (spec 001's wireframe). */}
        {/* Named by its visible heading; its links a list, as the footer's. */}
        <nav
          aria-labelledby="on-this-page"
          className="sticky top-[calc(var(--sticky-top)+1.5rem)] hidden h-fit flex-col gap-1 text-sm lg:flex"
        >
          <p id="on-this-page" className="font-medium">
            {t("onThisPage")}
          </p>
          <ul className="flex flex-col">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground"
                >
                  {section.heading}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </Page>
  )
}
