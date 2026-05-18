import { buildBaseConfig } from '../data/defaults';
import { TIERS } from '../data/devices';
import { CURATED_GAMES, findCuratedGame } from '../data/gamesLoader';
import { applyPriority } from '../data/priorities';
import type { ConfigOverride } from '../types/container';
import type {
  Message,
  ResolveInput,
  ResolveResult,
} from '../types/domain';
import { curatedOverrides } from './curated';
import { runHeuristics } from './heuristicEngine';
import { applyOverride, applyOverrides } from './merge';
import { toExport, toJson } from './serialize';
import { validate } from './validate';

function sanitizeName(title: string): string {
  const s = title.replace(/[^A-Za-z0-9 _-]+/g, '').trim().slice(0, 48);
  return s || 'MyContainer';
}

function dedupe(messages: Message[]): Message[] {
  const seen = new Set<string>();
  return messages.filter((m) => {
    const k = `${m.level}:${m.text}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// Three-stage resolver:
//   base (tier defaults)
//   -> stage 1 curated  OR  stage 2 heuristics
//   -> user-priority overlay
//   -> stage 3 validation (auto-corrections + messages)
//   -> serialize to .container
export function resolve(input: ResolveInput): ResolveResult {
  const tier = TIERS[input.device.tier];
  let config = buildBaseConfig(tier);
  config = applyOverride(config, { name: sanitizeName(input.gameTitle) });

  const messages: Message[] = [];
  const appliedRuleIds: string[] = [];

  // ---- Stage 1: curated fast path ----
  // Respect the explicit selection: an id-matched pick uses that entry; a
  // manual-metadata entry NEVER falls onto the curated path even if its title
  // collides with a curated game; otherwise fall back to a title lookup.
  const curated = input.curatedId
    ? CURATED_GAMES.find((g) => g.id === input.curatedId)
    : input.manual
      ? undefined
      : findCuratedGame(input.gameTitle);
  let source: ResolveResult['source'];
  let matchedCuratedId: string | undefined;

  if (curated) {
    source = 'curated';
    matchedCuratedId = curated.id;
    config = applyOverrides(config, curatedOverrides(curated, tier.tier));
    messages.push({
      level: 'info',
      text: `Matched curated profile "${curated.title}"${
        curated.notes ? ` — ${curated.notes}` : ''
      }`,
    });
  } else {
    // ---- Stage 2: heuristic fallback ----
    source = 'heuristic';
    const h = runHeuristics(tier.tier, input.game);
    config = applyOverrides(config, h.overrides);
    messages.push(...h.messages);
    appliedRuleIds.push(...h.ruleIds);
    messages.push({
      level: 'info',
      text: 'No curated profile — configuration derived from the heuristics engine using the supplied game metadata.',
    });
  }

  // ---- User priority overlay ----
  const ctx = {
    tier: tier.tier,
    resolutionScalePct: input.resolutionScalePct ?? 100,
    sharpnessLevel: input.sharpnessLevel ?? 35,
    frameGenEnabled: input.frameGenEnabled ?? false,
  };
  const priorityOverrides: ConfigOverride[] = [];
  for (const p of input.priorities) {
    const r = applyPriority(p, ctx);
    priorityOverrides.push(r.override);
    messages.push(...r.messages);
  }
  config = applyOverrides(config, priorityOverrides);

  // ---- Stage 3: validation ----
  const v = validate(config, input.device, tier, input.game);
  config = v.config;
  messages.push(...v.messages);

  return {
    config,
    exportObject: toExport(config),
    json: toJson(config),
    source,
    matchedCuratedId,
    appliedRuleIds,
    messages: dedupe(messages),
  };
}
