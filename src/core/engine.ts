import type {
  CharacterRecord,
  Decision,
  Matchup,
  TournamentSnapshot,
  TournamentState,
} from "./tournamentTypes";
import { MAX_LOSSES, WIN_CAP } from "./constants";

/** Deterministic PRNG (mulberry32) so a given seed always produces the same shuffle order. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const rand = mulberry32(seed);
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("|");
}

function cloneRecords(records: Record<string, CharacterRecord>): Record<string, CharacterRecord> {
  const copy: Record<string, CharacterRecord> = {};
  for (const [id, r] of Object.entries(records)) copy[id] = { ...r };
  return copy;
}

/** Snapshot the mutable parts of state so undo can restore it exactly. */
function snapshot(state: TournamentState): TournamentSnapshot {
  return {
    franchiseId: state.franchiseId,
    seed: state.seed,
    rngCounter: state.rngCounter,
    records: cloneRecords(state.records),
    history: state.history.map((m) => ({ ...m })),
    queue: state.queue.map((d) => structuredCloneDecision(d)),
    currentDecision: state.currentDecision ? structuredCloneDecision(state.currentDecision) : null,
    completed: state.completed,
    favoriteId: state.favoriteId,
  };
}

function structuredCloneDecision(d: Decision): Decision {
  return d.type === "matchup" ? { type: "matchup", matchup: { ...d.matchup } } : { type: "bye", bye: { ...d.bye } };
}

function playedPairs(history: Matchup[]): Set<string> {
  const set = new Set<string>();
  for (const m of history) {
    if (m.rightId) set.add(pairKey(m.leftId, m.rightId));
  }
  return set;
}

/** Characters still eligible to be matched: not eliminated and not already locked into the top tier. */
function getEligibleSurvivors(records: Record<string, CharacterRecord>): CharacterRecord[] {
  return Object.values(records).filter((r) => !r.eliminated && r.wins < WIN_CAP);
}

function totalGames(r: CharacterRecord): number {
  return r.wins + r.losses;
}

/** Builds the next batch of decisions, prioritizing whoever has played the fewest total games. */
function buildRound(
  records: Record<string, CharacterRecord>,
  history: Matchup[],
  seed: number,
  rngCounter: number
): { queue: Decision[]; rngCounter: number } {
  const eligible = getEligibleSurvivors(records);
  if (eligible.length < 2) {
    return { queue: [], rngCounter };
  }

  const played = playedPairs(history);
  let counter = rngCounter;

  // Shuffle first (for tie-breaking), then sort by total games played so nobody falls behind.
  const shuffled = seededShuffle(eligible, seed + counter);
  counter++;
  const sorted = [...shuffled].sort((a, b) => totalGames(a) - totalGames(b));

  const queue: Decision[] = [];
  const unpaired = [...sorted];

  function findOpponentIndex(a: CharacterRecord): number {
    const sameRecordUnplayed = unpaired.findIndex(
      (b) => b.wins === a.wins && b.losses === a.losses && !played.has(pairKey(a.id, b.id))
    );
    if (sameRecordUnplayed !== -1) return sameRecordUnplayed;

    const sameGamesUnplayed = unpaired.findIndex(
      (b) => totalGames(b) === totalGames(a) && !played.has(pairKey(a.id, b.id))
    );
    if (sameGamesUnplayed !== -1) return sameGamesUnplayed;

    const anyUnplayed = unpaired.findIndex((b) => !played.has(pairKey(a.id, b.id)));
    if (anyUnplayed !== -1) return anyUnplayed;

    const sameRecord = unpaired.findIndex((b) => b.wins === a.wins && b.losses === a.losses);
    if (sameRecord !== -1) return sameRecord;

    return 0;
  }

  while (unpaired.length > 1) {
    const a = unpaired.shift()!;
    const idx = findOpponentIndex(a);
    const b = unpaired.splice(idx, 1)[0];
    queue.push({
      type: "matchup",
      matchup: { id: `m-${a.id}-${b.id}-${history.length}-${queue.length}`, leftId: a.id, rightId: b.id },
    });
  }
  if (unpaired.length === 1) {
    queue.push({ type: "bye", bye: { id: `bye-${unpaired[0].id}-${history.length}`, characterId: unpaired[0].id } });
  }

  return { queue, rngCounter: counter };
}


