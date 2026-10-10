/** Image source abstraction so future franchises can plug in different providers. */
export interface ImageSourceConfig {
  /** Human-readable identifier for the provider, e.g. "data-dragon". */
  providerId: string;
  /** Base URL used by the resolver/manifest-generation script for this franchise. */
  baseUrl: string;
}

/** A single selectable item in a franchise's roster. Franchise-agnostic. */
export interface CharacterEntry {
  /** Stable identity, independent of display name changes. */
  id: string;
  displayName: string;
  /** Primary image used on the matchup screen. */
  imageUrl: string | null;
  /** Compact image used in dense views like the tier list; falls back to imageUrl when absent. */
  thumbnailUrl?: string | null;
  aliases?: string[];
  /** False when the entry could not be cross-referenced against the official source. */
  verified?: boolean;
  metadata?: Record<string, unknown>;
}

export interface Franchise {
  id: string;
  displayName: string;
  description: string;
  logoUrl?: string;
  imageSource: ImageSourceConfig;
  catalog: CharacterEntry[];
}
