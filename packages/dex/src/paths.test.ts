import { describe, expect, it } from "vitest"

import { forms } from "./index.ts"
import { formPath } from "./paths.ts"

describe("formPath", () => {
  it("puts a default form at its Pokémon's page, another under it", () => {
    const path = (key: string) => {
      const form = forms.find((each) => each.key === key)
      return form === undefined ? undefined : formPath(form)
    }
    expect(path("rotom")).toBe("/dex/rotom")
    expect(path("rotom-wash")).toBe("/dex/rotom/wash")
    expect(path("urshifu-single-strike")).toBe("/dex/urshifu")
    expect(path("urshifu-rapid-strike")).toBe("/dex/urshifu/rapid-strike")
    expect(path("charizard-mega-x")).toBe("/dex/charizard/mega-x")
  })

  it("gives every form its own page", () => {
    const paths = forms.map(formPath)
    expect(new Set(paths).size).toBe(paths.length)
  })
})
