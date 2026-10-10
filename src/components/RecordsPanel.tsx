import type { CharacterEntry } from "../core/types";
import type { CharacterRecord } from "../core/tournamentTypes";

interface RecordsPanelProps {
  catalogById: Map<string, CharacterEntry>;
  records: Record<string, CharacterRecord>;
}

function recordIcon(record: CharacterRecord): string {
  if (record.eliminated) return "💀";
  if (record.losses === 0 && record.wins > 0) return "🔥";
  if (record.wins === 0 && record.losses === 0) return "⚔️";
  return "🛡️";
}

/** Always-visible scoreboard so records are available without covering the matchup images. */
export function RecordsPanel({ catalogById, records }: RecordsPanelProps) {
  const sorted = Object.values(records).sort((a, b) => {
    if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.losses - b.losses;
  });

  return (
    <details className="records-panel" open>
      <summary className="records-panel__title">📊 Scoreboard</summary>
      <ul className="records-panel__list">
        {sorted.map((r) => {
          const entry = catalogById.get(r.id);
          return (
            <li key={r.id} className={`records-panel__row ${r.eliminated ? "records-panel__row--eliminated" : ""}`}>
              <span className="records-panel__icon" aria-hidden="true">
                {recordIcon(r)}
              </span>
              <span className="records-panel__name">{entry?.displayName ?? r.id}</span>
              <span className="records-panel__record">
                {r.wins}-{r.losses}
              </span>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
