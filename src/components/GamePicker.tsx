import { useMemo, useState } from 'react';
import {
  BENCHMARK_CAVEAT,
  BENCHMARK_DEVICE_COLUMNS,
  findBenchmark,
} from '../data/benchmarks';
import { searchCuratedGames } from '../data/gamesLoader';
import {
  ANTICHEATS,
  DRMS,
  ENGINES,
  GRAPHICS_APIS,
} from '../types/enums';
import type { Bitness, Device, GameMeta } from '../types/domain';
import { Field, Select } from './ui/controls';

const DEFAULT_META: GameMeta = {
  engine: 'Unity',
  primaryAPI: 'DX11',
  bitness: 64,
  drm: 'Steam-DRM',
  anticheat: 'none',
  year: 2022,
};

const BITNESS_MAP: Record<string, Bitness> = {
  '32': 32,
  '64': 64,
  '32->64': '32->64',
};

export interface GameSelection {
  title: string;
  meta: GameMeta;
  curatedId?: string;
  manual?: boolean;
}

const opts = <T extends string | number>(xs: readonly T[]) =>
  xs.map((x) => ({ value: x, label: String(x) }));

export function GamePicker({
  device,
  value,
  onChange,
}: {
  device: Device | null;
  value: GameSelection | null;
  onChange: (s: GameSelection) => void;
}) {
  const [q, setQ] = useState(value?.title ?? '');
  const [manual, setManual] = useState(false);
  const meta = value?.meta ?? DEFAULT_META;

  const results = useMemo(() => searchCuratedGames(q), [q]);
  const bench = value && device ? findBenchmark(value.title) : undefined;

  const pickCurated = (id: string) => {
    const g = results.find((r) => r.id === id);
    if (!g) return;
    setQ(g.title);
    setManual(false);
    onChange({
      title: g.title,
      curatedId: g.id,
      meta: {
        engine: g.engine,
        primaryAPI: g.primaryAPI,
        bitness: g.bitness,
        drm: g.drm,
        anticheat: g.anticheat,
        year: g.year,
      },
    });
  };

  const commitManual = (next: GameMeta, title: string) => {
    onChange({ title: title || 'Custom Game', meta: next, manual: true });
  };

  return (
    <div className="space-y-4">
      <input
        className="input"
        placeholder="Type a game title…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          if (manual) commitManual(meta, e.target.value);
        }}
      />

      {!manual && (
        <div className="max-h-56 space-y-1 overflow-y-auto">
          {results.map((g) => (
            <button
              key={g.id}
              onClick={() => pickCurated(g.id)}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                value?.curatedId === g.id
                  ? 'border-accent bg-accent/10 text-white'
                  : 'border-edge bg-panel2 text-slate-200 hover:border-accent/60'
              }`}
            >
              <span>{g.title}</span>
              <span className="text-xs text-slate-500">
                {g.engine} · {g.primaryAPI} · {g.year}
              </span>
            </button>
          ))}
          {!results.length && (
            <p className="text-sm text-slate-500">
              No curated match for “{q}”.
            </p>
          )}
        </div>
      )}

      <button
        className="text-xs text-accent hover:underline"
        onClick={() => {
          const nextManual = !manual;
          setManual(nextManual);
          if (nextManual) commitManual(meta, q);
        }}
      >
        {manual
          ? '← Back to curated search'
          : "Game not listed? Enter its metadata manually →"}
      </button>

      {manual && (
        <div className="card !bg-panel2 grid grid-cols-2 gap-3">
          <Field label="Engine">
            <Select
              value={meta.engine}
              options={opts(ENGINES)}
              onChange={(engine) => commitManual({ ...meta, engine }, q)}
            />
          </Field>
          <Field label="Primary graphics API">
            <Select
              value={meta.primaryAPI}
              options={opts(GRAPHICS_APIS)}
              onChange={(primaryAPI) =>
                commitManual({ ...meta, primaryAPI }, q)
              }
            />
          </Field>
          <Field label="Bitness">
            <Select
              value={String(meta.bitness)}
              options={[
                { value: '64', label: '64-bit' },
                { value: '32', label: '32-bit' },
                { value: '32->64', label: '32→64 (mixed)' },
              ]}
              onChange={(v) =>
                commitManual({ ...meta, bitness: BITNESS_MAP[v] ?? 64 }, q)
              }
            />
          </Field>
          <Field label="Release year">
            <input
              type="number"
              className="input"
              value={meta.year}
              onChange={(e) =>
                commitManual({ ...meta, year: Number(e.target.value) }, q)
              }
            />
          </Field>
          <Field label="DRM">
            <Select
              value={meta.drm}
              options={opts(DRMS)}
              onChange={(drm) => commitManual({ ...meta, drm }, q)}
            />
          </Field>
          <Field label="Anti-cheat">
            <Select
              value={meta.anticheat}
              options={opts(ANTICHEATS)}
              onChange={(anticheat) =>
                commitManual({ ...meta, anticheat }, q)
              }
            />
          </Field>
        </div>
      )}

      {bench && device && (
        <div className="card !bg-panel2">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Ryan Retro FPS snapshot
          </div>
          <div className="flex flex-wrap gap-2">
            {BENCHMARK_DEVICE_COLUMNS.map((c) => {
              const fps = bench.fps[c.id];
              const isThis = c.id === device.id;
              return (
                <span
                  key={c.id}
                  className={`chip ${isThis ? '!border-accent !text-accent' : ''}`}
                >
                  {c.label}: {fps == null ? '—' : `${fps} fps`}
                </span>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-500">{BENCHMARK_CAVEAT}</p>
        </div>
      )}
    </div>
  );
}
