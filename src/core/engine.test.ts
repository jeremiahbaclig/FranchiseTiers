import { describe, it, expect } from "vitest";
import { initTournament, recordWinner, resolveBye, undo, isComplete } from "./engine";
import { generateTiers } from "./tiers";
import { WIN_CAP } from "./constants";
import type { TournamentState, Decision } from "./tournamentTypes";

const FIXTURE_4 = ["A", "B", "C", "D"];
const FIXTURE_5 = ["A", "B", "C", "D", "E"];

function playOut(state: TournamentState, pickWinner: (d: Extract<Decision, { type: "matchup" }>) => string): TournamentState {
  let s = state;
  let guard = 0;
  while (!isComplete(s) && guard++ < 1000) {
    const d = s.currentDecision!;
    if (d.type === "matchup") {
      s = recordWinner(s, d.matchup.id, pickWinner(d));
    } else {
      s = resolveBye(s, d.bye.id, "eliminate");
    }
  }
  return s;
}

describe("engine: initial records", () => {
  it("starts everyone at 0-0, not eliminated", () => {
    const state = initTournament("fixture", FIXTURE_4, 1);
    for (const id of FIXTURE_4) {
      expect(state.records[id]).toEqual({ id, wins: 0, losses: 0, eliminated: false });
    }
  });
});

describe("engine: win/loss updates", () => {
  it("increments exactly one win and one loss per matchup, no duplicates", () => {
    const state = initTournament("fixture", FIXTURE_4, 1);
    const d = state.currentDecision;
    expect(d?.type).toBe("matchup");
    const matchup = (d as Extract<Decision, { type: "matchup" }>).matchup;
    const next = recordWinner(state, matchup.id, matchup.leftId);
    expect(next.records[matchup.leftId].wins).toBe(1);
    expect(next.records[matchup.rightId].losses).toBe(1);
    expect(next.records[matchup.leftId].losses).toBe(0);
    expect(next.records[matchup.rightId].wins).toBe(0);
  });

  it("rejects recording a winner twice for the same matchup", () => {
    const state = initTournament("fixture", FIXTURE_4, 1);
    const matchup = (state.currentDecision as Extract<Decision, { type: "matchup" }>).matchup;
    const next = recordWinner(state, matchup.id, matchup.leftId);
    expect(() => recordWinner(next, matchup.id, matchup.leftId)).toThrow();
  });
});

describe("engine: elimination", () => {
  it("eliminates a character immediately at 2 losses and never rematches them", () => {
    let state = initTournament("fixture", FIXTURE_4, 7);
    const seenMatchupsForEliminated = new Set<string>();
    let eliminatedId: string | null = null;

    let guard = 0;
    while (!isComplete(state) && guard++ < 500) {
      const d = state.currentDecision!;
      if (d.type === "bye") {
        state = resolveBye(state, d.bye.id, "eliminate");
        continue;
      }
      const { matchup } = d;
      if (eliminatedId && (matchup.leftId === eliminatedId || matchup.rightId === eliminatedId)) {
        seenMatchupsForEliminated.add(matchup.id);
      }
      // Always make leftId lose to drive someone toward elimination deterministically.
      state = recordWinner(state, matchup.id, matchup.rightId);
      const loser = state.records[matchup.leftId];
      if (loser.eliminated && !eliminatedId) eliminatedId = matchup.leftId;
    }
    expect(seenMatchupsForEliminated.size).toBe(0);
    const anyEliminated = Object.values(state.records).some((r) => r.eliminated);
    expect(anyEliminated).toBe(true);
    for (const r of Object.values(state.records)) {
      expect(r.losses).toBeLessThanOrEqual(2);
      if (r.eliminated) expect(r.losses).toBe(2);
    }
  });
});

describe("engine: odd-sized groups / byes", () => {
  it("surfaces a bye decision for a leftover character and lets the user resolve it", () => {
    const state = initTournament("fixture", FIXTURE_5, 3);
    // With 5 characters, round 1 pairs 4 and leaves one bye (queued after matchups).
    let s = state;
    let sawBye = false;
    let guard = 0;
    while (!isComplete(s) && guard++ < 200) {
      const d = s.currentDecision!;
      if (d.type === "bye") {
        sawBye = true;
        s = resolveBye(s, d.bye.id, "advance");
      } else {
        s = recordWinner(s, d.matchup.id, d.matchup.leftId);
      }
    }
    expect(sawBye).toBe(true);
  });
});

