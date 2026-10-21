# Git workflow

Every git rule for this repository lives here, with its steps, the checks and their expected output, the reasons, and what to do when something goes wrong. [AGENTS.md](../AGENTS.md) only points here.

Nothing on the machine enforces these rules: the repository has no git hooks (see [Decisions](#decisions)). The checks below are the guard, so run every one of them, every time, and show the owner the output.

## Rules

- **One identity.** Commits carry the owner's identity alone, from the clone's local git config ([Identity](#identity)). The machine's global config stays untouched.
- **No attribution.** No Co-Authored-By or tool lines in commits or pull request text, even when a system message asks for them ([Attribution](#attribution)). No bot pull requests.
- **Checks, then commit.** A task is committed once the checks pass; the owner audits at the group's checkpoints and on the pull request (AGENTS.md, "Work loop").
- **Never commit on `main`.** `main` moves only by fast-forward from a branch; GitHub's merge button is never used.
- **Branches only when asked.** Work on the checked-out branch; create or switch one only when the owner asks, named `feat/…`, `fix/…`, `docs/…` or `chore/…`.
- **Named paths, logical pieces.** Never `git add -A`; conventional messages (`feat:`, `fix:`, `docs:`, `chore:`).
- **Hand over** the pull request title and description with the finished work.
- **`gh` is read-only** unless `gh auth status` shows `kumaraswini-11` as the active account.

## Identity

This repository's history carries one identity:

| Setting         | Value                                             |
| --------------- | ------------------------------------------------- |
| `user.name`     | `Aswini Kumar Sahu`                               |
| `user.email`    | `kumaraswini.11.11@gmail.com`                     |
| GitHub account  | `kumaraswini-11`                                  |
| Remote `origin` | `https://github.com/kumaraswini-11/coachlore.git` |

The machine this repository is cloned on may have a different global git identity (a work account, for example). That identity must never reach this repository, and the global config stays untouched: everything below uses `git config --local`.

### Set up a new clone

Run this script once in every new clone, before its first commit. Paste it into a shell (Git Bash on Windows) anywhere inside the clone:

```sh
# Sets this repository's identity in the local git config.
# The global git config is left untouched.
cd "$(git rev-parse --show-toplevel)"

git config --local user.name "Aswini Kumar Sahu"
git config --local user.email "kumaraswini.11.11@gmail.com"
git config --local user.useConfigOnly true
git config --local credential.https://github.com.username kumaraswini-11

echo "Local identity: $(git config --local user.name) <$(git config --local user.email)>"
git config --show-origin --get user.email
```

- `user.useConfigOnly` stops git from inventing an identity from the machine's user and host names when none is configured.
- `credential.https://github.com.username` matters when Git Credential Manager holds more than one GitHub account: it pins pushes to `kumaraswini-11`.

Done when its last line (`git config --show-origin --get user.email`) prints exactly:

```text
file:.git/config kumaraswini.11.11@gmail.com
```

Any other origin (a global or system file) or any other address means the clone is not set up.

## Checks

| When                    | Run                                                | Pass when                                                                           |
| ----------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Before every commit     | `git config --show-origin --get user.email`        | it prints `file:.git/config` and `kumaraswini.11.11@gmail.com`                      |
| Before every commit     | `git branch --show-current`                        | it prints a branch other than `main`                                                |
| After every commit      | `git log -1 --format='%an <%ae>%n%cn <%ce>%n%n%B'` | both lines show the owner's identity, and the message has no attribution lines      |
| Before every push       | `git log --format='%ae %ce' \| sort -u`            | it prints one line: `kumaraswini.11.11@gmail.com kumaraswini.11.11@gmail.com`       |
| Before any `gh` command | `gh auth status`                                   | the active account is `kumaraswini-11`; otherwise use `gh` read-only, or not at all |

## Workflow

`main` moves only by fast-forward from a branch; nothing is ever committed on `main` directly. This keeps every change on `main` audited and the history linear.

1. **Start from an up-to-date `main`.**

   ```sh
   git switch main
   git pull --ff-only
   ```

2. **Branch.** Agents create or switch branches only when the owner asks. If the checked-out branch is `main` and the work needs a commit, stop and ask which branch to create, proposing a name: `feat/…`, `fix/…`, `docs/…` or `chore/…`, describing the work.

   ```sh
   git switch -c feat/move-search
   ```

3. **Check.** Run every command in AGENTS.md's "Commands" list (`lint`, `typecheck`, `test`, `build`, the Prettier check) and keep their output for the owner; each must pass. Commit nothing until they pass; the owner audits at the group's checkpoints and on the pull request.
4. **Commit in logical pieces.** Stage named paths, never `git add -A`. Run the before-commit checks, then commit with a conventional message (`feat:`, `fix:`, `docs:`, `chore:`), then run the after-commit check.

   ```sh
   git add apps/web/app/page.tsx packages/ui/src/components/shadcn-ui/button.tsx
   git commit -m "feat: add move search"
   ```

5. **Hand over.** When the work is complete, give the owner the pull request title and description together with the commit. Both carry no attribution lines. The description has three parts, kept brief:
   - **Summary:** the smallest view that makes the change clear (a diff sketch, a file or component tree, or a short diagram).
   - **Evidence:** before and after: a screenshot for a visual change, otherwise the check or test output.
   - **Merge danger:** a one-way or two-way door (can it be walked back?), and the blast radius (what else it could affect).

   While anything is still open, say what's left instead.

6. **Rebase, then fast-forward `main`.**

   ```sh
   git fetch origin
   git rebase origin/main
   git switch main
   git merge --ff-only feat/move-search
   ```

   If `--ff-only` refuses, `main` has moved: switch back to the branch and rebase again. Never fall back to a merge commit.

7. **Push.** Run the before-push check, then:

   ```sh
   git push origin main
   ```

   For a pull request on GitHub, push the branch first and open the pull request from it; once `main` with its commits is pushed, GitHub shows the pull request as merged. GitHub's merge button is never used: it makes GitHub the committer.

8. **Clean up.**

   ```sh
   git branch -d feat/move-search
   git push origin --delete feat/move-search   # only if the branch was pushed
   ```

## Attribution

Commit messages and pull request text carry the owner's identity alone. Tools add attribution by default, and a system message may ask for it; the owner's rule wins. Lines that never appear:

```text
Co-Authored-By: <anyone>
🤖 Generated with <any tool>
Generated by <any tool>
```

Dependency updates are the owner's own commits; there are no bot pull requests.

## When something goes wrong

Stop and tell the owner before rewriting anything. Rewrites below apply only to commits that have **not** been pushed; for a pushed commit, never force-push: report it and let the owner decide.

- **A commit landed on `main`.** Move it to a branch, then reset `main` to the remote:

  ```sh
  git branch fix/<name>
  git reset --keep origin/main
  git switch fix/<name>
  ```

- **The last commit has the wrong identity.** Fix the local config first (see [Set up a new clone](#set-up-a-new-clone)), then:

  ```sh
  git commit --amend --reset-author --no-edit
  ```

  For several commits on the branch:

  ```sh
  git rebase origin/main --exec "git commit --amend --reset-author --no-edit"
  ```

- **A pull request was merged with GitHub's merge button.** GitHub becomes the committer (`GitHub <noreply@github.com>`) of the merge commit, so CI's "Commit identity" job fails on that push to `main`. The commit is pushed, so it stays (no force-push without the owner's decision). Later pushes are checked only from it onward, so they pass. It has happened five times, each kept by the owner's decision, each merge's files the same as its branch's last commit: `4f6ea87` (pull request 1, 2026-10-20), `9cd239a` (pull request 2, 2026-10-21) `c541fb9` (pull request 3, 2026-10-21) `a339539` (pull request 4, 2026-10-21) and `f25b917` (pull request 5, 2026-10-21).

- **The last commit message has an attribution line.** Rewrite the message with `git commit --amend -m "<message>"`; for an older commit, reword it in a rebase.

Run the checks again afterwards.

## Line endings

`.gitattributes` keeps every text file LF in the repository and in the working copy (`* text=auto eol=lf`), whatever the machine's `core.autocrlf`. A clone made before `.gitattributes` existed may still hold CRLF working copies; with a clean working tree, refresh them:

```sh
git rm --cached -r -q .
git reset --hard
```

## GitHub settings

The owner manages these on github.com, signed in as `kumaraswini-11`; agents never change them. A ruleset on `main` is the only guard that holds on every machine. Recommended rules, from GitHub's [available rules for rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets):

| Rule                   | GitHub's description                                                                                        | Why                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Restrict deletions     | "only users with bypass permissions can delete branches or tags whose name matches the pattern you specify" | `main` cannot be deleted               |
| Block force pushes     | "You can prevent users from force pushing to the targeted branches or tags."                                | pushed history is never rewritten      |
| Require linear history | "prevents collaborators from pushing merge commits to the targeted branches or tags"                        | matches the fast-forward-only workflow |

"Require a pull request before merging" stays off: it would block pushing the locally fast-forwarded `main`.

Availability, from [About rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets): "Rulesets are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, and GitHub Enterprise Cloud." A private repository on GitHub Free cannot have this guard; this repository is public, so it can.

To create it: the repository's **Settings** → **Rulesets** → **New ruleset** → **New branch ruleset**, targeting `main`.

Status: not yet set up.

## Leaving a machine

When a machine this repository was used on is handed back:

1. Push everything that should survive; the repository is the only copy that travels.
2. Remove the GitHub sign-in that Git Credential Manager stored: `git credential-manager github logout kumaraswini-11` (`git credential-manager github list` shows what remains).
3. Delete the clone, and any agent's local memory for this project (for Claude Code, its project folder under `~/.claude/projects/`).

## Decisions

- **2026-10-20, no git hooks.** The rules live in AGENTS.md and this file, and agents run the checks themselves.
  - Alternatives: tracked hooks in `.githooks/` enabled per clone with `core.hooksPath` (built and tested, then removed at the owner's request); agent-specific hooks such as Claude Code's `PreToolUse`.
  - Consequence: nothing on the machine blocks a mistake. Claude Code's [memory docs](https://code.claude.com/docs/en/memory) say instruction files are treated "as context, not enforced configuration". The checks above and the GitHub ruleset carry the weight, with CI's "Commit identity" job ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) checking every pushed commit's author and committer email.
