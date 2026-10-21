/// <reference types="node" />
import { existsSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import sharp from "sharp"
import { describe, expect, it } from "vitest"

import { forms } from "@workspace/dex"
import { readPokemon } from "@workspace/dex/files"

// Spec 002, criterion 8: the images scripts/import-images.ts prepares.
const PUBLIC = join(import.meta.dirname, "..", "public")
const IMAGES = join(PUBLIC, "dex-images")

describe("the Dex's images", () => {
  it("has a sprite for every form whose data names one", () => {
    const missing = forms
      .filter(
        (form) => form.sprite !== null && !existsSync(join(PUBLIC, form.sprite))
      )
      .map((form) => form.key)
    expect(missing).toEqual([])
  })

  it("has artwork for every form whose data names it", async () => {
    const missing: string[] = []
    for (const key of new Set(forms.map((form) => form.pokemon))) {
      for (const form of (await readPokemon(key))?.forms ?? []) {
        if (form.artwork !== null && !existsSync(join(PUBLIC, form.artwork))) {
          missing.push(form.key)
        }
      }
    }
    expect(missing).toEqual([])
  })

  it("prepares each image at its display size", async () => {
    for (const [file, size] of [
      ["sprites/rotom-wash.webp", 96],
      ["artwork/rotom-wash.webp", 256],
    ] as const) {
      const meta = await sharp(join(IMAGES, file)).metadata()
      expect([meta.format, meta.width, meta.height], file).toEqual([
        "webp",
        size,
        size,
      ])
    }
  })

  it("files a default form and another by their own PokéAPI ID", () => {
    const form = (key: string) => forms.find((each) => each.key === key)
    expect(form("rotom")?.sourceId).toBe(479)
    expect(form("rotom-wash")?.sourceId).toBe(10009)
  })

  it("stays within 25 MB", () => {
    let bytes = 0
    for (const folder of ["sprites", "artwork"]) {
      for (const name of readdirSync(join(IMAGES, folder))) {
        bytes += statSync(join(IMAGES, folder, name)).size
      }
    }
    expect(bytes).toBeLessThanOrEqual(25 * 1024 * 1024)
  })
})