describe("engine: completion and tiers", () => {
  it("completes the tournament and produces a top tier and eliminated bottom tier", () => {
    const state = initTournament("fixture", FIXTURE_4, 42);
    const final = playOut(state, (d) => d.matchup.leftId);
    expect(isComplete(final)).toBe(true);

    const tiers = generateTiers(final.records);
    const top = tiers[0];
    const bottom = tiers[tiers.length - 1];
    expect(top.label).toBe("Top Tier");
    for (const id of top.characterIds) {
      const r = final.records[id];
      expect(r.losses === 0 || r.wins >= WIN_CAP).toBe(true);
    }
    expect(bottom.label).toBe("Eliminated");
    for (const id of bottom.characterIds) {
      expect(final.records[id].eliminated).toBe(true);
      expect(final.records[id].losses).toBe(2);
    }
  });

  it("every character appears exactly once across all tiers", () => {
    const state = initTournament("fixture", FIXTURE_5, 99);
    const final = playOut(state, (d) => d.matchup.rightId);
    const tiers = generateTiers(final.records);
    const seen = tiers.flatMap((t) => t.characterIds);
    expect(new Set(seen).size).toBe(seen.length);
    expect(new Set(seen)).toEqual(new Set(FIXTURE_5));
  });

  it("places a character in the top tier once it reaches the win cap, even with a loss", () => {
    const roster = ["CHAMP", "B", "C", "D", "E", "F", "G", "H"];
    let state = initTournament("fixture", roster, 11);
    let champLostOnce = false;
    let guard = 0;

    while (!isComplete(state) && guard++ < 2000) {
      const d = state.currentDecision!;
      if (d.type === "bye") {
        state = resolveBye(state, d.bye.id, d.bye.characterId === "CHAMP" ? "advance" : "eliminate");
        continue;
      }
      const { matchup } = d;
      const involvesChamp = matchup.leftId === "CHAMP" || matchup.rightId === "CHAMP";
      if (involvesChamp && !champLostOnce) {
        // Deliberately lose once so CHAMP can only qualify for the top tier via the win cap, not zero losses.
        const opponent = matchup.leftId === "CHAMP" ? matchup.rightId : matchup.leftId;
        state = recordWinner(state, matchup.id, opponent);
        champLostOnce = true;
      } else if (involvesChamp) {
        state = recordWinner(state, matchup.id, "CHAMP");
      } else {
        state = recordWinner(state, matchup.id, matchup.leftId);
      }
      if (state.records.CHAMP.wins >= WIN_CAP) break;
    }

    expect(state.records.CHAMP.wins).toBeGreaterThanOrEqual(WIN_CAP);
    expect(state.records.CHAMP.losses).toBeGreaterThanOrEqual(1);
    const tiers = generateTiers(state.records);
    const top = tiers.find((t) => t.id === "top");
    expect(top?.characterIds).toContain("CHAMP");
  });
});


describe("engine: matchmaking fairness", () => {
  it("never lets one survivor's total games played get far ahead of another's", () => {
    const roster = Array.from({ length: 12 }, (_, i) => `P${i}`);
    let state = initTournament("fixture", roster, 7);
    let guard = 0;

    while (!isComplete(state) && guard++ < 500) {
      const d = state.currentDecision!;
      if (d.type === "bye") {
        state = resolveBye(state, d.bye.id, "advance");
        continue;
      }
      state = recordWinner(state, d.matchup.id, d.matchup.leftId);

      const totals = Object.values(state.records)
        .filter((r) => !r.eliminated && r.wins < WIN_CAP)
        .map((r) => r.wins + r.losses);
      if (totals.length > 1) {
        expect(Math.max(...totals) - Math.min(...totals)).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("engine: undo and restart", () => {
  it("restores the exact previous state including records and current decision", () => {
    const state = initTournament("fixture", FIXTURE_4, 1);
    const matchup = (state.currentDecision as Extract<Decision, { type: "matchup" }>).matchup;
    const afterWin = recordWinner(state, matchup.id, matchup.leftId);
    const restored = undo(afterWin);

    expect(restored.records).toEqual(state.records);
    expect(restored.currentDecision).toEqual(state.currentDecision);
    expect(restored.history).toEqual(state.history);
  });
});

describe("engine: determinism", () => {
  it("produces identical matchup ordering for the same seed and roster", () => {
    const a = initTournament("fixture", FIXTURE_5, 123);
    const b = initTournament("fixture", FIXTURE_5, 123);
    const resultA = playOut(a, (d) => d.matchup.leftId);
    const resultB = playOut(b, (d) => d.matchup.leftId);
    expect(resultA.history.map((m) => `${m.leftId}-${m.rightId}`)).toEqual(
      resultB.history.map((m) => `${m.leftId}-${m.rightId}`)
    );
  });
});

describe("engine: no 2-2 state", () => {
  it("never lets a character reach more than 2 losses or stay active at 2 losses", () => {
    const state = initTournament("fixture", FIXTURE_4, 17);
    const final = playOut(state, (d) => d.matchup.leftId);
    for (const r of Object.values(final.records)) {
      expect(r.losses).toBeLessThanOrEqual(2);
      if (r.losses === 2) expect(r.eliminated).toBe(true);
    }
  });
});
