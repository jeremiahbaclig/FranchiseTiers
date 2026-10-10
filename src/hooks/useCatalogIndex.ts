import { useMemo } from "react";
import type { CharacterEntry } from "../core/types";

export function useCatalogIndex(catalog: CharacterEntry[]): Map<string, CharacterEntry> {
  return useMemo(() => new Map(catalog.map((c) => [c.id, c])), [catalog]);
}
