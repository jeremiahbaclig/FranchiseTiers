import { useState } from "react";
import { CharacterImage } from "./CharacterImage";
import type { CharacterEntry } from "../core/types";
import type { CharacterRecord, Decision } from "../core/tournamentTypes";

interface MatchupScreenProps {
  decision: Decision;
  catalogById: Map<string, CharacterEntry>;
  records: Record<string, CharacterRecord>;
  onPickWinner: (winnerId: string) => void;
  onResolveBye: (resolution: "advance" | "eliminate") => void;
  matchupNumber: number;
}

export function MatchupScreen({
  decision,
  catalogById,
  records,
  onPickWinner,
  onResolveBye,
  matchupNumber,
}: MatchupScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (decision.type === "bye") {
    const char = catalogById.get(decision.bye.characterId);
    return (
      <div className="matchup-screen matchup-screen--bye">
        <p className="matchup-screen__progress">Matchup {matchupNumber} — odd one out</p>
        <h2>No opponent available this round for {char?.displayName ?? decision.bye.characterId}</h2>
        <CharacterImage src={char?.imageUrl ?? null} alt={char?.displayName ?? ""} />
        <div className="matchup-screen__bye-actions">
          <button onClick={() => onResolveBye("advance")}>Advance (win)</button>
          <button onClick={() => onResolveBye("eliminate")}>Count as a loss</button>
        </div>
      </div>
    );
  }

  const { matchup } = decision;
  const left = catalogById.get(matchup.leftId);
  const right = catalogById.get(matchup.rightId!);

  function handlePick(id: string) {
    if (selectedId) return;
    setSelectedId(id);
    window.setTimeout(() => {
      onPickWinner(id);
      setSelectedId(null);
    }, 450);
  }

  function renderCard(entry: CharacterEntry | undefined, id: string) {
    const record = records[id];
    const isSelected = selectedId === id;
    const isLoser = selectedId !== null && !isSelected;
    return (
      <button
        key={id}
        className={`matchup-card ${isSelected ? "matchup-card--selected" : ""} ${isLoser ? "matchup-card--loser" : ""}`}
        onClick={() => handlePick(id)}
        disabled={selectedId !== null}
      >
        <CharacterImage src={entry?.imageUrl ?? null} alt={entry?.displayName ?? id} />
        <span className="matchup-card__name">{entry?.displayName ?? id}</span>
        <span className="matchup-card__record">
          {record ? `${record.wins}-${record.losses}` : ""}
        </span>
        <span className="matchup-card__hint" aria-hidden="true">
          Pick to advance
        </span>
        {isSelected && <span className="matchup-card__overlay matchup-card__overlay--win">✓</span>}
        {isLoser && <span className="matchup-card__overlay matchup-card__overlay--loss">✕</span>}
      </button>
    );
  }

  return (
    <div className="matchup-screen">
      <p className="matchup-screen__progress">Matchup {matchupNumber}</p>
      <div className="matchup-screen__pair">
        {renderCard(left, matchup.leftId)}
        {renderCard(right, matchup.rightId!)}
      </div>
    </div>
  );
}

