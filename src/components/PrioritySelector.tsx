import { PRIORITY_DEFS } from '../data/priorities';
import type { Priority } from '../types/domain';
import { Field, Slider, Toggle } from './ui/controls';

export interface PriorityState {
  priorities: Priority[];
  resolutionScalePct: number;
  sharpnessLevel: number;
  frameGenEnabled: boolean;
}

export function PrioritySelector({
  value,
  onChange,
}: {
  value: PriorityState;
  onChange: (s: PriorityState) => void;
}) {
  const toggle = (p: Priority) => {
    const has = value.priorities.includes(p);
    onChange({
      ...value,
      priorities: has
        ? value.priorities.filter((x) => x !== p)
        : [...value.priorities, p],
    });
  };

  const showUpscale = value.priorities.includes('upscaling');

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Pick one or more. Later selections win on conflicting fields — order
        them by importance.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {PRIORITY_DEFS.map((d) => {
          const active = value.priorities.includes(d.id);
          const rank = value.priorities.indexOf(d.id);
          return (
            <button
              key={d.id}
              onClick={() => toggle(d.id)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                active
                  ? 'border-accent bg-accent/10'
                  : 'border-edge bg-panel2 hover:border-accent/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-100">
                  {d.label}
                </span>
                {active && (
                  <span className="chip !border-accent !text-accent">
                    #{rank + 1}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">{d.blurb}</p>
            </button>
          );
        })}
      </div>

      {showUpscale && (
        <div className="card !bg-panel2 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Upscaling controls (CAS — not DLSS/FSR)
          </div>
          <Field
            label={`Resolution scale — ${value.resolutionScalePct}% of panel native`}
            hint="Drives screenSize. Lower = render fewer pixels, then sharpen up."
          >
            <Slider
              value={value.resolutionScalePct}
              min={50}
              max={100}
              step={5}
              suffix="%"
              onChange={(resolutionScalePct) =>
                onChange({ ...value, resolutionScalePct })
              }
            />
          </Field>
          <Field
            label={`Sharpness — CAS level ${value.sharpnessLevel}`}
            hint="Drives extras.sharpnessLevel. ~30–50 is the recommended range."
          >
            <Slider
              value={value.sharpnessLevel}
              min={0}
              max={100}
              step={5}
              onChange={(sharpnessLevel) =>
                onChange({ ...value, sharpnessLevel })
              }
            />
          </Field>
          <Toggle
            checked={value.frameGenEnabled}
            onChange={(frameGenEnabled) =>
              onChange({ ...value, frameGenEnabled })
            }
            label="Frame Generation (requires Lossless Scaling — Steam app 993090)"
          />
          <p className="text-xs text-slate-500">
            LSFG-VK is frame interpolation, not upscaling. It is Bionic-only,
            uses your own Lossless Scaling licence, and adds ≥1 frame of
            latency.
          </p>
        </div>
      )}
    </div>
  );
}
