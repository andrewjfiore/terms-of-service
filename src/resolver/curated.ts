import type { ConfigOverride } from '../types/container';
import type { CuratedGame, Tier } from '../types/domain';

// Stage 1 (fast path): the curated entry contributes two override layers —
// shared first, then the per-tier refinement. Returning them as a list lets
// applyOverrides do the nested-map and envVars/wincomponents merging, so the
// behaviour matches the heuristic path exactly.
export function curatedOverrides(
  game: CuratedGame,
  tier: Tier
): (ConfigOverride | undefined)[] {
  return [game.shared, game.perTier?.[tier]];
}
