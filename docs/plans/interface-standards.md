# Plan: engineering and interface standards

- Status: not started
- Written: 2026-10-20, from the owner's draft, reviewed against the sources
  linked below

Bring Draftboard's engineering and interface rules to the standard of the
owner's other projects, and write the UI conventions down once. AGENTS.md
gets one-line rules; the detail goes in the README of the package it belongs
to, never both.

Already done, so not part of this plan: registry components live in
`packages/ui/src/components/shadcn-ui/` and the CLI points there
([ADR 0001](../adr/0001-ui-component-layout.md)).

## 1. Decide first: edit registry files, or leave them as installed?

The owner's call; present it as a decision table (AGENTS.md, "Decisions")
before changing any rule.

| Item                  | Now                                                                        | shadcn's docs                                                                                                             |
| --------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Registry files        | AGENTS.md, "Interface": "edit its code directly where the design needs it" | "you simply edit the button code directly"; "Modify any part of a component" ([Introduction](https://ui.shadcn.com/docs)) |
| Taking upstream fixes | none yet                                                                   | the CLI shows what changed: `shadcn add <component> --diff` (the old `diff` command is deprecated)                        |

The owner's lean: leave `shadcn-ui/` as installed; customise through the
theme's tokens (`globals.css`), `className` at the call site, or a
composition beside it. Weigh before deciding:

- `className` reaches a component's root element only; changing an inner
  part takes the theme or a composition.
- Leaving files as installed departs from shadcn's documented model, so it's
  recorded as an ADR, with the reason (updates stay a re-install, and every
  screen stays consistent).

## 2. One-line rules for AGENTS.md, each named and linked

- **Principles.** One source for each piece of knowledge (a rule, a type, a
  helper): [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) is
  about knowledge, "a single, unambiguous, authoritative representation".
  One responsibility per module and package, and dependencies pointing at
  abstractions, from [SOLID](https://en.wikipedia.org/wiki/SOLID) (name these
  two; the class-based rest fits React poorly). Code that only looks alike
  waits for the rule of three:
  [AHA](https://kentcdodds.com/blog/aha-programming), because duplication is
  cheaper than
  [the wrong abstraction](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction).
- **shadcn for every element.** Before writing markup, match each element to
  the registry: buttons → Button, lists and rows → Item, counts → Badge,
  containers → Card, empty states → Empty, loading → Skeleton, messages →
  Alert. A raw `<button>`, a bordered `<div>` or a styled `<span>` where a
  registry component fits is a defect. Check first with
  `bunx --bun shadcn@latest search` and `docs`; install what's missing with
  the CLI. These components are built on Base UI, which has no `asChild`: a
  link styled as a button uses Button's `render` prop; check
  `shadcn docs button` for the current form.
- **Where UI code goes:** the folders in ADR 0001. Compositions are thin: a
  few props, children or slots for the rest, compound components and explicit
  variants rather than boolean props. Never wrap a component only to rename
  it.
- **Every view has all its states:** loading (a skeleton the size of the
  content), empty (why, and the next action), error (what failed, and "Try
  again", announced with `role="alert"`), not found, no permission, offline
  where the project doc promises it (the Dex), and AI unavailable where AI is
  used. Until a state's shared composition exists (third use), use Empty,
  Skeleton and Alert directly. A view isn't done until its states are.

## 3. The detail, written once

- `packages/ui/README.md`: the element-to-component table, how to add a
  component (exists), and each shared composition as it's added, with a line
  on what it's for. The first, `EmptyState` (built on shadcn's Empty, made on
  its third use: the 404, error and global-error pages), is listed there.
- `apps/web/README.md`: `components/<feature>/` and what goes there.
- AGENTS.md links to these instead of repeating them.

## 4. Agent skills for interface work (done: see ADR 0004)

Researched across the whole project and installed on 2026-10-21; the
findings, what was installed and what's still open are in
[ADR 0004](../adr/0004-agent-skills.md). That research added
`better-interface`, `better-colors` and `better-writing` (which
`interface-review` needs), made `emil-design-eng` and `performance`
optional, and found that only the owner can start `interface-review`. The
starting list:

| Source                          | Skills                                                                                        |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| `shadcn-ui/ui`                  | `shadcn`                                                                                      |
| `vercel-labs/agent-skills`      | `vercel-composition-patterns` (folder `composition-patterns`)                                 |
| `jakubkrehel/skills`            | `better-accessibility`, `better-layout`, `better-typography`, `better-ui`, `interface-review` |
| `emilkowalski/skills`           | `emil-design-eng`                                                                             |
| `addyosmani/web-quality-skills` | `core-web-vitals`, `performance`                                                              |

All eleven were checked to exist on 2026-10-20 (`shadcn/ui` redirects to
`shadcn-ui/ui`). Before installing:

- Decide where they go. `.claude/skills/` with `-a claude-code` is one
  agent's configuration, against the tool-neutral rule in AGENTS.md
  ("Files"): accept it as a recorded exception, or install for each agent
  used.
- Pin the installer: `skills@latest` was 1.7.4, published the day before;
  by the two-week rule, use `skills@1.7.0` (17 September 2026) or the newest
  release at least two weeks old on the day.
- Read each `SKILL.md` and anything in `scripts/`; flag any `allowed-tools`.
- The skills come from each repository's default branch: note the commit
  each one came from in the commit message.
- Add the skills folder to `.prettierignore`, and one line to AGENTS.md:
  which skills to use for interface work, and that `interface-review` runs
  before a UI change is done.

Install command, once approved (`<source>` and `<names>` from the table).
Its flags come from the owner's draft and haven't been run here; check them
against the pinned version's `--help` first:

```sh
bunx skills@1.7.0 add <source> --skill <names> -a claude-code --copy -y
```

## 5. Finish

Run the checks in AGENTS.md, show the owner the diff and the output, and
wait for the audit. Commits, named paths only:

- `docs: engineering and interface standards`
- `chore: agent skills for interface work` (if section 4 is approved)
