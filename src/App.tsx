import { useMemo, useState } from "react";
import { FranchiseSelect } from "./components/FranchiseSelect";
import { MatchupScreen } from "./components/MatchupScreen";
import { RecordsPanel } from "./components/RecordsPanel";
import { useCatalogIndex } from "./hooks/useCatalogIndex";
import { TierList } from "./components/TierList";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { getFranchise } from "./franchises/registry";
import { useTournament } from "./hooks/useTournament";
import { saveTournament, loadTournament, clearTournament } from "./persistence/storage";
import type { TournamentState } from "./core/tournamentTypes";
import "./App.css";

function TournamentView({ franchiseId, onExit }: { franchiseId: string; onExit: () => void }) {
  const franchise = getFranchise(franchiseId)!;
  const catalogIds = useMemo(() => franchise.catalog.map((c) => c.id), [franchise]);
  const catalogById = useCatalogIndex(franchise.catalog);

  // Always start fresh and randomized; a saved game is only resumed if the user opts in below.
  const [initialSeed] = useState(() => Date.now());

  const { state, tiers, completed, canUndo, pickWinner, resolveCurrentBye, undoLast, restart, setFavoriteId, loadState } =
    useTournament(franchiseId, catalogIds, initialSeed);

  const [confirmingRestart, setConfirmingRestart] = useState(false);
  // Offer to resume a saved game for this franchise, computed once at mount instead of auto-loading it.
  const [resumeOffer, setResumeOffer] = useState<TournamentState | null>(() => {
    const loaded = loadTournament();
    return loaded && loaded.franchiseId === franchiseId ? loaded.state : null;
  });
  const [savedNotice, setSavedNotice] = useState(false);

  const matchupNumber = state.history.length + 1;

  function handleRestartConfirmed() {
    clearTournament();
    restart(Date.now());
    setConfirmingRestart(false);
  }

  function handleResumeConfirmed() {
    if (resumeOffer) loadState(resumeOffer);
    setResumeOffer(null);
  }

  function handleResumeDeclined() {
    clearTournament();
    setResumeOffer(null);
  }

  function handleSave() {
    saveTournament(franchiseId, state);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 1600);
  }

  return (
    <div className="tournament-view">
      <div className="tournament-view__header">
        {franchise.logoUrl && <img src={franchise.logoUrl} alt="" className="tournament-view__logo" />}
        <h2>{franchise.displayName}</h2>
      </div>

      <div className="tournament-view__toolbar">
        <button onClick={onExit}>Change franchise</button>
        <button onClick={undoLast} disabled={!canUndo}>
          Undo
        </button>
        <button onClick={handleSave}>{savedNotice ? "Saved ✓" : "Save"}</button>
        <button onClick={() => setConfirmingRestart(true)}>Restart</button>
      </div>

      {!completed && state.currentDecision && (
        <div className="tournament-view__layout">
          <MatchupScreen
            decision={state.currentDecision}
            catalogById={catalogById}
            records={state.records}
            onPickWinner={pickWinner}
            onResolveBye={resolveCurrentBye}
            matchupNumber={matchupNumber}
          />
          <RecordsPanel catalogById={catalogById} records={state.records} />
        </div>
      )}

      {completed && (
        <TierList
          tiers={tiers}
          catalogById={catalogById}
          records={state.records}
          favoriteId={state.favoriteId}
          onSelectFavorite={setFavoriteId}
          onRestart={() => setConfirmingRestart(true)}
        />
      )}

      {confirmingRestart && (
        <ConfirmDialog
          message="Discard current progress and start a fresh tournament?"
          onConfirm={handleRestartConfirmed}
          onCancel={() => setConfirmingRestart(false)}
        />
      )}

      {resumeOffer && (
        <ConfirmDialog
          message="Resume your saved tournament in progress?"
          onConfirm={handleResumeConfirmed}
          onCancel={handleResumeDeclined}
        />
      )}
    </div>
  );
}

function App() {
  const [franchiseId, setFranchiseId] = useState<string | null>(null);

  if (!franchiseId) {
    return <FranchiseSelect onSelect={setFranchiseId} />;
  }

  return <TournamentView franchiseId={franchiseId} onExit={() => setFranchiseId(null)} />;
}

export default App;

