import { CharacterImage } from "./CharacterImage";
import type { CharacterEntry } from "../core/types";
import type { CharacterRecord, TierList as TierListType } from "../core/tournamentTypes";

interface TierListProps {
  tiers: TierListType;
  catalogById: Map<string, CharacterEntry>;
  records: Record<string, CharacterRecord>;
  favoriteId: string | null;
  onSelectFavorite: (id: string) => void;
  onRestart: () => void;
}

export function TierList({ tiers, catalogById, records, favoriteId, onSelectFavorite, onRestart }: TierListProps) {
  const topTier = tiers.find((t) => t.id === "top");

  return (
    <div className="tier-list">
      <h1>Final tier list</h1>
      {tiers.map((tier) => (
        <div key={tier.id} className="tier-row" style={{ borderColor: tier.color }}>
          <div className="tier-row__label" style={{ background: tier.color }}>
            {tier.label}
          </div>
          <div className="tier-row__characters">
            {tier.characterIds.map((id) => {
              const entry = catalogById.get(id);
              const record = records[id];
              const canFavorite = topTier?.characterIds.includes(id) ?? false;
              const isFavorite = favoriteId === id;
              return (
                <button
                  key={id}
                  className={`tier-character ${isFavorite ? "tier-character--favorite" : ""}`}
                  onClick={() => canFavorite && onSelectFavorite(id)}
                  disabled={!canFavorite}
                  title={canFavorite ? "Set as ultimate favorite" : undefined}
                >
                  <CharacterImage src={entry?.thumbnailUrl ?? entry?.imageUrl ?? null} alt={entry?.displayName ?? id} />
                  <span>{entry?.displayName ?? id}</span>
                  <span className="tier-character__record">
                    {record ? `${record.wins}-${record.losses}` : ""}
                  </span>
                  {isFavorite && <span className="tier-character__star">★</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <button className="tier-list__restart" onClick={onRestart}>
        Restart tournament
      </button>
    </div>
  );
}
