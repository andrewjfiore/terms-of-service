// Single source of truth for the domain string-unions. The `Engine`,
// `GraphicsAPI`, `DRM`, `AntiCheat`, `Tier` types are derived from these
// arrays (see types/domain.ts), and the same arrays drive the curated-DB
// validator and the manual-metadata form — so they can never drift.
export const ENGINES = [
  'Unity',
  'Unreal-3',
  'Unreal-4',
  'Unreal-5',
  'Source',
  'Source-2',
  'RE-Engine',
  'RAGE',
  'Frostbite',
  'Creation',
  'REDengine',
  'id-Tech',
  'CryEngine',
  'LibGDX',
  'GameMaker',
  'RPG-Maker',
  'SAGE',
  'proprietary',
] as const;

export const GRAPHICS_APIS = [
  'DirectDraw',
  'DX9',
  'DX10',
  'DX11',
  'DX12',
  'OpenGL',
  'Vulkan',
] as const;

export const DRMS = [
  'none',
  'Steam-DRM',
  'Denuvo',
  'GOG-Galaxy',
  'EA-App',
  'Ubisoft-Connect',
  'Epic',
] as const;

export const ANTICHEATS = [
  'none',
  'VAC',
  'EAC',
  'BattlEye',
  'Denuvo-AntiCheat',
  'Riot-Vanguard',
  'Roblox-Hyperion',
] as const;

export const TIER_ORDER = ['A', 'A-', 'B', 'C', 'D', 'E'] as const;
