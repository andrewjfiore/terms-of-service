import type { ConfigOverride, WorkingConfig } from '../types/container';

// Union-merge two comma-separated `key=value` lists (envVars, wincomponents).
// Existing keys keep position; later value wins. This is what gives heuristic /
// priority overrides their additive "envVars+" behaviour.
export function mergeCsvKv(base: string, add: string): string {
  const map = new Map<string, string>();
  const ingest = (s: string) => {
    s.split(',')
      .map((p) => p.trim())
      .filter(Boolean)
      .forEach((p) => {
        const i = p.indexOf('=');
        if (i === -1) map.set(p, '');
        else map.set(p.slice(0, i), p.slice(i + 1));
      });
  };
  ingest(base);
  ingest(add);
  return [...map.entries()]
    .map(([k, v]) => (v === '' ? k : `${k}=${v}`))
    .join(',');
}

const CSV_KV_FIELDS = new Set(['envVars', 'wincomponents']);
const NESTED_FIELDS = new Set(['graphicsDriverConfig', 'dxwrapperConfig']);

// Nested config maps + extras shallow-merge; envVars/wincomponents
// union-merge; every other field is a straight replace. Returns a new object.
export function applyOverride(
  config: WorkingConfig,
  ov: ConfigOverride
): WorkingConfig {
  const next: WorkingConfig = {
    ...config,
    graphicsDriverConfig: { ...config.graphicsDriverConfig },
    dxwrapperConfig: { ...config.dxwrapperConfig },
    extras: { ...config.extras },
  };

  for (const [key, value] of Object.entries(ov)) {
    if (value === undefined) continue;
    if (NESTED_FIELDS.has(key)) {
      const k = key as 'graphicsDriverConfig' | 'dxwrapperConfig';
      next[k] = { ...next[k], ...(value as Record<string, string>) };
    } else if (key === 'extras') {
      next.extras = { ...next.extras, ...(value as object) };
    } else if (CSV_KV_FIELDS.has(key)) {
      const k = key as 'envVars' | 'wincomponents';
      next[k] = mergeCsvKv(next[k], value as string);
    } else {
      (next as Record<string, unknown>)[key] = value;
    }
  }
  return next;
}

export function applyOverrides(
  config: WorkingConfig,
  ovs: (ConfigOverride | undefined)[]
): WorkingConfig {
  return ovs.reduce<WorkingConfig>(
    (acc, ov) => (ov ? applyOverride(acc, ov) : acc),
    config
  );
}
