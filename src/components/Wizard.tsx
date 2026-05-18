import { useMemo, useState } from 'react';
import { resolve } from '../resolver/resolve';
import type { Device } from '../types/domain';
import { DevicePicker } from './DevicePicker';
import { GamePicker, type GameSelection } from './GamePicker';
import { PrioritySelector, type PriorityState } from './PrioritySelector';
import { ResultsView } from './ResultsView';

const STEPS = ['Device', 'Game', 'Priorities', 'Result'];

export function Wizard() {
  const [step, setStep] = useState(0);
  const [device, setDevice] = useState<Device | null>(null);
  const [game, setGame] = useState<GameSelection | null>(null);
  const [prio, setPrio] = useState<PriorityState>({
    priorities: [],
    resolutionScalePct: 100,
    sharpnessLevel: 35,
    frameGenEnabled: false,
  });

  const result = useMemo(() => {
    if (!device || !game) return null;
    return resolve({
      device,
      game: game.meta,
      gameTitle: game.title,
      priorities: prio.priorities,
      resolutionScalePct: prio.resolutionScalePct,
      sharpnessLevel: prio.sharpnessLevel,
      frameGenEnabled: prio.frameGenEnabled,
    });
  }, [device, game, prio]);

  const canNext =
    (step === 0 && !!device) ||
    (step === 1 && !!game) ||
    step === 2 ||
    step === 3;

  return (
    <div className="space-y-6">
      <ol className="flex items-center gap-2 text-sm">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <button
              onClick={() => i <= step && setStep(i)}
              disabled={i > step}
              className={`flex h-7 items-center gap-2 rounded-full px-3 ${
                i === step
                  ? 'bg-accent text-ink'
                  : i < step
                    ? 'bg-panel2 text-slate-200'
                    : 'bg-panel2 text-slate-600'
              }`}
            >
              <span className="text-xs font-bold">{i + 1}</span>
              {s}
            </button>
            {i < STEPS.length - 1 && (
              <span className="text-slate-700">→</span>
            )}
          </li>
        ))}
      </ol>

      <div className="card">
        {step === 0 && (
          <DevicePicker value={device} onChange={setDevice} />
        )}
        {step === 1 && (
          <GamePicker device={device} value={game} onChange={setGame} />
        )}
        {step === 2 && (
          <PrioritySelector value={prio} onChange={setPrio} />
        )}
        {step === 3 && result && <ResultsView result={result} />}
        {step === 3 && !result && (
          <p className="text-sm text-slate-500">
            Pick a device and game first.
          </p>
        )}
      </div>

      <div className="flex justify-between">
        <button
          className="btn-ghost"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          Back
        </button>
        <button
          className="btn-primary"
          disabled={!canNext || step === 3}
          onClick={() => setStep((s) => Math.min(3, s + 1))}
        >
          {step === 2 ? 'Build config' : 'Next'}
        </button>
      </div>
    </div>
  );
}
