# 11. Pokémon images: self-hosted, never hot-linked

- Status: Accepted (the owner, 2026-10-22)
- Date: 2026-10-22
- Builds on: [ADR 0006](0006-architecture-and-stack.md), "Pokémon data"
  ("Images"), and [ADR 0009](0009-pokemon-data-imported-and-refreshed.md)

## Context

Spec 002 downloads PokéAPI's sprites and official artwork from the
`PokeAPI/sprites` repository at a pinned commit, converts them to WebP and
commits them in `apps/web/public/dex-images/` (1,330 sprites and 1,335
artworks, 16.6 MB), and the site serves them from its own address.

With the Dex's cards showing the artwork, the owner asked twice
(2026-10-22): every image already has a public address on GitHub, such as
`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/<id>.png`.
Why download them? Couldn't the pages show that address directly, and the
downloaded copies be deleted?

This record answers that, so the question needn't be settled again.

## Decision

| Item                    | What the repository has now                                                                                              | What the sources say (quoted)                                                                                                                                                                                                                                                                                                                                                                                                                                              | Decision                                                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Where images are served | From our own site, `/dex-images/…`, the files in `apps/web/public/dex-images/` (spec 002, criterion 12; ADR 0006)        | GitHub's rate limits for unauthenticated requests cover "downloading files from raw.githubusercontent.com" ([changelog, 2025-05-08](https://github.blog/changelog/2025-05-08-updated-rate-limits-for-unauthenticated-requests/)); a visitor's browser is unauthenticated. `@pkmn/img`: "hosting your own sprites", "which you are strongly encouraged to do to avoid driving up Pokémon Showdown's bandwidth costs" ([pkmn/img](https://github.com/pkmn/ps/tree/main/img)) | Kept: self-hosted, never hot-linked. The images stay in the repository, and the site serves them through Vercel's CDN                                                                |
| Which version is shown  | PokéAPI's sprites at a pinned commit (`packages/dex/sources.json`), refreshed with the data (ADR 0009)                   | A `master` address follows the repository's latest commit                                                                                                                                                                                                                                                                                                                                                                                                                  | Pinned, as the rest of the data is: a picture changes only when an import brings it in                                                                                               |
| Visitors' privacy       | Pages load nothing from another site but error reports to Sentry, without personal data (ADR 0006, "Errors and logs")    | A hot-linked image is a request from each visitor's browser to the image's host, which sees the visitor's address                                                                                                                                                                                                                                                                                                                                                          | No third party sees visitors for an image                                                                                                                                            |
| The offline Dex         | Spec 003, section 5: after a first visit, the Dex works offline, its images included, from the site's own service worker | A service worker's cache holds another site's responses only as opaque ones, which it can't check                                                                                                                                                                                                                                                                                                                                                                          | Images stay on our own address, which the service worker caches like any other file                                                                                                  |
| The security headers    | `img-src 'self' blob: data:` (`apps/web/next.config.ts`; ADR 0003)                                                       | –                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Unchanged: images only from the site itself                                                                                                                                          |
| As few official images  | The project doc and AGENTS.md: "as few official images as possible"                                                      | –                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Unchanged: one sprite and one artwork per form, credited on every page. Sharper card images (192 and 288 px of the same artwork) come in spec 003's task 9, self-hosted the same way |

## Alternatives considered

- **Hot-link `raw.githubusercontent.com`:** no images in the repository and
  no import step for them. But a visitor's browser makes unauthenticated
  requests, which GitHub rate-limits; a card would show a broken image when
  a limit or an outage hits. GitHub's raw files aren't a CDN for websites.
  It also sends each visitor's address to GitHub, leaves the offline Dex
  without images, widens `img-src`, and with `master`, shows whatever the
  repository holds that day rather than the pinned version.
- **jsDelivr, pinned to one commit**
  (`cdn.jsdelivr.net/gh/PokeAPI/sprites@<commit>/…`): a real CDN, and the
  version stays fixed. But visitors' addresses still reach a third party,
  `img-src` still widens, the offline Dex still needs cross-site caching,
  and the site depends on a free service it has no agreement with.
- **`next/image` on the remote address:** Vercel would fetch and resize each
  image once, but the Hobby plan includes only the "First 5,000" image
  transformations a month ([Hobby](https://vercel.com/docs/plans/hobby)),
  and the site would still depend on the remote host for every new size.

## Consequences

- The repository carries 16.6 MB of images (about 15 MB more with task 9's
  card sizes). Visitors don't feel it: each card loads one small WebP from
  Vercel's CDN.
- A data refresh (ADR 0009) re-imports the images with the rest, from the
  newly pinned commit.
- If the repository's size becomes a problem, the images can move to
  object storage on our own address, without changing this decision.

## Sources

- The owner's decision, 2026-10-22, after the question above.
- [Updated rate limits for unauthenticated requests](https://github.blog/changelog/2025-05-08-updated-rate-limits-for-unauthenticated-requests/),
  GitHub changelog, 2025-05-08.
- [`@pkmn/img`](https://github.com/pkmn/ps/tree/main/img), "hosting your own
  sprites".
- [Vercel Hobby plan](https://vercel.com/docs/plans/hobby), image
  transformations.
- [Spec 002](../specs/002-pokemon-data/spec.md), criterion 12, and
  [spec 003](../specs/003-dex-browse/spec.md), sections 5 and 6.
- [Plan 003](../specs/003-dex-browse/plan.md), "Decisions", "Card images,
  sharp on phones".
