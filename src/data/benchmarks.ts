import type { FpsRow } from '../types/domain';
import { titlesMatch } from './textMatch';

// Ryan Retro cross-device FPS grid (research Section 2, "Snapshot — May 2026").
// IMPORTANT: per ryanretro.com/benchmarks methodology, these are "'eyeballed'
// FPS averages observed during active gameplay ... not captured using
// scientific frame-time analysis tools." Treat as a device-tier signal only.
export const BENCHMARK_DEVICE_COLUMNS: { id: string; label: string }[] = [
  { id: 'retroid-pocket-5', label: 'Retroid Pocket 5 (SD 865)' },
  { id: 'retroid-pocket-g2', label: 'Retroid Pocket G2 (8 Gen 2)' },
  { id: 'ayn-odin-2-portal', label: 'AYN Odin 2 Portal (8 Gen 2)' },
  { id: 'konkr-pocket-fit', label: 'Konkr Pocket Fit (8 Gen 3)' },
  { id: 'samsung-fold-7', label: 'Samsung Fold 7 (8 Elite)' },
  { id: 'ayn-odin-3', label: 'AYN Odin 3 (8 Elite)' },
  { id: 'steam-deck', label: 'Steam Deck (reference)' },
];

const COLS = BENCHMARK_DEVICE_COLUMNS.map((c) => c.id);

function row(title: string, vals: (number | null)[]): FpsRow {
  const fps: Record<string, number | null> = {};
  COLS.forEach((id, i) => (fps[id] = vals[i] ?? null));
  return { title, fps };
}

export const BENCHMARKS: FpsRow[] = [
  row('Cuphead', [130, 175, null, 280, 140, 318, 60]),
  row('Cyberpunk 2077', [null, 11, 15, 16, 7, 14, 30]),
  row('Elden Ring', [11, 15, 19, 25, 5, 30, 40]),
  row('Grand Theft Auto V', [20, 44, 47, 57, null, 67, 76]),
  row('Hades II', [51, 67, null, 124, 105, 190, 150]),
  row('Hollow Knight: Silksong', [80, 120, null, 190, 122, 220, 250]),
  row('The Elder Scrolls V: Skyrim (LE/SE)', [25, 36, 57, 57, 47, 57, 60]),
  row('The Witcher 3: Wild Hunt (Next-Gen)', [14, 30, 42, 35, 41, 75, null]),
  row('Pokémon Sword (Open)', [30, 33, 50, 53, 50, 68, null]),
  row('Slay the Spire', [110, 115, 142, 145, 200, 240, null]),
];

export function findBenchmark(title: string): FpsRow | undefined {
  return BENCHMARKS.find((r) => titlesMatch(r.title, title));
}

export const BENCHMARK_CAVEAT =
  "Ryan Retro figures are 'eyeballed' averages observed during gameplay, not captured with frame-time tools. Use as a tier signal, not ground truth for a specific build.";
