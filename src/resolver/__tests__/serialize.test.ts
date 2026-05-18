import { describe, expect, it } from 'vitest';
import { buildBaseConfig } from '../../data/defaults';
import { TIERS } from '../../data/devices';
import { applyOverride } from '../merge';
import { toExport, toJson } from '../serialize';

describe('serialize', () => {
  it('collapses nested config maps to comma-separated key=value strings', () => {
    let c = buildBaseConfig(TIERS.A);
    c = applyOverride(c, {
      dxwrapperConfig: { version: '2.4.1-gplasync', async: '1' },
    });
    const out = toExport(c);
    expect(typeof out.dxwrapperConfig).toBe('string');
    expect(out.dxwrapperConfig).toContain('version=2.4.1-gplasync');
    expect(out.dxwrapperConfig).toContain('async=1');
    expect(out.dxwrapperConfig).toContain('framerate=0');
  });

  it('keeps extras as a string map and produces valid JSON', () => {
    const c = buildBaseConfig(TIERS.A);
    const json = toJson(c);
    const parsed = JSON.parse(json);
    expect(parsed.extras.sharpnessEffect).toBe('None');
    expect(typeof parsed.graphicsDriverConfig).toBe('string');
    expect(parsed.containerVariant).toBe('bionic');
  });
});
