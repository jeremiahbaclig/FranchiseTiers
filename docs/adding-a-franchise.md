# Adding a new franchise

The tournament engine (`src/core/engine.ts`, `src/core/tiers.ts`) is franchise-agnostic.
Adding a franchise never requires touching it.

## 1. Build a character catalog

Create `src/franchises/<id>/catalog.generated.json`: an array of `CharacterEntry`
(see `src/core/types.ts`) with stable `id`, `displayName`, `imageUrl`, and optional
`aliases`/`metadata`. Do not hand-author this if an official source is scriptable —
follow the League of Legends pattern instead (see below).

## 2. Resolve images at build time, not at runtime

Write a script under `scripts/generate-<id>-catalog.ts` that:
1. Reads a plain list of names/ids for the franchise (`scripts/data/<id>-roster-input.json`).
2. Fetches the franchise's official data source once.
3. Cross-references each roster entry against that source (normalize punctuation/case).
4. Writes resolved image URLs + stable ids into `catalog.generated.json`.
5. Flags unmatched entries as `verified: false` instead of dropping them, and writes a
   `scripts/data/<id>-unverified-report.json` for review.

See `scripts/generate-lol-catalog.ts` for the reference implementation (uses Riot's
Data Dragon JSON API rather than scraping a marketing page).

## 3. Register the franchise

In `src/franchises/registry.ts`, add an entry to `FRANCHISE_REGISTRY`:

```ts
const myFranchise: Franchise = {
  id: "my-franchise",
  displayName: "My Franchise",
  description: "...",
  imageSource: { providerId: "my-provider", baseUrl: "https://..." },
  catalog: myCatalog as Franchise["catalog"],
};
```

The franchise-selection screen reads from this registry automatically — no UI changes needed.

## 4. Verify

- `yarn tsx scripts/generate-<id>-catalog.ts` — regenerate the catalog, check the unverified report.
- `yarn vitest run` — engine tests are franchise-agnostic and don't need changes.
- `yarn build` — confirm the new catalog JSON doesn't break the production build.
