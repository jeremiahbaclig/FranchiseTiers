/** Per-tournament-session record, never stored in the permanent catalog. */
export interface CharacterRecord {
  id: string;
  wins: number;
  losses: number;
  eliminated: boolean;
}

export interface Matchup {
  id: string;
  leftId: string;
  rightId: string;
  /** Present once a winner has been recorded for this matchup. */
  winnerId?: string;
}

/** A leftover character in an odd-sized group, resolved manually by the user. */
export interface ByeDecision {
  id: string;
  characterId: string;
}

export type Decision =
  | { type: "matchup"; matchup: Matchup }
  | { type: "bye"; bye: ByeDecision };

export interface TournamentState {
  franchiseId: string;
  seed: number;
  /** Advances each time the engine reshuffles a group; keeps reshuffles deterministic per seed. */
  rngCounter: number;
  records: Record<string, CharacterRecord>;
  history: Matchup[];
  /** Decisions generated for the current round but not yet presented. */
  queue: Decision[];
  currentDecision: Decision | null;
  /** Snapshots for undo, most recent last. */
  undoStack: TournamentSnapshot[];
  completed: boolean;
  favoriteId: string | null;
}

/** Deep-cloned slice of TournamentState captured before each decision, for exact undo. */
export type TournamentSnapshot = Omit<TournamentState, "undoStack">;

export interface Tier {
  id: string;
  label: string;
  /** CSS color, green->yellow->orange->red gradient position. */
  color: string;
  characterIds: string[];
}

export type TierList = Tier[];

