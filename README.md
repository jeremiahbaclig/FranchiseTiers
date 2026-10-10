# Franchise Tier Tournament

Rank characters from a franchise through head-to-head image matchups, client-side, no backend.

## Run

```bash
yarn install --ignore-engines   # see note below
yarn dev
```

## Scripts

- `yarn dev` — local dev server
- `yarn build` — type-check + production build
- `yarn test` — run the Vitest suite once
- `yarn test:watch` — Vitest in watch mode
- `yarn lint` — ESLint
- `yarn generate:lol-catalog` — regenerate `src/franchises/lol/catalog.generated.json` from Riot's Data Dragon API

## Notes

- `.yarnrc` sets `ignore-engines true` because some devDependencies declare a Node engine range
  narrower than this machine's installed Node version; the app itself targets standard browsers.
- Adding a new franchise: see [docs/adding-a-franchise.md](docs/adding-a-franchise.md).
- Implementation phase log: [docs/PROGRESS.md](docs/PROGRESS.md).