function advanceQueue(state: TournamentState): void {
  if (state.queue.length > 0) {
    state.currentDecision = state.queue.shift()!;
    return;
  }
  const { queue, rngCounter } = buildRound(state.records, state.history, state.seed, state.rngCounter);
  state.rngCounter = rngCounter;
  state.queue = queue;
  if (queue.length === 0) {
    state.currentDecision = null;
    state.completed = true;
  } else {
    state.currentDecision = state.queue.shift()!;
  }
}

export function initTournament(franchiseId: string, characterIds: string[], seed: number): TournamentState {
  const records: Record<string, CharacterRecord> = {};
  for (const id of characterIds) {
    records[id] = { id, wins: 0, losses: 0, eliminated: false };
  }
  const state: TournamentState = {
    franchiseId,
    seed,
    rngCounter: 0,
    records,
    history: [],
    queue: [],
    currentDecision: null,
    undoStack: [],
    completed: characterIds.length === 0,
    favoriteId: null,
  };
  if (!state.completed) advanceQueue(state);
  return state;
}

function pushUndoSnapshot(state: TournamentState): void {
  state.undoStack = [...state.undoStack, snapshot(state)];
}

/** Records the winner of the current matchup; throws if it doesn't match the engine's current decision. */
export function recordWinner(state: TournamentState, matchupId: string, winnerId: string): TournamentState {
  if (!state.currentDecision || state.currentDecision.type !== "matchup") {
    throw new Error("No active matchup to record a winner for.");
  }
  const { matchup } = state.currentDecision;
  if (matchup.id !== matchupId) throw new Error("matchupId does not match the current matchup.");
  if (winnerId !== matchup.leftId && winnerId !== matchup.rightId) {
    throw new Error("winnerId must be one of the current matchup's participants.");
  }

  const next: TournamentState = { ...state, records: cloneRecords(state.records), history: [...state.history] };
  pushUndoSnapshot(next);

  const loserId = winnerId === matchup.leftId ? matchup.rightId : matchup.leftId;
  const winnerRecord = next.records[winnerId];
  const loserRecord = next.records[loserId!];
  winnerRecord.wins += 1;
  loserRecord.losses += 1;
  if (loserRecord.losses >= MAX_LOSSES) loserRecord.eliminated = true;

  next.history.push({ ...matchup, winnerId });
  advanceQueue(next);
  return next;
}

/** Resolves a bye for an odd-group leftover: user decides whether it counts as a win or a loss. */
export function resolveBye(state: TournamentState, byeId: string, resolution: "advance" | "eliminate"): TournamentState {
  if (!state.currentDecision || state.currentDecision.type !== "bye") {
    throw new Error("No active bye to resolve.");
  }
  const { bye } = state.currentDecision;
  if (bye.id !== byeId) throw new Error("byeId does not match the current bye.");

  const next: TournamentState = { ...state, records: cloneRecords(state.records), history: [...state.history] };
  pushUndoSnapshot(next);

  const record = next.records[bye.characterId];
  if (resolution === "advance") {
    record.wins += 1;
  } else {
    record.losses += 1;
    if (record.losses >= MAX_LOSSES) record.eliminated = true;
  }

  advanceQueue(next);
  return next;
}

/** Restores the exact state prior to the last recorded decision. */
export function undo(state: TournamentState): TournamentState {
  if (state.undoStack.length === 0) return state;
  const prev = state.undoStack[state.undoStack.length - 1];
  return { ...prev, undoStack: state.undoStack.slice(0, -1) };
}

export function isComplete(state: TournamentState): boolean {
  return state.completed;
}

export function setFavorite(state: TournamentState, characterId: string | null): TournamentState {
  return { ...state, favoriteId: characterId };
}
