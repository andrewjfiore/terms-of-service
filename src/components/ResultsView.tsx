import { useState } from 'react';
import type { ResolveResult } from '../types/domain';

const SUMMARY_FIELDS: [string, (r: ResolveResult) => string][] = [
  ['Container variant', (r) => r.config.containerVariant],
  ['Wine / Proton', (r) => r.config.wineVersion],
  ['Emulator', (r) => `${r.config.emulator} (${r.config.fexcorePreset})`],
  [
    'Graphics driver',
    (r) => `${r.config.graphicsDriver} · ${r.config.graphicsDriverVersion}`,
  ],
  ['DX wrapper', (r) => r.config.dxwrapper],
  ['Render size', (r) => r.config.screenSize],
  [
    'Sharpening',
    (r) =>
      r.config.extras.sharpnessEffect === 'CAS'
        ? `CAS ${r.config.extras.sharpnessLevel}`
        : 'off',
  ],
  [
    'Frame gen (LSFG)',
    (r) => (r.config.extras.lsfgEnabled === 'true' ? 'on' : 'off'),
  ],
];

const LEVEL_STYLE = {
  error: 'border-bad/50 bg-bad/10 text-red-200',
  warning: 'border-warn/50 bg-warn/10 text-amber-200',
  info: 'border-edge bg-panel2 text-slate-300',
} as const;

export function ResultsView({ result }: { result: ResolveResult }) {
  const [copied, setCopied] = useState(false);

  const download = () => {
    const blob = new Blob([result.json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.config.name || 'MyContainer'}.container`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(result.json);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const errors = result.messages.filter((m) => m.level === 'error');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip">
          Resolver path:{' '}
          <strong className="text-slate-100">{result.source}</strong>
        </span>
        {result.matchedCuratedId && (
          <span className="chip">curated: {result.matchedCuratedId}</span>
        )}
        {!!result.appliedRuleIds.length && (
          <span className="chip">
            {result.appliedRuleIds.length} heuristic rule(s)
          </span>
        )}
        {!!errors.length && (
          <span className="chip !border-bad !text-bad">
            {errors.length} blocking issue(s)
          </span>
        )}
      </div>

      <div className="card">
        <div className="mb-3 text-sm font-semibold text-slate-200">
          Resolved settings
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
          {SUMMARY_FIELDS.map(([k, get]) => (
            <div key={k}>
              <div className="text-xs text-slate-500">{k}</div>
              <div className="text-sm text-slate-100">{get(result)}</div>
            </div>
          ))}
        </div>
      </div>

      {!!result.messages.length && (
        <div className="space-y-2">
          {result.messages.map((m, i) => (
            <div
              key={i}
              className={`rounded-lg border px-3 py-2 text-sm ${LEVEL_STYLE[m.level]}`}
            >
              <span className="mr-2 font-semibold uppercase">{m.level}</span>
              {m.text}
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-200">
            GameNative .container export
          </span>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={copy}>
              {copied ? 'Copied' : 'Copy JSON'}
            </button>
            <button className="btn-primary" onClick={download}>
              Download .container
            </button>
          </div>
        </div>
        <pre className="max-h-96 overflow-auto rounded-lg bg-ink p-4 text-xs leading-relaxed text-slate-300">
          {result.json}
        </pre>
        <p className="mt-2 text-xs text-slate-500">
          Import via GameNative → Edit Container → Import config. This tool
          ships an offline snapshot; check gamenative.app/compatibility and
          EmuReady.com for the latest community data.
        </p>
      </div>
    </div>
  );
}
