import { ANTICHEATS, DRMS, ENGINES, GRAPHICS_APIS } from '../types/enums';
import type { CuratedGame } from '../types/domain';
import raw from './games.json';
import { slug } from './textMatch';

const ENGINE_SET = new Set<string>(ENGINES);
const API_SET = new Set<string>(GRAPHICS_APIS);
const DRM_SET = new Set<string>(DRMS);
const AC_SET = new Set<string>(ANTICHEATS);

// Validates and loads the curated DB. Throws on a malformed entry so a bad
// hand-added title fails loudly rather than silently misconfiguring a game.
function validate(entry: unknown, i: number): CuratedGame {
  const g = entry as Record<string, unknown>;
  const where = `games[${i}] (${String(g.title ?? g.id ?? '?')})`;
  const need = (cond: boolean, msg: string) => {
    if (!cond) throw new Error(`Invalid curated game ${where}: ${msg}`);
  };
  need(typeof g.id === 'string' && !!g.id, 'missing id');
  need(typeof g.title === 'string' && !!g.title, 'missing title');
  need(Array.isArray(g.aliases), 'aliases must be an array');
  need(ENGINE_SET.has(g.engine as string), `unknown engine "${g.engine}"`);
  need(
    API_SET.has(g.primaryAPI as string),
    `unknown primaryAPI "${g.primaryAPI}"`
  );
  need(
    g.drm === undefined || DRM_SET.has(g.drm as string),
    `unknown drm "${g.drm}"`
  );
  need(
    g.anticheat === undefined || AC_SET.has(g.anticheat as string),
    `unknown anticheat "${g.anticheat}"`
  );
  need(
    g.bitness === 32 || g.bitness === 64 || g.bitness === '32->64',
    `bad bitness "${g.bitness}"`
  );
  need(typeof g.year === 'number', 'year must be a number');
  return g as unknown as CuratedGame;
}

export const CURATED_GAMES: CuratedGame[] = (
  raw as { games: unknown[] }
).games.map(validate);

export function findCuratedGame(query: string): CuratedGame | undefined {
  const q = slug(query);
  if (!q) return undefined;
  return CURATED_GAMES.find(
    (g) =>
      slug(g.title) === q ||
      g.id === query ||
      g.aliases.some((a) => slug(a) === q)
  );
}

export function searchCuratedGames(query: string, limit = 8): CuratedGame[] {
  const q = slug(query);
  if (!q) return CURATED_GAMES.slice(0, limit);
  return CURATED_GAMES.filter(
    (g) =>
      slug(g.title).includes(q) || g.aliases.some((a) => slug(a).includes(q))
  ).slice(0, limit);
}
