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

import type { DexData } from "@/components/dex/dex-browser"

/** What the browser needs beside the forms, cut to the forms given. */
export function dexData(list: FormSummary[]): DexData {
  const used = new Set(
    list.flatMap((form) => form.abilities.map((each) => each.key))
  )
  const inGames = new Set(list.flatMap((form) => form.games))
  return {
    forms: list,
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
