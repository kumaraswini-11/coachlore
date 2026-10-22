import type { CSSProperties } from "react"

/**
 * The 18 Pokémon types in the games' order. The colours themselves live
 * once, in globals.css (`--type-<name>`); this maps each type to its
 * classes, written out in full so Tailwind finds them.
 */
export const POKEMON_TYPES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
] as const

export type PokemonType = (typeof POKEMON_TYPES)[number]

/** A type's fill and its text colour. */
export const TYPE_CLASS_NAMES: Record<PokemonType, string> = {
  normal: "bg-type-normal text-type-normal-foreground",
  fire: "bg-type-fire text-type-fire-foreground",
  water: "bg-type-water text-type-water-foreground",
  electric: "bg-type-electric text-type-electric-foreground",
  grass: "bg-type-grass text-type-grass-foreground",
  ice: "bg-type-ice text-type-ice-foreground",
  fighting: "bg-type-fighting text-type-fighting-foreground",
  poison: "bg-type-poison text-type-poison-foreground",
  ground: "bg-type-ground text-type-ground-foreground",
  flying: "bg-type-flying text-type-flying-foreground",
  psychic: "bg-type-psychic text-type-psychic-foreground",
  bug: "bg-type-bug text-type-bug-foreground",
  rock: "bg-type-rock text-type-rock-foreground",
  ghost: "bg-type-ghost text-type-ghost-foreground",
  dragon: "bg-type-dragon text-type-dragon-foreground",
  dark: "bg-type-dark text-type-dark-foreground",
  steel: "bg-type-steel text-type-steel-foreground",
  fairy: "bg-type-fairy text-type-fairy-foreground",
}

/**
 * A type's fill and text colours as two CSS variables, `--type-color` and
 * `--type-color-foreground`, for what draws them itself: a card's tint, or
 * a control whose own hover and pressed styles would repaint a class.
 */
export function typeColorVars(type: PokemonType): CSSProperties {
  return {
    "--type-color": `var(--type-${type})`,
    "--type-color-foreground": `var(--type-${type}-foreground)`,
  } as CSSProperties
}
