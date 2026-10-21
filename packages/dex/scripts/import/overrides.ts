/**
 * Step 11: hand fixes to the imported data, each with its reason and a link
 * to where the right value is shown. `path` is the file, the item's key and
 * the field: `forms/rotom-wash/stats/hp`. A path that doesn't reach an
 * existing field fails the import, so a fix can't outlive what it fixed.
 */
export type Override = {
  path: string
  value: unknown
  reason: string
  link: string
}

export type Collections = Record<string, { key: string }[]>

export function applyOverrides(
  collections: Collections,
  overrides: readonly Override[]
): void {
  for (const override of overrides) {
    if (
      override.reason.trim() === "" ||
      !override.link.startsWith("https://")
    ) {
      throw new Error(
        `The override ${override.path} needs a reason and a link.`
      )
    }
    const [file, key, ...fields] = override.path.split("/")
    const item = collections[file ?? ""]?.find((each) => each.key === key)
    const last = fields.pop()
    let target: unknown = item
    for (const field of fields) {
      target = isRecord(target) ? target[field] : undefined
    }
    if (last === undefined || !isRecord(target) || !(last in target)) {
      throw new Error(`The override ${override.path} matches no field.`)
    }
    target[last] = override.value
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object"
}
