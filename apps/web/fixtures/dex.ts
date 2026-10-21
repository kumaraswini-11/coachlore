import "server-only"

import { forms } from "@workspace/dex"

import type { DexData } from "@/components/dex/dex-browser"
import { dexData } from "@/lib/dex-data"

// The Dex browse screen's sample data (spec 001, "How a screen is built",
// step 2): a fixed set of forms from the dataset, chosen for what they
// show. Read here, on the server; the browser gets only these.
const KEYS = [
  // Types, single and dual, and weaknesses to filter by.
  "bulbasaur",
  "charizard",
  "squirtle",
  "pikachu",
  "gengar",
  "magneton",
  "steelix",
  "forretress",
  "skarmory",
  "aggron",
  "garchomp",
  "magearna",
  "gholdengo",
  "great-tusk",
  "kingambit",
  // Forms: a Mega, a Gigantamax, regional, other.
  "charizard-mega-x",
  "charizard-gmax",
  "ninetales-alola",
  "tauros-paldea-aqua-breed",
  "rotom",
  "rotom-wash",
  // Long names, and a default form keyed unlike its Pokémon.
  "urshifu-single-strike",
  "urshifu-rapid-strike",
  "necrozma-dawn",
  "squawkabilly-yellow-plumage",
  // Extremes for the stat filters and sort.
  "shedinja",
  "blissey",
  "regieleki",
  // Forms with no image in the data.
  "koraidon-limited-build",
  "miraidon-low-power-mode",
]

export function dexFixture(): DexData {
  const sample = KEYS.map((key) => {
    const form = forms.find((each) => each.key === key)
    if (form === undefined) {
      throw new Error(`The Dex fixture names ${key}, which isn't a form.`)
    }
    return form
  }).sort(
    (a, b) => a.number - b.number || Number(b.isDefault) - Number(a.isDefault)
  )
  return dexData(sample)
}
