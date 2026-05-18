import type { HeuristicRule } from '../types/domain';

// Ordered heuristic rules (fallback when the curated DB has no entry).
// First matching rule per field wins; later rules still refine other fields.
// envVars / wincomponents overrides are merged additively by the resolver
// (union by key=value), so these behave like the research's "envVars+" form.
// Sourced from research Section 4 ("Heuristics Engine") + Section 5
// ("Engine / DRM / Anti-Cheat Reference").
export const HEURISTIC_RULES: HeuristicRule[] = [
  // ---- Graphics API -> DX wrapper ----
  {
    id: 'api-directdraw',
    if: { primaryAPI: 'DirectDraw' },
    then: { dxwrapper: 'cnc-ddraw' },
  },
  { id: 'api-dx12', if: { primaryAPI: 'DX12' }, then: { dxwrapper: 'vkd3d' } },
  {
    id: 'api-dx9-11',
    if: { primaryAPI: ['DX9', 'DX10', 'DX11'] },
    then: { dxwrapper: 'dxvk' },
  },
  {
    id: 'api-opengl',
    if: { primaryAPI: 'OpenGL' },
    then: { dxwrapper: 'wined3d' },
  },
  {
    id: 'api-vulkan',
    if: { primaryAPI: 'Vulkan' },
    then: { dxwrapper: 'none' },
  },

  // ---- Device tier -> container variant ----
  {
    id: 'tier-a-bionic',
    if: { tier: ['A', 'A-', 'B', 'C'] },
    then: { containerVariant: 'bionic' },
  },
  {
    id: 'tier-de-glibc',
    if: { tier: ['D', 'E'] },
    then: { containerVariant: 'glibc' },
  },

  // ---- Engine quirks ----
  {
    id: 'engine-unity',
    if: { engine: 'Unity' },
    then: { box64Preset: 'STABILITY', execArgs: '-force-gfx-direct' },
    message: {
      level: 'info',
      text: 'Unity: applied STABILITY preset + -force-gfx-direct (fixes GC stutter on Unity ≤2019).',
    },
  },
  {
    id: 'engine-unreal3',
    if: { engine: 'Unreal-3' },
    then: {
      dxwrapper: 'dxvk',
      wincomponents: 'physx=1',
    },
    message: {
      level: 'info',
      text: 'Unreal Engine 3: shader cache rebuilds on cold launch; PhysX component added.',
    },
  },
  {
    id: 'engine-unreal4',
    if: { engine: 'Unreal-4' },
    then: {
      dxwrapper: 'dxvk',
      dxwrapperConfig: { async: '1', asyncCache: '1' },
    },
    message: {
      level: 'info',
      text: 'Unreal Engine 4: DXVK async + asyncCache enabled to mask shader-compile stutter.',
    },
  },
  {
    id: 'engine-unreal5',
    if: { engine: 'Unreal-5' },
    then: { dxwrapper: 'vkd3d', graphicsDriverVersion: 'turnip26.2.0' },
    message: {
      level: 'warning',
      text: 'Unreal Engine 5 (Lumen/Nanite) needs Turnip ≥26.2.0 for stable VK_KHR_present_wait.',
    },
  },
  {
    id: 'engine-re',
    if: { engine: 'RE-Engine' },
    then: { dxwrapper: 'vkd3d' },
    message: {
      level: 'info',
      text: 'RE Engine: requires SSE4.2 + VK_EXT_robustness2 — VKD3D is mandatory.',
    },
  },
  {
    id: 'engine-frostbite',
    if: { engine: 'Frostbite' },
    then: { dxwrapper: 'dxvk', wincomponents: 'eafc=1' },
    message: {
      level: 'warning',
      text: 'Frostbite: requires the EA App / Origin to be installed in the container.',
    },
  },
  {
    id: 'engine-idtech',
    if: { engine: 'id-Tech' },
    then: { dxwrapper: 'none' },
    message: {
      level: 'info',
      text: 'id Tech 6/7: native Vulkan, no wrapper. Denuvo Anti-Cheat blocks multiplayer — offline only.',
    },
  },
  {
    id: 'engine-creation',
    if: { engine: 'Creation' },
    then: {
      dxwrapper: 'dxvk',
      envVars: 'WINE_LARGE_ADDRESS_AWARE=1',
    },
    message: {
      level: 'info',
      text: 'Creation engine: WINE_LARGE_ADDRESS_AWARE=1 set (heavy memory pressure).',
    },
  },
  {
    id: 'engine-source',
    if: { engine: 'Source' },
    then: { dxwrapper: 'dxvk', box64Preset: 'COMPATIBILITY' },
    message: {
      level: 'info',
      text: 'Source 1: old engines are 32-bit — 32-bit path routes through Box64 WoW64.',
    },
  },
  {
    id: 'engine-source2',
    if: { engine: 'Source-2' },
    then: { dxwrapper: 'none' },
    message: {
      level: 'info',
      text: 'Source 2: native Vulkan, no DX wrapper needed.',
    },
  },
  {
    id: 'engine-cryengine',
    if: { engine: 'CryEngine' },
    then: {
      dxwrapper: 'dxvk',
      box64Preset: 'COMPATIBILITY',
      envVars: 'MESA_EXTENSION_MAX_YEAR=2003',
    },
    message: {
      level: 'info',
      text: 'CryEngine 2/3: MESA_EXTENSION_MAX_YEAR=2003 applied (common requirement).',
    },
  },
  {
    id: 'engine-rpgmaker',
    if: { engine: 'RPG-Maker' },
    then: { dxwrapper: 'wined3d' },
    message: {
      level: 'info',
      text: 'RPG Maker (NW.js/Chromium): WineD3D, runs on the lowest tiers.',
    },
  },

  // ---- DRM ----
  {
    id: 'drm-denuvo',
    if: { drm: 'Denuvo' },
    then: { emulator: 'FEXCore', fexcorePreset: 'Fast' },
    message: {
      level: 'warning',
      text: 'Denuvo: runs under FEX-Core (DENUVO path). Each container reinstall may burn an activation slot.',
    },
  },
  {
    id: 'drm-steam',
    if: { drm: 'Steam-DRM' },
    then: { useLegacyDRM: false },
  },
  {
    id: 'drm-ea',
    if: { drm: 'EA-App' },
    then: { wincomponents: 'eafc=1' },
    message: {
      level: 'warning',
      text: 'EA App / Origin required. Some installers need WoW64.',
    },
  },
  {
    id: 'drm-ubisoft',
    if: { drm: 'Ubisoft-Connect' },
    then: {},
    message: {
      level: 'warning',
      text: 'Ubisoft Connect is brittle under GameNative and often fails to authenticate — avoid for now.',
    },
  },
  {
    id: 'drm-gog',
    if: { drm: 'GOG-Galaxy' },
    then: {},
    message: {
      level: 'info',
      text: 'GOG: DRM-free game files run fine; native GOG integration since v0.7.0.',
    },
  },

  // ---- Anti-cheat ----
  {
    id: 'ac-eac',
    if: { anticheat: 'EAC' },
    then: {},
    message: {
      level: 'warning',
      text: 'Easy Anti-Cheat blocks online multiplayer (Proton EAC build not bundled). Offline single-player typically OK.',
    },
  },
  {
    id: 'ac-battleye',
    if: { anticheat: 'BattlEye' },
    then: {},
    message: {
      level: 'warning',
      text: 'BattlEye blocks online multiplayer. Offline fine where available.',
    },
  },
  {
    id: 'ac-vac',
    if: { anticheat: 'VAC' },
    then: {},
    message: {
      level: 'info',
      text: 'VAC is passive — safe offline; online MP largely OK where Proton works on Steam Deck.',
    },
  },
  {
    id: 'ac-vanguard',
    if: { anticheat: 'Riot-Vanguard' },
    then: {},
    message: {
      level: 'error',
      text: 'Riot Vanguard is a kernel-mode anti-cheat — it will not load under Wine. This game cannot run.',
    },
  },
  {
    id: 'ac-denuvo-ac',
    if: { anticheat: 'Denuvo-AntiCheat' },
    then: {},
    message: {
      level: 'error',
      text: 'Denuvo Anti-Cheat is a kernel-mode driver — multiplayer is blocked under Wine on Android.',
    },
  },

  // ---- Bitness x tier ----
  {
    id: 'bits32-tier-a',
    if: { bitness: 32, tier: ['A', 'A-'] },
    then: { emulator: 'FEXCore' },
    message: {
      level: 'info',
      text: '32-bit title on a no-AArch32 SoC: forced FEX-Core WoW64 (Box86 is non-functional here).',
    },
  },
  {
    id: 'bits32-tier-b',
    if: { bitness: 32, tier: ['B', 'C'] },
    then: { emulator: 'Box64' },
    message: {
      level: 'info',
      text: '32-bit title on a tier with native AArch32: Box64 + Box86 hybrid (lower overhead than FEX).',
    },
  },

  // ---- Mali / legacy GPU ----
  {
    id: 'tier-de-bcn',
    if: { tier: ['D', 'E'] },
    then: {
      graphicsDriver: 'virgl',
      graphicsDriverConfig: {
        bcnEmulation: 'on',
        bcnEmulationType: 'compute',
        resourceType: 'buffer',
      },
    },
    message: {
      level: 'info',
      text: 'Mali / legacy GPU: BCn texture emulation enabled, DMA-Buf disabled (resourceType=buffer).',
    },
  },

  // ---- Era fixes ----
  {
    id: 'pre-2000',
    if: { yearBefore: 2000 },
    then: { envVars: 'MESA_EXTENSION_MAX_YEAR=2003' },
    message: {
      level: 'info',
      text: 'Pre-2000 title: MESA_EXTENSION_MAX_YEAR=2003 set for old GL paths.',
    },
  },
];
