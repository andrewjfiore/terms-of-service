import type { ConfigOverride } from '../types/container';
import type { CuratedGame, Tier } from '../types/domain';

// Stage 1 (fast path): collapse a curated entry's shared + per-tier overrides
// into a single override. Per-tier wins over shared.
export function curatedOverride(
  game: CuratedGame,
  tier: Tier
): ConfigOverride {
  const shared = game.shared ?? {};
  const perTier = game.perTier?.[tier] ?? {};
  return {
    ...shared,
    ...perTier,
    graphicsDriverConfig: {
      ...(shared.graphicsDriverConfig ?? {}),
      ...(perTier.graphicsDriverConfig ?? {}),
    },
    dxwrapperConfig: {
      ...(shared.dxwrapperConfig ?? {}),
      ...(perTier.dxwrapperConfig ?? {}),
    },
    extras: { ...(shared.extras ?? {}), ...(perTier.extras ?? {}) },
  };
}
