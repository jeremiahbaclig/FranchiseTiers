// Build-time catalog generator: resolves the LoL roster against Riot's Data Dragon API.
// Run via `yarn generate:lol-catalog`. Never called at runtime by the app.
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROSTER_PATH = join(__dirname, "data", "lol-roster-input.json");
const OUT_DIR = join(__dirname, "..", "src", "franchises", "lol");
const CATALOG_OUT = join(OUT_DIR, "catalog.generated.json");
const REPORT_OUT = join(__dirname, "data", "unverified-report.json");

interface DDragonChampion {
  id: string;
  key: string;
  name: string;
  image: { full: string };
}

interface DDragonChampionList {
  data: Record<string, DDragonChampion>;
}

interface CharacterEntry {
  id: string;
  displayName: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  verified: boolean;
  metadata?: Record<string, unknown>;
}

/** Normalizes a champion display name for fuzzy matching across punctuation/spacing quirks. */
function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’.]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  return (await res.json()) as T;
}

async function main() {
  const roster: string[] = JSON.parse(readFileSync(ROSTER_PATH, "utf-8"));

  const versions = await fetchJson<string[]>(
    "https://ddragon.leagueoflegends.com/api/versions.json"
  );
  const version = versions[0];

  const champions = await fetchJson<DDragonChampionList>(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`
  );

  const byNormalizedName = new Map<string, DDragonChampion>();
  for (const champ of Object.values(champions.data)) {
    byNormalizedName.set(normalize(champ.name), champ);
  }

  const catalog: CharacterEntry[] = [];
  const unverified: string[] = [];

  for (const displayName of roster) {
    const match = byNormalizedName.get(normalize(displayName));
    if (match) {
      catalog.push({
        id: match.id,
        displayName,
        // Matchup screen uses the "loading" splash crop; tier list uses the compact square icon.
        imageUrl: `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${match.id}_0.jpg`,
        thumbnailUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${match.image.full}`,
        verified: true,
        metadata: {
          key: match.key,
          ddragonVersion: version,
        },
      });
    } else {
      catalog.push({
        id: normalize(displayName),
        displayName,
        imageUrl: null,
        thumbnailUrl: null,
        verified: false,
      });
      unverified.push(displayName);
    }
  }

  const ids = new Set(catalog.map((c) => c.id));
  if (ids.size !== catalog.length) {
    throw new Error("Duplicate catalog ids generated — resolve collisions before proceeding.");
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(CATALOG_OUT, JSON.stringify(catalog, null, 2));
  writeFileSync(
    REPORT_OUT,
    JSON.stringify({ ddragonVersion: version, unverifiedCount: unverified.length, unverified }, null, 2)
  );

  console.log(`Resolved ${catalog.length - unverified.length}/${catalog.length} champions (version ${version}).`);
  if (unverified.length) {
    console.log(`Unverified (kept, flagged): ${unverified.join(", ")}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
