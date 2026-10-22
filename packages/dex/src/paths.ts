import type { FormSummary } from "./types.ts"

/**
 * A form's page, without the language (spec 004, "Form addresses"): a
 * default form at its Pokémon's (`/dex/rotom`, and `/dex/urshifu` for
 * `urshifu-single-strike`), another at its key without its Pokémon's
 * (`/dex/rotom/wash`).
 */
export function formPath(
  form: Pick<FormSummary, "key" | "pokemon" | "isDefault">
): `/dex/${string}` {
  if (form.isDefault) {
    return `/dex/${form.pokemon}`
  }
  const slug = form.key.startsWith(`${form.pokemon}-`)
    ? form.key.slice(form.pokemon.length + 1)
    : form.key
  return `/dex/${form.pokemon}/${slug}`
}
