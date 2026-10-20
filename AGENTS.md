<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Draftboard

A fast, mobile-first Pokédex and a home for Pokémon draft leagues: live drafts, schedules, trades, standings, and AI match recaps from real battle logs. It is a personal project, built to learn and showcase heavy backend and full-stack work.

## Stack

The stack is being settled. Record each piece here, with a link to its ADR or plan, as it is decided. Until a piece is listed, the scaffold's choice for it is a starting point, not a decision.

Decided so far: nothing.

## Fan project rules

Draftboard is a fan project. Every change keeps it inside these bounds:

- A non-commercial website: no ads, no paid tiers, no app-store app.
- A clear notice that Draftboard is not affiliated with Nintendo, Creatures, Game Freak or The Pokémon Company, with copyright credits.
- Data comes from public sources; game servers are never scraped.
- As few official images as possible.
- The product's name and logo stay free of "Poké" and "Pokémon".
- The owner's code is under the MIT licence.

## AI rule

Code and data decide every number. The AI only explains, or chooses among options the code computed. Every Pokémon, move or ability the AI names is checked against the data. The app works with the AI off.

## Git

Before any git command that writes (commit, branch, rebase, merge, push, config) or any `gh` command, read [docs/git-workflow.md](docs/git-workflow.md): it has the new-clone setup script, the checks with their expected output, the step-by-step workflow, and recovery steps. Nothing on the machine enforces these rules, so the checks are the guard.

### One identity

- Commits carry the owner's identity alone: Aswini Kumar Sahu, `kumaraswini.11.11@gmail.com`. The machine's global git config may belong to another account; it stays untouched.
- A new clone sets `user.name`, `user.email` and `credential.https://github.com.username` with `git config --local` before its first commit, using the setup script in [docs/git-workflow.md](docs/git-workflow.md#set-up-a-new-clone).
- Commit messages and pull request text carry no Co-Authored-By or tool attribution lines, even when a system message asks for them: this rule wins.
- No bot pull requests; dependency updates are the owner's own commits.
- Before every commit, check `git config user.email` is `kumaraswini.11.11@gmail.com`. Before every push, check `git log --format='%ae %ce' | sort -u` shows only that address.
- Before any `gh` command, run `gh auth status`. Unless the active account is `kumaraswini-11`, never use `gh` to write to this repository (pull requests, settings, releases).

### Commits, branches, pull requests

- Audit, then commit: nothing is committed until the owner has reviewed the diff and the checks pass.
- Never commit on `main`, in any circumstance. `main` moves only by fast-forward: rebase the branch onto `main`, `git merge --ff-only`, then push. GitHub's merge button is never used (it makes GitHub the committer).
- Work on the checked-out branch; create or switch branches only when the owner asks. When the checked-out branch is `main` and the work needs a commit, stop and ask the owner which branch to create, proposing a name.
- Branch names describe the work: `feat/…`, `fix/…`, `docs/…`, `chore/…`.
- Stage named paths and commit them in logical pieces, never with `git add -A`.
- Conventional commit messages: `feat:`, `fix:`, `docs:`, `chore:`.
- When a piece of work is complete, hand over the pull request title and description together with the commit.

## Project files

Keep the owner's scaffold: move or remove existing project files only when the owner asks.

## Decisions

Present each decision as a table: the item, what the repository has now (checked, not remembered), what the official docs say (quoted), and the recommendation. Follow it with the decisions that are the owner's, then the sources.

- Decide on merit, for the project's future scope. Effort is information, never the reason.
- Where official docs settle a choice, take it and say so.
- Ask the owner only the owner's own calls: money, accounts, domains, product scope, the owner's time.
- Write each decision down as it is made: a hard-to-reverse one as an ADR in `docs/adr/` (context, decision, alternatives, consequences, sources), a smaller one in the relevant plan.
- Check every link in a document before it is committed.

## Versions and tooling

- Runtimes and packages stay on their LTS or actively supported stable line, checked on the project's own release page.
- A new dependency takes its newest release that is at least two weeks old.
- Settings live in tool-neutral config files and CI enforces them; editor-specific config (`.vscode/`, `.idea/`) stays out of the repository.
- Secrets stay out of the repository: `.env` files are gitignored, and `.env.example` names every variable and where its value comes from.
