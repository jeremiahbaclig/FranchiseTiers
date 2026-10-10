import type { TournamentState } from "../core/tournamentTypes";

const SCHEMA_VERSION = 1;
const STORAGE_KEY = "franchise-tiers:tournament";

interface PersistedShape {
  schemaVersion: number;
  franchiseId: string;
  state: TournamentState;
}

function isValidPersistedShape(value: unknown): value is PersistedShape {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (v.schemaVersion !== SCHEMA_VERSION) return false;
  if (typeof v.franchiseId !== "string") return false;
  const state = v.state as Record<string, unknown> | undefined;
  if (!state || typeof state !== "object") return false;
  if (typeof state.seed !== "number") return false;
  if (typeof state.records !== "object" || state.records === null) return false;
  if (!Array.isArray(state.history)) return false;
  if (!Array.isArray(state.undoStack)) return false;
  return true;
}

export function saveTournament(franchiseId: string, state: TournamentState): void {
  const payload: PersistedShape = { schemaVersion: SCHEMA_VERSION, franchiseId, state };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage can fail (quota, private mode); losing persistence is non-fatal.
  }
}

/** Returns null when nothing is saved or saved data is malformed/outdated, never throws. */
export function loadTournament(): { franchiseId: string; state: TournamentState } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isValidPersistedShape(parsed)) return null;
    return { franchiseId: parsed.franchiseId, state: parsed.state };
  } catch {
    return null;
  }
}

export function clearTournament(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore — nothing to clear if storage is unavailable.
  }
}
