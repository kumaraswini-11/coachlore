# 005: Team check, the plan

## Builds on

- **Spec 001:** the shell, states, type badges.
- **Spec 002:** `packages/dex`: the browser index, learnsets, abilities,
  and the Showdown name tables.
- **Spec 003:** the form search used by the palette, the service worker.
- **Spec 004:** `packages/dex/src/matchups.ts` and the ability notes.

## Packages and files

| Path                                               | What                                                                                                                                                                                                              |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/dex/src/team.ts`                         | `teamWeaknesses(team)` (per attacking type: each member's multiplier, weak and resist counts, shared and uncovered) and `teamCoverage(team, learnedMoves)`; pure                                                  |
| `packages/dex/src/showdown-team.ts`                | `parseShowdownTeam(text)` → `{ team, unknown[] }` and `formatShowdownTeam(team)`, using spec 002's Showdown name tables                                                                                           |
| `apps/web/lib/team-link.ts`                        | The `team` query value to and from a team (`parseTeamParam`, `toTeamParam`); invalid parts returned as a list, never thrown                                                                                       |
| `apps/web/app/[lang]/team-check/page.tsx`          | Static page; the checker sits in `<Suspense>` because it reads the address                                                                                                                                        |
| `apps/web/components/team-check/team-check.tsx`    | Client: slots, matrix, coverage, import and export                                                                                                                                                                |
| `apps/web/components/team-check/member-editor.tsx` | Client: moves and ability for one member (Sheet on a phone, Popover on desktop)                                                                                                                                   |
| `apps/web/app/dex-data/learnable/[form]/route.ts`  | A static Route Handler per form: the moves it learns in any game, as JSON, built ahead with `generateStaticParams` ([Route Handlers](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)) |

## Data model

```ts
type TeamMember = { form: string; ability?: string; moves: string[] } // up to 4 moves
type Team = TeamMember[] // up to 6
```

**The link format**, readable and short, using only characters a browser
keeps as they are in a query string:

```text
/team-check?team=garchomp@rough-skin~earthquake.dragon-claw,rotom-wash~hydro-pump.volt-switch
```

- Members are separated by `,`; a member is its form key, then optionally
  `@ability`, then optionally `~` and its moves separated by `.`.
- Keys are PokéAPI names (lowercase letters, digits and hyphens), so none of
  `, @ ~ .` can appear inside one.
- The link is written by hand (not through `URLSearchParams`, which would
  percent-encode `,` and `@`); reading accepts both forms.

**Showdown names:** forms from spec 002's Showdown-name table; moves and
abilities by comparing names with everything but letters and digits
removed ("U-turn" and `u-turn` both become `uturn`), with spec 002's
exceptions table for the few that differ.

## Rendering

The page is static; the checker reads `team` with `useSearchParams` in a
`<Suspense>` boundary whose fallback is the empty team. A member's
learnable moves load from `/dex-data/learnable/[form]` when its editor
opens, and the service worker caches each one it fetches. Offline, a team
opened before still shows its weaknesses and coverage, and a member's
moves can be edited if they were loaded on an earlier visit; otherwise the
editor says the move list needs a connection, and the rest of the checker
works; types, abilities and the chart come from the browser index already
loaded. Each change updates the address with `router.replace` (no new
history entry per edit) and recomputes in a transition.

## API

None.

## Events

None.

## Jobs

None.

## Decisions

| Item                 | What the docs say | Options                                        | Decision                                                                                                          |
| -------------------- | ----------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Where the team lives | –                 | the address; the browser's storage; an account | The address only: shareable, works offline, nothing stored (the project doc: "stores nothing about its visitors") |

## Tests

| Acceptance criterion | Test                                                                                                                                                           |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1                    | `packages/dex/src/team.test.ts`: five fixed teams against values computed from the chart in the test                                                           |
| 2                    | `apps/web/lib/team-link.test.ts` (round trip, invalid parts); `apps/web/e2e/team-check.spec.ts` (new tab)                                                      |
| 3, 4                 | `packages/dex/src/showdown-team.test.ts`: three fixture exports, round trip, unknown names                                                                     |
| 5                    | `e2e/team-check.spec.ts`: no request while editing, after the learnable moves loaded                                                                           |
| 6                    | `e2e/a11y.spec.ts` extended; keyboard path for add, edit, remove; the live region's text                                                                       |
| 7                    | `e2e/offline.spec.ts` extended: offline, a visited team renders; an editor whose moves were loaded works; one whose moves weren't shows the connection message |
| 8                    | `apps/web/lib/team-link.test.ts` (more than six forms) and `e2e/team-check.spec.ts` (the swap)                                                                 |
| 9                    | `e2e/team-check.spec.ts`: one link on `/en/team-check` and `/hi/team-check`, same members and results; Hindi labels, English names                             |

## Tasks

1. **Team arithmetic in `packages/dex`.** Done when: criterion 1 passes.
2. **Showdown import and export.** Done when: criteria 3 and 4 pass at the
   package level.
3. **The link format,** including a link with more than six forms (the
   first six checked, the rest listed). Done when: `team-link.test.ts`
   passes and criterion 8 passes.
4. **The screen with fixtures** (screen process, step 2): slots, member
   editor, matrix (phone and desktop), coverage, import and export dialogs,
   every state. Done when: the owner has reviewed it on a desktop and a
   phone.
5. **On real data.** Learnable-moves route, the address, recomputation.
   Done when: criteria 2, 3 and 5 pass through the interface.
6. **Offline, accessibility and languages pass.** The checker's strings
   come from the dictionaries (passed to the Client Component as props).
   Done when: criteria 6, 7 and 9 pass, `rtl.spec.ts` (spec 001) passes
   for the page, and the owner's `/interface-review` passes.
