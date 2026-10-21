/**
 * Fails on a physical direction anywhere a style can live, so a right-to-left
 * language works without a redesign (ADR 0007, spec 001 criterion 12):
 *
 * - Tailwind classes in strings (`className`, `cn()`, `cva()`), single or
 *   multi-line: `ml-`, `pr-`, `left-`, `text-right`, `rounded-l`,
 *   `border-r`, `origin-left`, `bg-right`, `object-left`,
 *   `slide-in-from-left` and the rest. The `-x` forms and the logical ones
 *   (`ms-`, `pe-`, `inset-s-`, `text-end`) pass. A class behind a physical
 *   variant (`data-[side=left]:`, `data-[swipe-direction=right]:`) is that
 *   side's own style, and passes.
 * - Tailwind 4.3's old names `start-*` and `end-*` in our own code (the
 *   registry's copies are left as installed): use `inset-s-*`, `inset-e-*`.
 * - CSS files: `margin-left`, `padding-right`, `left:`, `text-align: right`.
 * - Inline styles: `marginLeft`, `paddingRight`, `left:`, `textAlign: "left"`.
 * - In the app, `side="left"` or `side="right"`: Base UI's menus and
 *   tooltips take `inline-start` and `inline-end`; a Sheet's or Sidebar's
 *   side is chosen from the page's direction, not written in.
 * - Arrow characters in components ("←", "→", "‹", "›"), and direction icons
 *   (`ChevronLeft`, `ArrowRight` …) without an `rtl:` class: back and next
 *   flip with the direction.
 *
 * Inline styles are checked only when written as `style={{ … }}`. Run by
 * the root `lint` (turbo.json, `//#lint:logical-css`).
 */
import { readdirSync, readFileSync } from "node:fs"
import { join, relative } from "node:path"

const ROOT = join(import.meta.dirname, "..")
const DIRECTORIES = ["apps/web", "packages/ui/src"]
const SKIP = new Set(["node_modules", ".next", ".turbo", "test-results"])
const REGISTRY = "packages/ui/src/components/shadcn-ui/"

function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (SKIP.has(entry.name)) {
      return []
    }
    const path = join(directory, entry.name)
    return entry.isDirectory() ? files(path) : [path]
  })
}

// A Tailwind class with its variants (`md:`, `hover:`) and `!` or `-` removed.
const PHYSICAL_CLASS =
  /^(?:(?:scroll-)?[mp][lr]-|left-|right-|(?:rounded|border)-(?:[lr]|[tb][lr])(?:-|$)|(?:text|float|clear)-(?:left|right)$|(?:origin|bg|object)-(?:left|right)|origin-(?:top|bottom)-(?:left|right)|slide-(?:in|out)-from-(?:left|right))/
const OLD_LOGICAL_NAME = /^(?:start|end)-/
const PHYSICAL_VARIANT = /(?:side|swipe-direction)=(?:left|right)\]/

const PHYSICAL_CSS =
  /(?:margin|padding|border|inset|scroll-margin|scroll-padding)-(?:left|right)\b|(?:^|[\s;{])(?:left|right)\s*:|text-align\s*:\s*(?:left|right)|float\s*:\s*(?:left|right)/
const PHYSICAL_STYLE =
  /\b(?:margin|padding|border|scrollMargin|scrollPadding)(?:Left|Right)\b|\b(?:left|right)\s*:|textAlign\s*:\s*["'](?:left|right)["']/
const ARROWS = /[←→‹›]/
// With or without Lucide's `Icon` suffix: `<ChevronLeft>`,
// `<ArrowLeftCircleIcon>`.
const DIRECTION_ICON =
  /<(?:Chevron|Chevrons|Arrow|ArrowBig|CircleArrow|Move)(?:Left|Right)\w*\b[^>]*>/g

// Comments may describe directions; only code is checked. Block comments
// keep their line breaks, so line numbers stay right.
function withoutComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
}

function lineOf(source: string, index: number) {
  return source.slice(0, index).split("\n").length
}

const problems: string[] = []

for (const directory of DIRECTORIES) {
  for (const file of files(join(ROOT, directory))) {
    const name = relative(ROOT, file).replaceAll("\\", "/")
    if (file.endsWith(".css")) {
      // Comments come out of the whole file first, so a line inside a
      // multi-line comment isn't checked.
      withoutComments(readFileSync(file, "utf8"))
        .split("\n")
        .forEach((line, index) => {
          if (PHYSICAL_CSS.test(line)) {
            problems.push(`${name}:${index + 1}: ${line.trim()}`)
          }
        })
      continue
    }
    if (!/\.(ts|tsx)$/.test(file) || /\.test\.tsx?$/.test(file)) {
      continue
    }

    const code = withoutComments(readFileSync(file, "utf8"))
    const ours = !name.startsWith(REGISTRY)

    for (const literal of code.matchAll(/"[^"\n]*"|'[^'\n]*'|`[^`]*`/g)) {
      const at = `${name}:${lineOf(code, literal.index)}`
      for (const token of literal[0].slice(1, -1).split(/\s+/)) {
        if (PHYSICAL_VARIANT.test(token)) {
          continue
        }
        const utility = token
          .slice(token.lastIndexOf(":") + 1)
          .replace(/^[!-]+/, "")
        if (PHYSICAL_CLASS.test(utility)) {
          problems.push(`${at}: class "${token}"`)
        } else if (ours && OLD_LOGICAL_NAME.test(utility)) {
          problems.push(
            `${at}: class "${token}"; Tailwind 4.3 names it inset-s-/inset-e-`
          )
        }
      }
    }

    code.split("\n").forEach((line, index) => {
      const at = `${name}:${index + 1}`
      if (
        name.startsWith("apps/") &&
        /\bside=["'](?:left|right)["']/.test(line)
      ) {
        problems.push(
          `${at}: a physical side; use "inline-start" or "inline-end", or choose it from the page's direction`
        )
      }
      if (file.endsWith(".tsx") && ARROWS.test(line)) {
        problems.push(`${at}: an arrow character; use an icon that flips`)
      }
    })

    for (const icon of code.matchAll(DIRECTION_ICON)) {
      if (!/\brtl:/.test(icon[0])) {
        problems.push(
          `${name}:${lineOf(code, icon.index)}: ${icon[0].split(/\s/)[0]} needs an rtl: class that flips it (rtl:rotate-180)`
        )
      }
    }

    for (const style of code.matchAll(/style=\{\{[\s\S]*?\}\}/g)) {
      if (PHYSICAL_STYLE.test(style[0])) {
        problems.push(
          `${name}:${lineOf(code, style.index)}: inline style ${style[0].replace(/\s+/g, " ")}`
        )
      }
    }
  }
}

if (problems.length > 0) {
  console.error(
    `Physical directions found; use logical ones (ms/me, ps/pe, inset-s/inset-e, text-start):\n${problems.join("\n")}`
  )
  process.exit(1)
}
console.log("No physical directions.")
