/** Tier color gradient, green (best) to red (eliminated). */
import type { CharacterRecord } from "./tournamentTypes";
import type { Tier, TierList } from "./tournamentTypes";
import { WIN_CAP } from "./constants";

const TIER_COLORS = ["#2ecc71", "#a3d977", "#f1c40f", "#e67e22", "#e74c3c"];

/** Pure function: derives a tier list purely from final records, independent of render order. */
export function generateTiers(records: Record<string, CharacterRecord>): TierList {
  const entries = Object.values(records);

  // Zero losses OR hitting the win cap both guarantee a top-tier finish, regardless of the other stat.
  const topTier = entries.filter((r) => !r.eliminated && (r.losses === 0 || r.wins >= WIN_CAP));
  const eliminated = entries.filter((r) => r.eliminated);
  const remaining = entries.filter((r) => !r.eliminated && r.losses > 0 && r.wins < WIN_CAP);

  // Group remaining by wins-losses record, ordered best to worst.
  const remainingByRecord = new Map<string, CharacterRecord[]>();
  for (const r of remaining) {
    const key = `${r.wins}-${r.losses}`;
    if (!remainingByRecord.has(key)) remainingByRecord.set(key, []);
    remainingByRecord.get(key)!.push(r);
  }
  const sortedKeys = [...remainingByRecord.keys()].sort((a, b) => {
    const [aw, al] = a.split("-").map(Number);
    const [bw, bl] = b.split("-").map(Number);
    if (al !== bl) return al - bl;
    return bw - aw;
  });

  const middleTiers: Tier[] = sortedKeys.map((key, i) => ({
    id: `record-${key}`,
    label: `Record ${key}`,
    color: TIER_COLORS[Math.min(1 + i, TIER_COLORS.length - 2)],
    characterIds: remainingByRecord.get(key)!.map((r) => r.id).sort(),
  }));

  const tiers: Tier[] = [];
  if (topTier.length) {
    tiers.push({
      id: "top",
      label: "Top Tier",
      color: TIER_COLORS[0],
      characterIds: topTier.map((r) => r.id).sort(),
    });
  }
  tiers.push(...middleTiers);
  if (eliminated.length) {
    tiers.push({
      id: "eliminated",
      label: "Eliminated",
      color: TIER_COLORS[TIER_COLORS.length - 1],
      characterIds: eliminated.map((r) => r.id).sort(),
    });
  }
  return tiers;
}
