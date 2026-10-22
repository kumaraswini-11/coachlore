import "server-only"

import {
  abilities,
  forms,
  games,
  STAT_FILTER_KEYS,
  typeChart,
  type FormSummary,
  type StatFilterKey,
} from "@workspace/dex"

import type { DexData } from "@/lib/dex-types"

// The web app's one reader of @workspace/dex (plan 003, "Packages and
// files"). Pages read through these, each cached, so the build works each
// out once whichever pages use it; the browser gets only what's passed to
// it.

/** How many forms the static page shows before the full list loads. */
const PREVIEW_COUNT = 48

/**
 * What /dex shows before the browser loads: the first default forms, and
 * how many there are in all.
 */
export async function dexPreview(): Promise<{
  forms: FormSummary[]
  total: number
}> {
  "use cache"
  const defaults = forms.filter((form) => form.isDefault)
  return { forms: defaults.slice(0, PREVIEW_COUNT), total: defaults.length }
}

/** What the browser needs beside the forms, for every form. */
export async function dexBrowserData(): Promise<Omit<DexData, "forms">> {
  "use cache"
  return dexExtras(forms)
}

/** What the browser needs beside the forms, cut to the forms given. */
function dexExtras(list: FormSummary[]): Omit<DexData, "forms"> {
  const used = new Set(
    list.flatMap((form) => form.abilities.map((each) => each.key))
  )
  const inGames = new Set(list.flatMap((form) => form.games))
  return {
    chart: typeChart,
    games: games
      .filter((game) => inGames.has(game.key))
      .map((game) => ({ key: game.key, name: game.name })),
    abilities: abilities
      .filter((ability) => used.has(ability.key))
      .map((ability) => ({ key: ability.key, name: ability.name })),
    // Each stat's highest in the whole dataset, so the sliders' ends are
    // the same whatever the list.
    statMax: Object.fromEntries(
      STAT_FILTER_KEYS.map((key) => [
        key,
        Math.max(
          ...forms.map((form) =>
            key === "total" ? form.statTotal : form.stats[key]
          )
        ),
      ])
    ) as Record<StatFilterKey, number>,
  }
}
