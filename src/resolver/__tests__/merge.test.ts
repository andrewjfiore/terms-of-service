import { describe, expect, it } from 'vitest';
import { buildBaseConfig } from '../../data/defaults';
import { TIERS } from '../../data/devices';
import { applyOverride, mergeCsvKv } from '../merge';

describe('mergeCsvKv', () => {
  it('unions key=value lists, later value wins, position kept', () => {
    expect(mergeCsvKv('WINEDEBUG=-all', 'WINE_LARGE_ADDRESS_AWARE=1')).toBe(
      'WINEDEBUG=-all,WINE_LARGE_ADDRESS_AWARE=1'
    );
    expect(mergeCsvKv('a=1,b=2', 'b=9,c=3')).toBe('a=1,b=9,c=3');
  });
});

describe('applyOverride', () => {
  it('shallow-merges nested config maps instead of replacing', () => {
    const base = buildBaseConfig(TIERS.A);
    const next = applyOverride(base, {
      dxwrapperConfig: { async: '1' },
    });
    expect(next.dxwrapperConfig.async).toBe('1');
    // pre-existing keys survive
    expect(next.dxwrapperConfig.framerate).toBe('0');
    // original not mutated
    expect(base.dxwrapperConfig.async).toBeUndefined();
  });

  it('union-merges envVars additively', () => {
    const base = buildBaseConfig(TIERS.A);
    const next = applyOverride(base, {
      envVars: 'MESA_EXTENSION_MAX_YEAR=2003',
    });
    expect(next.envVars).toContain('WINEDEBUG=-all');
    expect(next.envVars).toContain('MESA_EXTENSION_MAX_YEAR=2003');
  });
});
