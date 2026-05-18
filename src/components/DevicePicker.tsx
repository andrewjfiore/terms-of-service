import { useMemo, useState } from 'react';
import { DEVICES, TIERS } from '../data/devices';
import { TIER_ORDER } from '../types/enums';
import type { Device } from '../types/domain';

export function DevicePicker({
  value,
  onChange,
}: {
  value: Device | null;
  onChange: (d: Device) => void;
}) {
  const [q, setQ] = useState('');

  const grouped = useMemo(() => {
    const needle = q.toLowerCase().trim();
    const out: Record<string, Device[]> = {};
    for (const d of DEVICES) {
      if (needle && !d.name.toLowerCase().includes(needle)) continue;
      (out[d.tier] ??= []).push(d);
    }
    return out;
  }, [q]);

  const tierInfo = value ? TIERS[value.tier] : null;

  return (
    <div className="space-y-4">
      <input
        className="input"
        placeholder="Search devices (e.g. Odin 3, Retroid, Pixel)…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="max-h-72 space-y-4 overflow-y-auto pr-1">
        {TIER_ORDER.filter((t) => grouped[t]?.length).map((t) => (
          <div key={t}>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {TIERS[t].label} · {TIERS[t].soc}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {grouped[t].map((d) => {
                const active = value?.id === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => onChange(d)}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      active
                        ? 'border-accent bg-accent/10 text-white'
                        : 'border-edge bg-panel2 text-slate-200 hover:border-accent/60'
                    }`}
                  >
                    {d.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {!Object.keys(grouped).length && (
          <p className="text-sm text-slate-500">
            No device matches. You can still pick one from another tier or
            search a different term.
          </p>
        )}
      </div>

      {tierInfo && (
        <div className="card !bg-panel2">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="chip">Tier {tierInfo.tier}</span>
            <span className="chip">{tierInfo.gpu}</span>
            <span className="chip">{tierInfo.ram} RAM</span>
            <span className="chip">
              {tierInfo.defaultVariant} ·{' '}
              {tierInfo.hasAArch32 ? 'has AArch32' : 'no AArch32'}
            </span>
          </div>
          <p className="text-sm text-slate-400">{tierInfo.notes}</p>
        </div>
      )}
    </div>
  );
}
