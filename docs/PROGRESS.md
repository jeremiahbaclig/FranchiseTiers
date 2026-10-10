# Implementation Progress

Tracks phase status so a fresh agent session can resume without re-reading the whole repo.

| Phase | Description | Status | Key artifacts |
|---|---|---|---|
| 1 | Repo inspection & scaffold | done | `src/`, `scripts/`, `docs/`, folder skeleton, Vitest wired |
| 2 | Generic domain types | done | `src/core/types.ts`, `src/core/tournamentTypes.ts` |
| 3 | LoL catalog + image manifest | done | `scripts/generate-lol-catalog.ts`, `src/franchises/lol/catalog.generated.json` (173/173 resolved, Data Dragon v16.20.1) |
| 4 | Tournament engine + unit tests | done | `src/core/engine.ts`, `src/core/tiers.ts`, `src/core/engine.test.ts` (11 tests) |
| 5 | Franchise selection & matchup UI | done | `src/franchises/registry.ts`, `src/components/*`, `src/hooks/useTournament.ts` |
| 6 | Persistence, undo, restart | done | `src/persistence/storage.ts` (4 tests) |
| 7 | Tier list & favorite UI | done | `src/components/TierList.tsx`, `src/components/ConfirmDialog.tsx` |
| 8 | Full verification pass | done | tsc clean, 15/15 tests, lint clean, production build succeeds, preview smoke test 200 |
| 9 | Add-a-franchise docs | done | `docs/adding-a-franchise.md` |

## Notes
- Package manager: yarn (repo pinned via `.yarnrc` with `ignore-engines true` — local Node 23.11.0 is newer than some devDependency engine ranges).
- Image source: Riot Data Dragon JSON API, not page scraping.
- Bye policy: odd leftover shown alone, user manually advances/eliminates.
- Unverified roster names: kept with `verified: false` + placeholder image, never dropped.
- Tier granularity: strictly record-based for v1 (no sub-tiers by elimination round).
