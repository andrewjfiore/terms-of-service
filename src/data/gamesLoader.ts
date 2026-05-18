import type { CuratedGame } from '../types/domain';
import raw from './games.json';

const ENGINES = new Set([
  'Unity',
  'Unreal-3',
  'Unreal-4',
  'Unreal-5',
  'Source',
  'Source-2',
  'RE-Engine',
  'RAGE',
  'Frostbite',
  'Creation',
  'REDengine',
  'id-Tech',
  'CryEngine',
  'LibGDX',
  'GameMaker',
  'RPG-Maker',
  'SAGE',
  'proprietary',
]);
const APIS = new Set([
  'DirectDraw',
  'DX9',
  'DX10',
  'DX11',
  'DX12',
  'OpenGL',
  'Vulkan',
]);

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
  need(ENGINES.has(g.engine as string), `unknown engine "${g.engine}"`);
  need(APIS.has(g.primaryAPI as string), `unknown primaryAPI "${g.primaryAPI}"`);
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

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function findCuratedGame(query: string): CuratedGame | undefined {
  const q = norm(query);
  if (!q) return undefined;
  return CURATED_GAMES.find(
    (g) =>
      norm(g.title) === q ||
      g.id === query ||
      g.aliases.some((a) => norm(a) === q)
  );
}

export function searchCuratedGames(query: string, limit = 8): CuratedGame[] {
  const q = norm(query);
  if (!q) return CURATED_GAMES.slice(0, limit);
  return CURATED_GAMES.filter(
    (g) =>
      norm(g.title).includes(q) ||
      g.aliases.some((a) => norm(a).includes(q))
  ).slice(0, limit);
}
