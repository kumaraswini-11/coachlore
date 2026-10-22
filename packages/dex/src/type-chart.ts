import type { TypeChart, TypeKey } from "./types.ts"

/**
 * How much damage a move of the attacking type does to a Pokémon of the
 * defending types: the product of the chart's entries, 0 to 4. The one
 * place matchups are worked out; spec 004's page and spec 005's team
 * check read it.
 */
export function multiplier(
  chart: TypeChart,
  attacking: TypeKey,
  defending: readonly TypeKey[]
): number {
  return defending.reduce(
    (product, type) => product * (chart[attacking][type] ?? 1),
    1
  )
}
