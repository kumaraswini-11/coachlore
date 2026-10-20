# 4. Agent skills

- Status: Accepted in part. The owner chose the recommended skills and the
  Matt Pocock skills the project needs, all installed in the project;
  `shadcn` and `next-dev-loop` wait on the owner's calls below, and the
  "later" skills on their decisions. See [Installed](#installed).
- Date: 2026-10-21

## Context

Agent skills are folders of instructions (a `SKILL.md`, sometimes with
reference files or scripts) that a coding agent loads when a task matches
them. [skills.sh](https://skills.sh/) is the directory for them, and the
[`skills` CLI](https://github.com/vercel-labs/skills) installs them
(`npx skills add <owner>/<repo>`).

The [interface standards plan](../plans/interface-standards.md) (section 4)
already listed eleven interface skills for the owner's approval. The owner
asked for the research to cover every skill the project needs, not only
interface ones, before choosing.

Three rules in [AGENTS.md](../../AGENTS.md) shape the choice:

- **Official docs are the authority**, and the Next.js block at the top of
  AGENTS.md sends agents to the docs bundled with the installed Next.js.
- **Files:** settings live in tool-neutral files, never editor-specific ones.
- **Versions:** a new dependency takes its newest release at least two weeks
  old.

## How the research was done

1. **Search.** 56 queries, one per part of the stack (Next.js, React, shadcn,
   Tailwind, Base UI, Turborepo, Bun, TypeScript, Vitest, Playwright), the
   planned stack (databases, real-time, a Discord bot, the AI layer) and
   working practice (accessibility, performance, SEO, security, code review,
   commits, documentation), against the search endpoint the `skills` CLI uses
   (`https://skills.sh/api/search?q=…`). They returned about 160 distinct
   skills. The skills published by each tool's own maker were listed
   separately with the same endpoint's `owner` filter.
2. **Read, not ranked.** About 35 candidates were read in full at the commits
   linked below, in three groups (Next.js and React; tooling and testing;
   interface, quality and security). For each: what it instructs; its
   `allowed-tools`; any scripts, installs or network calls; its licence; when
   its folder last changed; the three security scanners shown on its
   skills.sh page (Gen Agent Trust Hub, Socket and Snyk); and anything that
   contradicts this stack (Next.js 16.4 with Cache Components, React 19.3,
   TypeScript 6, Tailwind CSS 4, shadcn on Base UI, Bun, Turborepo, ESLint 10)
   or AGENTS.md.
3. **Safely.** Repositories were cloned read-only into a scratch folder,
   nothing in them was run, and nothing was installed in the project.

Install counts below are skills.sh's all-time figures on 2026-10-20. "W011"
is Snyk's generic finding for a skill that brings web content into the
agent's context (a risk of hidden instructions), which Snyk rates low.

## Findings

### 1. Next.js wants framework knowledge from its bundled docs, not skills

The Next.js 16.4 docs installed in this repository
(`node_modules/next/dist/docs/01-app/02-guides/ai-agents.md`, online as
[AI agents](https://nextjs.org/docs/app/guides/ai-agents)) say:

> Framework knowledge comes from the bundled docs, not from Skills.

They cite [Vercel's agent evaluations](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals):
"a 100% pass rate with bundled documentation, compared with up to 79% for
Skill-based approaches" ([current results](https://nextjs.org/evals)).
Skills are for "tasks that are workflows rather than lookups". So the useful
skills here are workflows and reviews, not summaries of a framework's docs.

### 2. The popular Next.js knowledge skills are retired

`next-best-practices`, `next-cache-components` and `next-upgrade` came from
[`vercel-labs/next-skills`](https://github.com/vercel-labs/next-skills/tree/c522619e45aa3492fd2bfc916b308b275eff7798),
which now holds only a "have moved" README:

- `next-best-practices` "is no longer a skill": its content ships as the
  bundled docs and the AGENTS.md that `next dev` writes.
- `next-upgrade` "is no longer a skill": use `npx @next/codemod@latest
upgrade`.
- `next-cache-components` was split into two skills in the Next.js
  repository itself.

The copies still listed on skills.sh (for example in
[`vercel-labs/openreview`](https://github.com/vercel-labs/openreview/tree/672deb21e70e471e0536d5ad7a67c14b8359e97e/.agents/skills))
are frozen snapshots from 2026-03-06, and one already has a mistake against
16.4 (it names the proxy export `proxyConfig`; the installed docs use
`export const config`).

### 3. The official Next.js skills are workflows

[`vercel/next.js/skills`](https://github.com/vercel/next.js/tree/164c41c231e1848a3c0d92470b337f208db62deb/skills)
holds six, all MIT, none with `allowed-tools` or executable scripts. Two of
them only adopt features this repository already has
([ADR 0003](0003-rendering-and-production-defaults.md)).

### 4. `interface-review` doesn't work alone

The plan listed `interface-review`, but it hands every review to
`better-interface`, which loads `better-colors` and `better-writing` and
marks their areas "Not reviewed" when they're missing. It has
`disable-model-invocation: true`, so only a person can start it
(`/interface-review`), and it runs `gh pr view`, `gh pr status`,
`gh repo view`, `git fetch` and `git remote set-head origin --auto`, which
[the git workflow](../git-workflow.md) governs.

### 5. How the `skills` CLI installs

From the CLI's [command reference](https://github.com/vercel-labs/skills/blob/a80e4c9d12d607631249d4d7d059f835d4b2f13a/docs/commands.md)
and [agent list](https://github.com/vercel-labs/skills/blob/a80e4c9d12d607631249d4d7d059f835d4b2f13a/docs/agents.md):

- **Project scope by default:** skills are "committed with your project,
  shared with team"; `-g` installs for the user instead.
- **Folders:** `.agents/skills/` is the shared folder that Codex, Cursor,
  GitHub Copilot, Gemini CLI, OpenCode and others read. Claude Code reads
  only `.claude/skills/`
  ([Claude Code skills](https://code.claude.com/docs/en/skills)).
- **Symlink or copy:** by default each agent's folder links to one canonical
  copy; `--copy` makes independent copies. Git on Windows checks symlinks out
  as plain files unless `core.symlinks` is on, so copies are the safe choice
  for this repository.
- **Lock file:** `skills-lock.json` records each skill's source;
  `skills check` and `skills update` look for and apply updates.
- **Telemetry:** the CLI sends anonymous usage data unless
  `DISABLE_TELEMETRY=1` or `DO_NOT_TRACK=1` is set.
- **Version:** the newest release at least two weeks old on 2026-10-21 is
  [`skills` 1.7.0](https://github.com/vercel-labs/skills/releases/tag/v1.7.0) (17 September 2026);
  1.7.4 was two days old.

Claude Code's own [skills documentation](https://code.claude.com/docs/en/skills)
confirms the method:

- Project skills are `.claude/skills/<skill-name>/SKILL.md`: "Commit
  `.claude/skills/` to version control." It lists no shared folder such as
  `.agents/skills/`, so Claude Code needs its own copy.
- "A skill can grant itself broad tool access, so review the `allowed-tools`
  of skills checked into a repository", and a skill can run shell commands as
  it loads (`` !`command` ``), which "never prompt for permission". None of
  the installed skills does either.

### 6. Pin a commit at least two weeks old, not the latest

A skill's source is a repository's default branch, which can change daily.
The first install pinned the latest commits; some were only days old, though
the skills' own files hadn't changed for longer. They were re-pinned to each
repository's newest commit at least two weeks old (on or before 2026-10-07),
as AGENTS.md ("Versions") requires. For every skill but one the files are the
same at both commits. The exception, `security-and-hardening`, differs by one
line in an example: a validation fix (`z.string().max(200).trim().min(1)`,
so a title of only spaces fails) merged upstream after 2026-10-07. It arrives
with the next update.

## Evaluation

Each skill links to the commit that was read; "page" is its skills.sh page,
with the scanners' results.

### Recommended now

| Skill                                                                                                                                                                                                                         | Installs | Last change | Scanners                      | What it does, and caveats                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`turborepo`](https://github.com/vercel/turborepo/tree/af866e5114c328a25ead2690464607214245b3f8/skills/turborepo) ([page](https://skills.sh/vercel/turborepo/turborepo))                                                      | 83K      | 2026-09-25  | Pass, Pass, Pass              | Official, 1.2 KB. Sends the agent to the docs bundled with the installed `turbo` (`node_modules/turbo/docs/`), so it can't go stale. MIT.                                                                                                                                                                                    |
| [`shadcn`](https://github.com/shadcn-ui/ui/tree/ba1503c64472b82256d9de95e2e62c5901a38e8b/skills/shadcn) ([page](https://skills.sh/shadcn-ui/ui/shadcn))                                                                       | 387K     | 2026-10-14  | Pass, Socket Warn (low), Pass | Official. Drives the CLI and picks Base UI's `render` or Radix's `asChild` from the project's config; Tailwind 4 aware. **Caveat:** it runs `npx shadcn@latest info --json` as soon as it loads (unpinned, npx rather than Bun, from the repository root, where there is no `components.json`), and pre-approves `add`. MIT. |
| [`next-dev-loop`](https://github.com/vercel/next.js/tree/164c41c231e1848a3c0d92470b337f208db62deb/skills/next-dev-loop) ([page](https://skills.sh/vercel/next.js/next-dev-loop))                                              | 21K      | 2026-09-28  | Pass, Pass, Pass              | Official; named in the bundled docs. After each edit, checks the running app through Next.js's MCP endpoint (`/_next/mcp`) and a browser. **Caveat:** needs `agent-browser` installed globally (a native binary plus Chrome for Testing), and its commands use pnpm. MIT.                                                    |
| [`better-accessibility`](https://github.com/jakubkrehel/skills/tree/4c66b1fa86e9ab70187b43d7da9b6fdb29f2ef63/skills/better-accessibility) ([page](https://skills.sh/jakubkrehel/skills/better-accessibility))                 | 28K      | 2026-10-06  | Pass, Pass, Pass              | Reviews and fixes against WCAG 2.2 by criterion number: native elements, focus, APG keyboard patterns, forms, live regions, colour alone, reduced motion, reflow. Treats 44 px targets as advice; AGENTS.md makes them a rule. MIT.                                                                                          |
| [`better-layout`](https://github.com/jakubkrehel/skills/tree/4c66b1fa86e9ab70187b43d7da9b6fdb29f2ef63/skills/better-layout) ([page](https://skills.sh/jakubkrehel/skills/better-layout))                                      | 29K      | 2026-10-05  | Pass, Pass, Pass              | Grouping, alignment, reading order, responsive structure; small screens first. MIT.                                                                                                                                                                                                                                          |
| [`better-typography`](https://github.com/jakubkrehel/skills/tree/4c66b1fa86e9ab70187b43d7da9b6fdb29f2ef63/skills/better-typography) ([page](https://skills.sh/jakubkrehel/skills/better-typography))                          | 32K      | 2026-10-06  | Pass, Pass, Pass              | Type scale, line height, measure, `tabular-nums`, wrapping; never proposes a new typeface unless asked. MIT.                                                                                                                                                                                                                 |
| [`better-ui`](https://github.com/jakubkrehel/skills/tree/4c66b1fa86e9ab70187b43d7da9b6fdb29f2ef63/skills/better-ui) ([page](https://skills.sh/jakubkrehel/skills/better-ui))                                                  | –        | 2026-10-05  | Pass, Pass, Pass              | Exact values for radius, shadow, icons and motion; every motion recipe gated on `prefers-reduced-motion`; Tailwind 4 aware; keeps the project's conventions. MIT.                                                                                                                                                            |
| [`interface-review`](https://github.com/jakubkrehel/skills/tree/4c66b1fa86e9ab70187b43d7da9b6fdb29f2ef63/skills/interface-review) ([page](https://skills.sh/jakubkrehel/skills/interface-review))                             | –        | 2026-10-05  | Pass, Pass, Snyk W011         | Reviews a change (branch, pull request or working tree) and sorts findings into introduced, regression or pre-existing. Started by a person only; runs `gh` and `git` commands (finding 4). Needs the three below. MIT.                                                                                                      |
| [`better-interface`](https://github.com/jakubkrehel/skills/tree/4c66b1fa86e9ab70187b43d7da9b6fdb29f2ef63/skills/better-interface) ([page](https://skills.sh/jakubkrehel/skills/better-interface))                             | –        | –           | not retrieved                 | Combines the `better-*` skills into one review. 134 lines; no scripts, commands or URLs. MIT.                                                                                                                                                                                                                                |
| [`better-colors`](https://github.com/jakubkrehel/skills/tree/4c66b1fa86e9ab70187b43d7da9b6fdb29f2ef63/skills/better-colors) ([page](https://skills.sh/jakubkrehel/skills/better-colors))                                      | –        | –           | not retrieved                 | Builds and checks a colour system: semantic tokens, formats, contrast. Needed for the Pokémon type colours. No scripts, commands or URLs. MIT.                                                                                                                                                                               |
| [`better-writing`](https://github.com/jakubkrehel/skills/tree/4c66b1fa86e9ab70187b43d7da9b6fdb29f2ef63/skills/better-writing) ([page](https://skills.sh/jakubkrehel/skills/better-writing))                                   | –        | –           | not retrieved                 | Interface copy: labels, errors, empty states, plurals through `Intl`. No scripts, commands or URLs. MIT.                                                                                                                                                                                                                     |
| [`core-web-vitals`](https://github.com/addyosmani/web-quality-skills/tree/afa8da942115f2961fdbfa80807ea0b232ff6c00/skills/core-web-vitals) ([page](https://skills.sh/addyosmani/web-quality-skills/core-web-vitals))          | 31K      | 2026-08-24  | Pass, Pass, Pass              | Measures first (field data at p75, then a trace), then fixes LCP, INP and CLS. **Caveat:** two Next.js snippets are outdated: `<Image priority>` (16.4 deprecates it for `preload`) and `dynamic(…, { ssr: false })` in a Server Component. MIT.                                                                             |
| [`security-and-hardening`](https://github.com/addyosmani/agent-skills/tree/aeac41d4d005999432bb7312f7ff06383a91d59d/skills/security-and-hardening) ([page](https://skills.sh/addyosmani/agent-skills/security-and-hardening)) | 65K      | 2026-10-03  | Pass, Pass, Pass              | Threat model first; injection and XSS, auth and sessions, headers, CSP and CORS, SSRF, secrets, the supply chain (lock files, provenance, release age) and the OWASP Top 10 for LLM applications, for the planned AI layer. Nothing Next.js-specific. MIT.                                                                   |

### Later, once the related decision is made

| Skill                                                                                                                                                                                                                                  | Installs | Last change | Scanners                      | When, and why                                                                                                                                                                                                                  |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`vitest`](https://github.com/antfu/skills/tree/feb0f3aba6566426f12230e7fc7a10d97c1293bb/skills/vitest) ([page](https://skills.sh/antfu/skills/vitest))                                                                                | 42K      | 2026-09-28  | Pass, Pass, Pass              | When Vitest is chosen. Generated from Vitest's own docs (Vitest 5) by Anthony Fu, a member of Vitest's core team; no official alternative exists. MIT.                                                                         |
| [`playwright-cli`](https://github.com/microsoft/playwright-cli/tree/b1a5903c5b633b8c9f843ad7b629c2a78437040c/skills/playwright-cli) ([page](https://skills.sh/microsoft/playwright-cli/playwright-cli))                                | 191K     | 2026-09-28  | Pass, Socket Warn (low), W011 | When Playwright is chosen. Official, from Playwright's maintainers; drives a browser through accessibility-tree snapshots. Runs from a pinned local Playwright rather than its suggested global `@latest` install. Apache-2.0. |
| [`next-cache-components-optimizer`](https://github.com/vercel/next.js/tree/164c41c231e1848a3c0d92470b337f208db62deb/skills/next-cache-components-optimizer) ([page](https://skills.sh/vercel/next.js/next-cache-components-optimizer)) | 18K      | 2026-10-06  | Pass, Pass, Pass              | Once real routes exist. Grows each route's static shell, test first (`@next/playwright`'s `instant()`); adds `@next/playwright` and `@playwright/test`. MIT.                                                                   |
| [`next-bundle-optimizer`](https://github.com/vercel/next.js/tree/164c41c231e1848a3c0d92470b337f208db62deb/skills/next-bundle-optimizer) ([page](https://skills.sh/vercel/next.js/next-bundle-optimizer))                               | 1.2K     | 2026-10-07  | Pass, Pass, Pass              | Before launch. Audits the initial-load bundle with `next analyze`; changes only on request. MIT.                                                                                                                               |

### Optional

| Skill                                                                                                                                                                                                                                           | Use it for                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`vercel-composition-patterns`](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/composition-patterns) ([page](https://skills.sh/vercel-labs/agent-skills/vercel-composition-patterns))         | Component APIs in `packages/ui`: compound components and explicit variants over boolean props; React 19. Its "children over render props" means callback props, not Base UI's `render`. 406K installs; MIT. |
| [`web-design-guidelines`](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/web-design-guidelines) ([page](https://skills.sh/vercel-labs/agent-skills/web-design-guidelines))                    | Vercel's interface rules. It downloads them from GitHub on every run, unpinned (Socket Warn), so only as a pinned local copy. Overlaps the `better-*` skills almost entirely. 760K installs; MIT.           |
| [`performance`](https://github.com/addyosmani/web-quality-skills/tree/afa8da942115f2961fdbfa80807ea0b232ff6c00/skills/performance) ([page](https://skills.sh/addyosmani/web-quality-skills/performance))                                        | The offline Dex: its service-worker section. Otherwise about 60% the same as `core-web-vitals`, and not Next.js-aware. MIT.                                                                                 |
| [`emil-design-eng`](https://github.com/emilkowalski/skills/tree/2d228630ba1446365f614a108cb8252f1feda202/skills/emil-design-eng) ([page](https://skills.sh/emilkowalski/skills/emil-design-eng))                                                | Motion-heavy work. Mostly duplicates `better-ui`, with different numbers (a 0.97 press scale against 0.96), and its samples use `framer-motion`. MIT.                                                       |
| [`vercel-react-view-transitions`](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/react-view-transitions) ([page](https://skills.sh/vercel-labs/agent-skills/vercel-react-view-transitions))   | Animated navigation, if it comes into scope. Current for Next 16 (no `experimental.viewTransition`, requires the reduced-motion CSS). 160K installs; MIT.                                                   |
| [`next-partial-prefetching-optimizer`](https://github.com/vercel/next.js/tree/164c41c231e1848a3c0d92470b337f208db62deb/skills/next-partial-prefetching-optimizer) ([page](https://skills.sh/vercel/next.js/next-partial-prefetching-optimizer)) | Per-link prefetching on navigation-heavy pages, later. MIT.                                                                                                                                                 |

### Skipped

| Skill                                                                                                                                                                                                                                                                                                                                                                                                                   | Why                                                                                                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`vercel-react-best-practices`](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/react-best-practices) ([page](https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices))                                                                                                                                                                                 | 820K installs, but it never mentions `use cache`, and recommends `lru-cache` for caching across requests, which contradicts Cache Components; it also pushes extra dependencies (SWR, `better-all`).                               |
| `next-best-practices`, `next-cache-components`, `next-upgrade`                                                                                                                                                                                                                                                                                                                                                          | Retired (finding 2).                                                                                                                                                                                                               |
| [`next-cache-components-adoption`](https://github.com/vercel/next.js/tree/164c41c231e1848a3c0d92470b337f208db62deb/skills/next-cache-components-adoption), [`next-partial-prefetching-adoption`](https://github.com/vercel/next.js/tree/164c41c231e1848a3c0d92470b337f208db62deb/skills/next-partial-prefetching-adoption)                                                                                              | Already adopted (ADR 0003). The first also says to install `next-dev-loop` "without asking"; Snyk Warn.                                                                                                                            |
| [`frontend-design`](https://github.com/anthropics/skills/tree/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/frontend-design) ([page](https://skills.sh/anthropics/skills/frontend-design))                                                                                                                                                                                                                            | "Take aesthetic risks" with bespoke hex palettes and typefaces, against the semantic tokens and shadcn-first rule. At most, for brand exploration once.                                                                            |
| [`agent-browser`](https://github.com/vercel-labs/agent-browser/tree/5ee8691339a5a002e4d7454eec95250253bc7419/skills/agent-browser) ([page](https://skills.sh/vercel-labs/agent-browser/agent-browser)) on its own                                                                                                                                                                                                       | A 3.5 KB stub: the real instructions come from its binary at runtime (`agent-browser skills get core`), so they can't be reviewed; global install with a native binary and its own Chrome.                                         |
| [`webapp-testing`](https://github.com/anthropics/skills/tree/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/webapp-testing) ([page](https://skills.sh/anthropics/skills/webapp-testing))                                                                                                                                                                                                                               | Python Playwright scripts, and a helper that runs commands with `shell=True` (Socket Warn), in a TypeScript and Bun repository.                                                                                                    |
| `bun` ([page](https://skills.sh/site/bun.sh/bun))                                                                                                                                                                                                                                                                                                                                                                       | Its source, a well-known endpoint on bun.sh, no longer serves it (every variant returns 404), so it can't be installed or updated. [`bun.com/docs/llms.txt`](https://bun.com/docs/llms.txt) does the same job.                     |
| [`accessibility`](https://github.com/addyosmani/web-quality-skills/tree/afa8da942115f2961fdbfa80807ea0b232ff6c00/skills/accessibility), [`seo`](https://github.com/addyosmani/web-quality-skills/tree/afa8da942115f2961fdbfa80807ea0b232ff6c00/skills/seo), [`web-quality-audit`](https://github.com/addyosmani/web-quality-skills/tree/afa8da942115f2961fdbfa80807ea0b232ff6c00/skills/web-quality-audit) (addyosmani) | Redundant with `better-accessibility`, and with the metadata already built ([ADR 0003](0003-rendering-and-production-defaults.md)); `web-quality-audit`'s script only scans `.html` files.                                         |
| [`security-review`](https://github.com/getsentry/skills/tree/f57ada2d0b640406ea7e25b11d636c530e77c58b/skills/security-review) (getsentry) ([page](https://skills.sh/getsentry/skills/security-review))                                                                                                                                                                                                                  | `allowed-tools` includes `Bash`, so it runs shell commands without asking; Gen Agent Trust Hub Fail (critical) and Socket Fail, from attack examples in its supply-chain reference; Next.js guidance covers only the Pages Router. |
| [`security-best-practices`](https://github.com/openai/skills/tree/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-best-practices) (openai) ([page](https://skills.sh/openai/skills/security-best-practices))                                                                                                                                                                                          | No Next.js or React material; writes a report into the repository and offers to commit fixes.                                                                                                                                      |
| [`writing-guidelines`](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/writing-guidelines) ([page](https://skills.sh/vercel-labs/agent-skills/writing-guidelines))                                                                                                                                                                                                     | Vercel's own documentation house style, downloaded unpinned on every run (Snyk Warn).                                                                                                                                              |

### Matt Pocock's skills

The owner's machine has them globally (the `mattpocock-skills` plugin, 1.2.3),
but the project may move to another machine, so nothing here relies on what's
installed globally: the ones the project needs are installed in it, from
[`mattpocock/skills`](https://github.com/mattpocock/skills/tree/24fe0ef7737efae15c87225755e9f6f5965e4888)
v1.3.1 (`24fe0ef`, 2026-10-04: the newest release at least two weeks old;
MIT). Read at that commit:

| Skill                                                                                                                                             | Verdict    | Why                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`grilling`](https://github.com/mattpocock/skills/tree/24fe0ef7737efae15c87225755e9f6f5965e4888/skills/productivity/grilling)                     | Installed  | Stress-tests a plan or decision with questions, one at a time; the decisions here are the owner's.                                                                                                                                      |
| [`domain-modeling`](https://github.com/mattpocock/skills/tree/24fe0ef7737efae15c87225755e9f6f5965e4888/skills/engineering/domain-modeling)        | Installed  | The glossary the README lists as the next step: challenges terms and records them in `GLOSSARY.md`. Its ADR template is a single paragraph; this repository's ADR format wins (AGENTS.md, "Decisions").                                 |
| [`codebase-design`](https://github.com/mattpocock/skills/tree/24fe0ef7737efae15c87225755e9f6f5965e4888/skills/engineering/codebase-design)        | Installed  | A vocabulary for module and package boundaries ("deep modules", seams), for AGENTS.md's isolated-packages rule.                                                                                                                         |
| [`diagnosing-bugs`](https://github.com/mattpocock/skills/tree/24fe0ef7737efae15c87225755e9f6f5965e4888/skills/engineering/diagnosing-bugs)        | Installed  | Build a loop that reproduces the bug, then fix it. Ships one shell template (`scripts/hitl-loop.template.sh`) that only prompts a person for steps and answers; a last resort, copied and edited before use.                            |
| [`research`](https://github.com/mattpocock/skills/tree/24fe0ef7737efae15c87225755e9f6f5965e4888/skills/engineering/research)                      | Installed  | Researches against primary sources and writes the findings as Markdown in the repository, as `docs/research/` does.                                                                                                                     |
| [`writing-for-agents`](https://github.com/mattpocock/skills/tree/24fe0ef7737efae15c87225755e9f6f5965e4888/skills/productivity/writing-for-agents) | Installed  | For edits to AGENTS.md and to skills.                                                                                                                                                                                                   |
| [`tdd`](https://github.com/mattpocock/skills/tree/24fe0ef7737efae15c87225755e9f6f5965e4888/skills/engineering/tdd)                                | Later      | Once a test runner is chosen.                                                                                                                                                                                                           |
| [`code-review`](https://github.com/mattpocock/skills/tree/24fe0ef7737efae15c87225755e9f6f5965e4888/skills/engineering/code-review)                | Not now    | Expects `docs/agents/issue-tracker.md` from `setup-matt-pocock-skills`, which configures an issue tracker through `gh issue`, `gh pr` and `gh api`; the project has no tracker, and [the git workflow](../git-workflow.md) limits `gh`. |
| `setup-pre-commit`, `git-guardrails-claude-code`                                                                                                  | Never here | Both install git hooks (Husky; Claude Code hooks), against [the git workflow's decision](../git-workflow.md#decisions) of no hooks.                                                                                                     |
| `resolving-merge-conflicts`                                                                                                                       | Gone       | Removed upstream before v1.3.1.                                                                                                                                                                                                         |

The rest (`prototype`, `wizard`, `to-spec`, `to-tickets`, `triage`, `teach`
and others) are general workflows the project doesn't need yet.
[`find-skills`](https://github.com/vercel-labs/skills/tree/a80e4c9d12d607631249d4d7d059f835d4b2f13a/skills/find-skills)
and `skill-creator`, also global on the owner's machine, aren't needed by
the project: this record describes how skills are found and added.

## Decision

The skills in [Recommended now](#recommended-now) that the owner keeps, and
the others when their decision comes, are installed like this:

| Item          | Before (checked 2026-10-21)                                        | Official docs (quoted)                                                                                                                                                                                       | Decision                                                                                                                                                                                                                                                                                   |
| ------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Where         | no skills in the repository; some installed on the owner's machine | Claude Code: "Commit `.claude/skills/` to version control." The `skills` CLI: project scope is "committed with your project, shared with team"                                                               | In the project only, nothing relying on the machine, which may change: the canonical copy in `.agents/skills/` (the folder most agents share), Claude Code's copy in `.claude/skills/` (it reads nowhere else; the one exception to the tool-neutral rule)                                 |
| How           | –                                                                  | The CLI: "Copy: creates independent copies for each agent. Use when symlinks aren't supported."                                                                                                              | `DISABLE_TELEMETRY=1 bunx skills@1.7.0 add <source> --skill <names> -a universal -a claude-code --copy -y`, checked against that version's `--help`. `--copy`, because git on Windows checks symlinks out as plain files unless `core.symlinks` is on                                      |
| Line endings  | Git for Windows sets `core.autocrlf=true` for the whole machine    | –                                                                                                                                                                                                            | On Windows, also `GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.autocrlf GIT_CONFIG_VALUE_0=false` for the command only, so the files arrive LF, as `.gitattributes` commits them, and `skills-lock.json` hashes what a fresh clone has                                                         |
| Pinned        | –                                                                  | AGENTS.md: "a new dependency takes its newest release at least two weeks old"                                                                                                                                | The source repository's newest commit (or release tag) at least two weeks old, in the URL (`https://github.com/<owner>/<repo>/tree/<commit>`); `skills-lock.json` (source, commit, content hash) committed                                                                                 |
| Read first    | –                                                                  | Claude Code: "review the `allowed-tools` of skills checked into a repository before you run Claude Code there." The CLI, after installing: "Review skills before use; they run with full agent permissions." | Each skill read in full at the commit installed; none may set `allowed-tools` or run commands when it loads without the owner's approval                                                                                                                                                   |
| Upstream text | –                                                                  | –                                                                                                                                                                                                            | Never edited: the folders are in `.prettierignore` and excluded from CodeRabbit's reviews (`.coderabbit.yaml`); a skill's mistakes are listed under [Known issues](#known-issues-in-the-installed-skills), and AGENTS.md, WCAG and the bundled docs win over a skill that contradicts them |
| AGENTS.md     | no mention of skills                                               | –                                                                                                                                                                                                            | One line: where skills live, when to use each, and that the owner runs `/interface-review` before a UI change is done                                                                                                                                                                      |

### The owner's calls

1. Which skills to keep, from the tables above.
2. `next-dev-loop` needs `agent-browser` installed globally on the machine
   (a native binary that downloads Chrome for Testing). Approve it, or leave
   `next-dev-loop` until Playwright is in place.
3. `shadcn` runs `npx shadcn@latest info --json` when it loads. Accept it, or
   keep a local copy changed to run the pinned CLI
   (`bunx --bun shadcn` from `packages/ui`).
4. `web-design-guidelines`, if kept: a pinned local copy instead of the
   version that downloads its rules on every run.

## Installed

On 2026-10-21, with `DISABLE_TELEMETRY=1 bunx skills@1.7.0 add
https://github.com/<owner>/<repo>/tree/<commit>[/skills/<name>] [--skill …]
-a universal -a claude-code --copy -y`, with `core.autocrlf` off for the
command (above), each from a commit at least two weeks old (finding 6).
`skills-lock.json` records each one's source, commit (`ref`) and content
hash; the hashes were recomputed independently with the CLI's own algorithm
(`computeSkillFolderHash` in `skills` 1.7.0) and all seventeen match the LF
files.

| Skill                                                                                                                                                | Source                          | Commit    | Date       |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | --------- | ---------- |
| `turborepo`                                                                                                                                          | `vercel/turborepo`              | `b19f6a5` | 2026-09-25 |
| `better-accessibility`, `better-layout`, `better-typography`, `better-ui`, `better-colors`, `better-writing`, `better-interface`, `interface-review` | `jakubkrehel/skills`            | `d574cc8` | 2026-10-05 |
| `core-web-vitals`                                                                                                                                    | `addyosmani/web-quality-skills` | `afa8da9` | 2026-08-24 |
| `security-and-hardening`                                                                                                                             | `addyosmani/agent-skills`       | `8fc42eb` | 2026-10-07 |
| `grilling`, `domain-modeling`, `codebase-design`, `diagnosing-bugs`, `research`, `writing-for-agents`                                                | `mattpocock/skills`             | `24fe0ef` | 2026-10-04 |

Checked after installing: all seventeen, in both `.agents/skills/` and
`.claude/skills/`, are byte-identical to their source at the pinned commit;
none sets `allowed-tools` or runs a command when it loads; and the only file
that isn't Markdown, YAML or JSON is `diagnosing-bugs`' shell template. Both
folders and the lock file are in `.prettierignore`, and
`.claude/settings.local.json` (personal settings) is gitignored.

Not installed yet: `shadcn` and `next-dev-loop` (the owner's calls 2 and 3),
and the [later](#later-once-the-related-decision-is-made) skills.

## Known issues in the installed skills

Found by CodeRabbit's review of pull request 1 (2026-10-20) and checked
against the sources cited. The skills' files stay as upstream wrote them
(editing them would break their pin); each issue is handled as below, and is
worth reporting upstream.

| Skill                                            | Issue                                                                                                                                                                                                                                                                               | Here                                                                                                                                                   |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `better-colors` (`contrast.md`)                  | Says placeholder text has no contrast requirement; WCAG's [Understanding 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) says the criterion "applies to text in the page, including placeholder text". Disabled controls are exempt; placeholders aren't. | Placeholder text meets 4.5:1 (AGENTS.md, "Interface": WCAG 2.2 AA)                                                                                     |
| `core-web-vitals` (`references/LCP.md`)          | Its Next.js examples use the Pages Router (`getServerSideProps`, `getStaticProps`, `export const config`); this app uses the App Router. Two more snippets were already known (finding in [Recommended now](#recommended-now)).                                                     | The bundled Next.js docs win: data in async Server Components, route options as direct exports                                                         |
| `domain-modeling` (`ADR-FORMAT.md`)              | A one-paragraph ADR template with optional sections, and an ADR only when a decision is hard to reverse _and_ surprising _and_ a real trade-off.                                                                                                                                    | AGENTS.md: ADRs keep this repository's format, and every hard-to-reverse decision and departure from official guidance gets one, whatever a skill says |
| `better-accessibility` (`focus-and-keyboard.md`) | Makes `#app-content` inert behind a custom overlay without saying the overlay must sit outside it; an overlay inside would become inert too.                                                                                                                                        | A custom overlay renders outside the content it makes inert, or the Base UI dialog (which handles this) is used                                        |
| `interface-review` (`scope-resolution.md`)       | The pull request refspec lacks `+`, so a force-pushed pull request fails to update ([git fetch](https://git-scm.com/docs/git-fetch)); a `staged` review also takes untracked files, and gives no `git diff --cached` command.                                                       | The owner runs it; reviewing a pull request after a force-push, or only staged changes, needs those two corrections by hand                            |

## Alternatives considered

- **No skills; bundled docs only.** Covers framework knowledge (finding 1),
  but not reviews and workflows such as accessibility or interface review.
- **Install globally (`-g`).** Nothing in the repository, but the skills
  would stay on one machine, which the owner may not keep, and the choice
  wouldn't be reviewable in a diff.
- **Only `.claude/skills/`.** Simpler, but other agents wouldn't see the
  skills, against the tool-neutral rule.
- **Symlinks (the CLI's default).** One copy instead of two, but they break
  on Windows clones without `core.symlinks`.
- **The most-installed skills.** Install counts favoured skills that are
  retired, or that contradict this stack (`vercel-react-best-practices`).

## Consequences

- Skills are text that agents follow, so each one is a dependency of the
  agents' behaviour: updates are read before they're taken, like any other
  dependency.
- Two copies of each skill (`.agents/skills/` and `.claude/skills/`) are
  committed; `skills update` keeps both in step.
- `/interface-review` becomes part of finishing a UI change, run by the
  owner.

## Sources

Linked inline above.
