import { expect, it } from "vitest"

import { TYPE_KEYS } from "@workspace/dex/types"
import { POKEMON_TYPES } from "@workspace/ui/lib/type-colors"

// The theme's list of types and the data's stay in their own packages (ui
// knows nothing of the data; AGENTS.md, "Packages are isolated"). The app
// uses both, so it checks they agree.
it("the theme colours every type the data has, in the same order", () => {
  expect([...POKEMON_TYPES]).toEqual([...TYPE_KEYS])
})
