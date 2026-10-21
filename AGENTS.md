<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Coachlore

A mobile-first Pokédex and a home for Pokémon draft leagues; the owner's personal project, named in [ADR 0005](docs/adr/0005-product-name.md). What it is and how to run it: [README.md](README.md). Before building a feature, read the part of [docs/project-doc.md](docs/project-doc.md) it touches: the product decisions and the reasoning behind them. Then its spec in [docs/specs/](docs/specs/README.md). Use the words in [GLOSSARY.md](GLOSSARY.md), with the meaning given there, in specs, code and the interface.

## Commands

```sh
bun install
bun run dev
```

Before saying a change is done, run these from the root and show the owner the output:

```sh
bun run lint
bun run typecheck
bun run test
bun run build
bunx prettier --check .
```

## Git

Before any git command that writes (commit, branch, rebase, merge, push, config), any `gh` command, or writing pull request text, read [docs/git-workflow.md](docs/git-workflow.md) and follow it: one identity, no attribution lines, nothing committed on `main` or before the owner's audit.

## Stack

Record each piece here as it's decided, with a link to its ADR. Until then, the scaffold's choices are a starting point, not decisions. Decided so far:

- UI component layout: [ADR 0001](docs/adr/0001-ui-component-layout.md).
- Node.js 24 LTS, TypeScript 6.0, ESLint with typescript-eslint and `eslint-config-next` (any warning fails), shared versions in the workspace catalog, and a 14-day minimum release age: [ADR 0002](docs/adr/0002-toolchain-baseline.md).
- Rendering with Cache Components, the error and not-found pages, and the security headers: [ADR 0003](docs/adr/0003-rendering-and-production-defaults.md).
- Agent skills, where they live and how they're pinned: [ADR 0004](docs/adr/0004-agent-skills.md).
- Hosting for the web app on Vercel's free plan, no domain, the site's address from Vercel's own variables, and error reports in Sentry's free plan without personal data: [ADR 0006](docs/adr/0006-architecture-and-stack.md) ("Hosting", "Errors and logs") and [spec 000](docs/specs/000-platform/spec.md).
- Languages: English and Hindi, routes under `/[lang]`, dictionaries, and logical properties for right-to-left later: [ADR 0007](docs/adr/0007-languages-and-right-to-left.md).

Open work and pending decisions are in [docs/plans/](docs/plans/); read a plan before starting its work, and mark it done when it's finished.

## Rules

- **Pokémon belongs to others.** A non-commercial website: no ads, paid tiers or app-store app. The not-affiliated notice and credits stay (README's "Credits and disclaimer"). No scraping of game servers; as few official images as possible; no "Poké" or "Pokémon" in the product's name or logo.
- **The AI never decides a number.** Code and data do; the AI explains, or chooses among options the code computed. Every Pokémon, move or ability it names is checked against the data, and the app works with the AI off. The AI layer is provider-agnostic: models are reached through one interface, so the provider can change without touching features.
- **Packages are isolated:** each does one job and knows nothing it doesn't need. A package uses another only as a declared dependency, imported by its package name, never by a relative path into it. Code moves into a shared package when a second package needs it; each rule, type or helper is defined once and imported.
- **The core is framework-agnostic:** the league rules, the Pokémon data model and the battle-log parser import no framework, interface or storage code, so they can be reused and tested on their own.
- **Metadata:** every page has its own title and description, written as [apps/web/README.md](apps/web/README.md) ("Titles and descriptions") describes.
- **Rendering:** pages and layouts stay Server Components; `"use client"` goes on the interactive component that needs it, as low in the tree as possible. Modules with secrets or server-only code `import "server-only"`; only `NEXT_PUBLIC_` values reach the browser.
- **Interface:** shadcn registry first: add a component with the CLI, then edit its code directly where the design needs it, as [shadcn/ui](https://ui.shadcn.com/docs) intends. [Base UI](https://base-ui.com)'s docs for behaviour, shadcn's for look. Semantic tokens and HTML; a Pokémon type is always named, never shown by colour alone. Every string from the dictionaries (English and Hindi) and logical properties (`ms`/`me`, `start`/`end`), never `left`/`right`, so right-to-left languages work ([ADR 0007](docs/adr/0007-languages-and-right-to-left.md)). Designed at 360 px first, with 44 px touch targets. [WCAG 2.2](https://www.w3.org/TR/WCAG22/) AA, reduced motion respected, no layout shift, and [Core Web Vitals](https://web.dev/articles/vitals)' "good" thresholds on a mid-range phone.
- **Components:** shared UI components (`packages/ui`) present the data they're given and never fetch it. In the app, Server Components fetch the data they need where they use it, as [Next.js](https://nextjs.org/docs/app/getting-started/fetching-data) recommends. Within an app, a composition becomes a shared component on its third use, not before.
- **Work loop:** within agreed work, each task is checked, audited by the owner, committed, then the next begins; stop for the owner's audit and the owner's calls, and for nothing else.
- **Reviews and audits:** report every finding, grouped by severity, never a capped "top N"; after fixing, review the text the fixes added before committing, since fixes bring their own edge cases. A spec's fine-grained edge cases are settled by a test while it's built, not by more review rounds of the document.
- **Project memory:** anything a later session or another machine needs lives in this repository (this file, the docs, an ADR, a package README), never only in an agent's local memory.
- **Decisions:** decide on merit, never effort. Where official docs settle a choice, take it and say so; ask the owner only their own calls (money, accounts, domains, scope, time). Present each as a table (item, what the repository has now, checked rather than remembered; what the official docs say, quoted; recommendation) with sources. Record hard-to-reverse ones, and any departure from official guidance with its reason, as ADRs in `docs/adr/`, in the format of the existing ones (status, date, context, decision in that table form, alternatives, consequences, sources), whatever a skill's template or criteria say.
- **Documents:** name and link a practice where it's relied on; check every link before it's committed.
- **Versions:** LTS or supported stable lines, checked on each project's own release page; a new dependency takes its newest release at least two weeks old. A version shared by packages is defined once, in the workspace catalog ([Bun](https://bun.sh/docs/install/catalogs), [pnpm](https://pnpm.io/catalogs)), and referenced as `catalog:`.
- **Skills:** agent skills live in the project, never only on a machine: `.agents/skills/`, with Claude Code's copy in `.claude/skills/`, each pinned to a commit in `skills-lock.json`; add or update one only as [ADR 0004](docs/adr/0004-agent-skills.md) describes, and never edit one: where a skill contradicts this file, WCAG or the bundled docs, they win (known cases are listed in ADR 0004). Use the `better-*` skills for interface work, `core-web-vitals` before performance work, `security-and-hardening` for anything touching input, auth, secrets or dependencies, `turborepo` for `turbo.json`, `grilling` to test a plan, `domain-modeling` for the glossary, `codebase-design` for package and module boundaries, `diagnosing-bugs` for hard bugs, `research` for researched write-ups, and `writing-for-agents` when editing AGENTS.md or a skill. The owner runs `/interface-review` before a UI change is done.
- **Files:** settings live in tool-neutral config files, never editor-specific ones (`.vscode/`, `.idea/`; Claude Code's `.claude/skills/` is the one exception, recorded in ADR 0004); no machine paths or local account names in tracked files. No secrets: `.env` files are gitignored, `.env.example` documents each variable, and secret values are never printed. Move or remove the owner's existing files only when asked.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
