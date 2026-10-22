/// <reference types="node" />
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"

/**
 * JSON with object keys sorted at every level, so the same data always
 * gives the same bytes (spec 002, criterion 4), laid out so a refresh is a
 * readable diff: one line per object field or list item, and a list of
 * plain values (a type pair, a learnset entry) kept on its own line. Arrays
 * keep their order: the import sorts its lists itself, by number then key.
 */
export function stableJson(value: unknown): string {
  return `${format(value, "")}\n`
}

export function writeJson(file: string, value: unknown): void {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, stableJson(value))
}

function format(value: unknown, indent: string): string {
  if (Array.isArray(value)) {
    if (value.every(isPlain)) {
      // Prettier's spacing, so a hand-kept file it checks stays as written.
      return `[${value.map((item) => JSON.stringify(item)).join(", ")}]`
    }
    const inner = `${indent}  `
    const items = value.map((item) => `${inner}${format(item, inner)}`)
    return `[\n${items.join(",\n")}\n${indent}]`
  }
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value)
      .filter(([, field]) => field !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    if (entries.length === 0) {
      return "{}"
    }
    const inner = `${indent}  `
    const fields = entries.map(
      ([key, field]) =>
        `${inner}${JSON.stringify(key)}: ${format(field, inner)}`
    )
    return `{\n${fields.join(",\n")}\n${indent}}`
  }
  return JSON.stringify(value)
}

/** A string, number, boolean or null: a list of these fits on one line. */
function isPlain(value: unknown): boolean {
  return value === null || typeof value !== "object"
}
