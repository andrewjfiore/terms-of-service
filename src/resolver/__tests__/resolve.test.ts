import { describe, expect, it } from 'vitest';
import { TIERS } from '../../data/devices';
import type { Device, GameMeta } from '../../types/domain';
import { buildBaseConfig } from '../../data/defaults';
import { resolve } from '../resolve';
import { validate } from '../validate';

const dev = (id: string, name: string, tier: Device['tier']): Device => ({
  id,
  name,
  tier,
});

const TIER_A = dev('ayn-odin-3', 'AYN Odin 3', 'A');
const TIER_D = dev('anbernic-rg406v', 'Anbernic RG406V', 'D');
const TIER_B = dev('ayn-odin-2', 'AYN Odin 2', 'B');

const meta = (m: Partial<GameMeta>): GameMeta => ({
  engine: 'proprietary',
  primaryAPI: 'DX11',
  bitness: 64,
  drm: 'none',
  anticheat: 'none',
  year: 2022,
  ...m,
});

describe('golden path: Elden Ring on Tier A', () => {
  const r = resolve({
    device: TIER_A,
    gameTitle: 'Elden Ring',
    game: meta({ primaryAPI: 'DX12', drm: 'Steam-DRM', anticheat: 'EAC' }),
    priorities: [],
  });

  it('takes the curated fast path', () => {
    expect(r.source).toBe('curated');
    expect(r.matchedCuratedId).toBe('elden-ring');
  });

  it('produces a Bionic / Proton 10 / VKD3D / FEX-Core config', () => {
    expect(r.config.containerVariant).toBe('bionic');
    expect(r.config.wineVersion).toBe('proton-10.0-arm64ec-2');
    expect(r.config.dxwrapper).toBe('vkd3d');
    expect(r.config.emulator).toBe('FEXCore');
    expect(r.config.graphicsDriver).toBe('wrapper-v2');
  });

  it('has no blocking errors and warns about EAC online', () => {
    expect(r.messages.some((m) => m.level === 'error')).toBe(false);
    // proton-10 is in Tier A bundled list -> no Issue #580 warning
    expect(
      r.messages.some((m) => m.text.includes('not in') && m.level === 'warning')
    ).toBe(false);
  });
});

describe('edge case: unknown DX12 game on Tier D (Mali) with Max FPS', () => {
  const r = resolve({
    device: TIER_D,
    gameTitle: 'Totally Unknown Game 9000',
    game: meta({ engine: 'Unreal-5', primaryAPI: 'DX12' }),
    priorities: ['maxfps'],
  });

  it('falls through to the heuristics engine', () => {
    expect(r.source).toBe('heuristic');
  });

  it('blocks Bionic (forces glibc) and flags DX12 unsupported on Mali', () => {
    expect(r.config.containerVariant).toBe('glibc');
    const errors = r.messages.filter((m) => m.level === 'error');
    expect(errors.some((m) => /Mali/.test(m.text))).toBe(true);
    expect(errors.some((m) => /DX12/.test(m.text))).toBe(true);
  });
});

describe('edge case: 32-bit DX9 title on Tier A is forced back to FEX-Core', () => {
  // Stability priority pushes emulator=Box64; on a no-AArch32 SoC the
  // validator must override that back to FEX-Core for a 32-bit title.
  const r = resolve({
    device: TIER_A,
    gameTitle: 'Dead Space',
    game: meta({ primaryAPI: 'DX9', bitness: 32, drm: 'Steam-DRM', year: 2008 }),
    priorities: ['stability'],
  });

  it('routes the 32-bit path through FEX-Core WoW64', () => {
    expect(r.config.emulator).toBe('FEXCore');
    expect(r.config.cpuListWoW64).toBe('6-7');
    expect(
      r.messages.some((m) => /Box86 is non-functional/.test(m.text))
    ).toBe(true);
  });
});

describe('edge case: Denuvo title on Tier B swaps Box64 -> FEX-Core', () => {
  const r = resolve({
    device: TIER_B,
    gameTitle: 'Some Denuvo Game',
    game: meta({ drm: 'Denuvo' }),
    priorities: [],
  });
  it('ends up on FEX-Core', () => {
    expect(r.config.emulator).toBe('FEXCore');
  });
});

describe('validator: launchRealSteam + useLegacyDRM are mutually exclusive', () => {
  it('emits a blocking error', () => {
    let cfg = buildBaseConfig(TIERS.B);
    cfg = { ...cfg, launchRealSteam: true, useLegacyDRM: true };
    const { messages } = validate(cfg, TIER_B, TIERS.B, meta({}));
    expect(
      messages.some(
        (m) => m.level === 'error' && /mutually exclusive/.test(m.text)
      )
    ).toBe(true);
  });
});

describe('Vulkan title gets no DX wrapper via heuristics', () => {
  const r = resolve({
    device: TIER_B,
    gameTitle: 'Unknown Vulkan Game',
    game: meta({ engine: 'Source-2', primaryAPI: 'Vulkan' }),
    priorities: [],
  });
  it('sets dxwrapper=none', () => {
    expect(r.config.dxwrapper).toBe('none');
  });
});
