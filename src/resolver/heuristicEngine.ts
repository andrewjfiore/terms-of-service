import { HEURISTIC_RULES } from '../data/heuristics';
import type { ConfigOverride } from '../types/container';
import type {
  GameMeta,
  HeuristicCondition,
  Message,
  Tier,
} from '../types/domain';

function inSet<T>(want: T | T[] | undefined, have: T): boolean {
  if (want === undefined) return true;
  return Array.isArray(want) ? want.includes(have) : want === have;
}

function matches(
  cond: HeuristicCondition,
  tier: Tier,
  game: GameMeta
): boolean {
  return (
    inSet(cond.tier, tier) &&
    inSet(cond.engine, game.engine) &&
    inSet(cond.primaryAPI, game.primaryAPI) &&
    inSet(cond.drm, game.drm) &&
    inSet(cond.anticheat, game.anticheat) &&
    inSet(cond.bitness, game.bitness) &&
    (cond.yearBefore === undefined || game.year < cond.yearBefore) &&
    (cond.yearAfter === undefined || game.year > cond.yearAfter)
  );
}

export interface HeuristicResult {
  overrides: ConfigOverride[];
  messages: Message[];
  ruleIds: string[];
}

// Stage 2 (fallback): walk the ordered rule list. Overrides are applied in
// order by the resolver (later engine/DRM rules intentionally refine the
// generic API rule), accumulating any attached messages.
export function runHeuristics(tier: Tier, game: GameMeta): HeuristicResult {
  const overrides: ConfigOverride[] = [];
  const messages: Message[] = [];
  const ruleIds: string[] = [];
  for (const rule of HEURISTIC_RULES) {
    if (!matches(rule.if, tier, game)) continue;
    ruleIds.push(rule.id);
    if (Object.keys(rule.then).length) overrides.push(rule.then);
    if (rule.message) messages.push(rule.message);
  }
  return { overrides, messages, ruleIds };
}
