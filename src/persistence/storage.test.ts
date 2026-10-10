import { describe, it, expect, beforeEach } from "vitest";
import { saveTournament, loadTournament, clearTournament } from "./storage";
import { initTournament } from "../core/engine";

describe("persistence", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips a valid tournament state", () => {
    const state = initTournament("fixture", ["A", "B", "C", "D"], 1);
    saveTournament("fixture", state);
    const loaded = loadTournament();
    expect(loaded?.franchiseId).toBe("fixture");
    expect(loaded?.state.records).toEqual(state.records);
  });

  it("returns null for malformed saved data instead of throwing", () => {
    localStorage.setItem("franchise-tiers:tournament", "{not json");
    expect(() => loadTournament()).not.toThrow();
    expect(loadTournament()).toBeNull();
  });

  it("returns null for an outdated schema version", () => {
    localStorage.setItem(
      "franchise-tiers:tournament",
      JSON.stringify({ schemaVersion: 0, franchiseId: "fixture", state: {} })
    );
    expect(loadTournament()).toBeNull();
  });

  it("clears saved data", () => {
    const state = initTournament("fixture", ["A", "B"], 1);
    saveTournament("fixture", state);
    clearTournament();
    expect(loadTournament()).toBeNull();
  });
});
