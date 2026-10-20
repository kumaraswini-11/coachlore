# 5. Product name

- Status: Accepted
- Date: 2026-10-21

## Context

The project needs a name it can keep if it ever reaches a wider audience.
The working name was a descriptive compound, and checks on 2026-10-21 found
it crowded: its `.com`, `.gg` and `.app` domains were in use by other
products, the same word was a registered US trademark for fantasy sports,
and searches for it were dominated by fantasy football tools.

The name has to follow AGENTS.md ("Pokémon belongs to others"): no "Poké" or
"Pokémon" in the product's name or logo, and nothing that suggests it's
official.

## Decision

The product is **Coachlore**.

| Item          | Before (checked 2026-10-21)                                   | Official docs (quoted)                                                                                                                                                                           | Decision                                                                                                                                                                                         |
| ------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Meaning       | a name for the draft only                                     | –                                                                                                                                                                                                | In a draft league the players are coaches; lore is what a coach knows: every Pokémon, move and matchup (the Dex) and the league's history of picks, trades and replays (the league). Both halves |
| Trademark     | a descriptive name                                            | USPTO: "Strong trademarks are suggestive, fanciful, or arbitrary"; "Weak trademarks are descriptive or generic" ([strong trademarks](https://www.uspto.gov/trademarks/basics/strong-trademarks)) | A suggestive name, which can be protected                                                                                                                                                        |
| The franchise | –                                                             | AGENTS.md: no "Poké" or "Pokémon" in the product's name or logo                                                                                                                                  | Neither, and no "dex" either: the name doesn't lean on Pokédex, and still fits if the product grows beyond one game                                                                              |
| Domains       | the working name's in use                                     | –                                                                                                                                                                                                | `coachlore.com` and `coachlore.app` unregistered, checked with the registries' RDAP services (Verisign for `.com`, Google Registry for `.app`)                                                   |
| Collisions    | a registered mark and several products under the working name | –                                                                                                                                                                                                | No product, company or app named Coachlore found by web search                                                                                                                                   |

## Alternatives considered

- **Keeping the working name.** Weak as a trademark, crowded in search, and
  its domains taken.
- **Rostercraft, Draftledger, Coachhall.** Meaningful, but only `.app` was
  free; `.com` was registered.
- **Coachroom, Leaguecraft, Leaguebook, Coachdesk and other plain
  compounds.** `.com` and `.app` both registered.
- **Draftdex.** The most descriptive, but "-dex" echoes Pokédex, against the
  spirit of the franchise rule.

## Consequences

- The name is in the code (`apps/web/lib/site.ts`), the package names, the
  share image and every document. Git history before this decision keeps the
  working name; removing it would mean rewriting pushed history.
- The owner's calls: registering `coachlore.com` (domains are first come,
  first served); renaming the GitHub repository and this clone's folder to
  match the remote URL in [the git workflow](../git-workflow.md); and, before
  any launch, a search of the [USPTO's trademark records](https://tmsearch.uspto.gov)
  and the app stores. "Coach" is also a fashion brand's mark, registered for
  goods such as bags and clothing rather than software; a trademark lawyer's
  view settles it before any launch.

## Sources

- [USPTO, strong trademarks](https://www.uspto.gov/trademarks/basics/strong-trademarks)
- [Verisign RDAP for `.com`](https://rdap.verisign.com/com/v1/domain/coachlore.com)
  and [Google Registry RDAP for `.app`](https://pubapi.registry.google/rdap/domain/coachlore.app):
  both answered 404 (not registered) on 2026-10-21.
- [USPTO trademark search](https://tmsearch.uspto.gov)
