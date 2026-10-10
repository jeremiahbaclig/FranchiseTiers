import type { Franchise } from "../core/types";
import lolCatalog from "./lol/catalog.generated.json";
import lolLogo from "../assets/lol-logo.png";

const leagueOfLegends: Franchise = {
  id: "league-of-legends",
  displayName: "League of Legends",
  description: "Rank 173 champions head-to-head",
  logoUrl: lolLogo,
  imageSource: { providerId: "data-dragon", baseUrl: "https://ddragon.leagueoflegends.com" },
  catalog: lolCatalog as Franchise["catalog"],
};

/** All registered franchises; the franchise-selection UI must read from this, not hardcode LoL. */
export const FRANCHISE_REGISTRY: Franchise[] = [leagueOfLegends];

export function getFranchise(id: string): Franchise | undefined {
  return FRANCHISE_REGISTRY.find((f) => f.id === id);
}
