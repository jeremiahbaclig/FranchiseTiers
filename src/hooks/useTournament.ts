import { useCallback, useMemo, useState } from "react";
import { initTournament, recordWinner, resolveBye, undo, isComplete } from "../core/engine";
import { generateTiers } from "../core/tiers";
import type { TournamentState } from "../core/tournamentTypes";

/** Wires the pure tournament engine into React state; holds no tournament rules itself. */
export function useTournament(franchiseId: string, characterIds: string[], seed: number) {
  const [state, setState] = useState<TournamentState>(() => initTournament(franchiseId, characterIds, seed));

  const pickWinner = useCallback((winnerId: string) => {
    setState((s) => {
      if (!s.currentDecision || s.currentDecision.type !== "matchup") return s;
      return recordWinner(s, s.currentDecision.matchup.id, winnerId);
    });
  }, []);

  const resolveCurrentBye = useCallback((resolution: "advance" | "eliminate") => {
    setState((s) => {
      if (!s.currentDecision || s.currentDecision.type !== "bye") return s;
      return resolveBye(s, s.currentDecision.bye.id, resolution);
    });
  }, []);

  const undoLast = useCallback(() => setState((s) => undo(s)), []);

  const restart = useCallback(
    (newSeed: number) => setState(initTournament(franchiseId, characterIds, newSeed)),
    [franchiseId, characterIds]
  );

  const setFavoriteId = useCallback((id: string | null) => {
    setState((s) => ({ ...s, favoriteId: id }));
  }, []);

  const loadState = useCallback((saved: TournamentState) => setState(saved), []);

  const tiers = useMemo(() => (isComplete(state) ? generateTiers(state.records) : []), [state]);

  return {
    state,
    tiers,
    completed: isComplete(state),
    canUndo: state.undoStack.length > 0,
    pickWinner,
    resolveCurrentBye,
    undoLast,
    restart,
    setFavoriteId,
    loadState,
  };
}
