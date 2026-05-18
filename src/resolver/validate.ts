import type { WorkingConfig } from '../types/container';
import type {
  Device,
  DeviceTierInfo,
  GameMeta,
  Message,
} from '../types/domain';

export interface ValidationResult {
  config: WorkingConfig;
  messages: Message[];
}

// Stage 3: applies safe auto-corrections and emits errors/warnings/info.
// Sourced from research "Recommendations" (validators to ship) + the
// per-tier critical edge cases + Issue #580.
export function validate(
  input: WorkingConfig,
  device: Device,
  tier: DeviceTierInfo,
  game: GameMeta
): ValidationResult {
  const config: WorkingConfig = {
    ...input,
    graphicsDriverConfig: { ...input.graphicsDriverConfig },
    dxwrapperConfig: { ...input.dxwrapperConfig },
    extras: { ...input.extras },
  };
  const messages: Message[] = [];
  const mali = tier.tier === 'D' || tier.tier === 'E';

  // Mali + Bionic -> block, force Glibc.
  if (mali && config.containerVariant === 'bionic') {
    config.containerVariant = 'glibc';
    config.wineVersion = tier.bundledWineVersions[0];
    config.graphicsDriver = tier.defaultGraphicsDriver;
    messages.push({
      level: 'error',
      text: `${device.name} has a Mali/legacy GPU — Bionic Wine builds are not validated against Mali Vulkan ICDs. Forced containerVariant=glibc.`,
    });
  }

  // DX12 / Vulkan-only on Mali -> will not run.
  if (mali && (game.primaryAPI === 'DX12' || game.primaryAPI === 'Vulkan')) {
    messages.push({
      level: 'error',
      text: `${game.primaryAPI} titles will not run on ${device.name} — Mesa Turnip is Adreno-only and the Mali Vulkan ICD is too incomplete. This config is exported for reference only.`,
    });
  }

  // No-AArch32 SoC + 32-bit title -> FEX-Core mandatory.
  const is32 = game.bitness === 32 || game.bitness === '32->64';
  if (is32 && !tier.hasAArch32 && config.emulator !== 'FEXCore') {
    config.emulator = 'FEXCore';
    config.cpuListWoW64 = tier.tier === 'A' ? '6-7' : config.cpuListWoW64;
    messages.push({
      level: 'info',
      text: `${device.name} dropped native 32-bit ARM — Box86 is non-functional. Forced emulator=FEXCore (WoW64) for this 32-bit title.`,
    });
  }

  // Denuvo + Box64 -> swap to FEX-Core.
  if (game.drm === 'Denuvo' && config.emulator === 'Box64') {
    config.emulator = 'FEXCore';
    messages.push({
      level: 'info',
      text: 'Denuvo requires the FEX-Core DENUVO path — swapped emulator from Box64 to FEXCore.',
    });
  }

  // launchRealSteam + useLegacyDRM -> mutually exclusive.
  if (config.launchRealSteam && config.useLegacyDRM) {
    messages.push({
      level: 'error',
      text: 'launchRealSteam and useLegacyDRM are mutually exclusive — disable one. (Goldberg/legacy DRM cannot run alongside real Steam; achievements only unlock with launchRealSteam.)',
    });
  }

  // wineVersion not bundled for this device -> Issue #580 warning.
  if (!tier.bundledWineVersions.includes(config.wineVersion)) {
    messages.push({
      level: 'warning',
      text: `wineVersion "${config.wineVersion}" is not in ${device.name}'s bundled list (${tier.bundledWineVersions.join(', ')}). Download it in GameNative first or the launch will fail (Issue #580).`,
    });
  }

  // graphicsDriverVersion vs graphicsDriver compatibility.
  const drv = config.graphicsDriver;
  const dv = config.graphicsDriverVersion;
  if (dv === 'Mr_Purple_T26' && drv !== 'wrapper-v2') {
    messages.push({
      level: 'warning',
      text: 'Mr_Purple_T26 is only valid with graphicsDriver=wrapper-v2.',
    });
  }
  if (
    (drv === 'virgl' || drv === 'vortek') &&
    config.containerVariant === 'bionic'
  ) {
    messages.push({
      level: 'warning',
      text: `graphicsDriver=${drv} is a Glibc-path driver; it does not pair with a Bionic container.`,
    });
  }
  if (
    (drv === 'wrapper' || drv === 'wrapper-v2') &&
    config.containerVariant === 'glibc'
  ) {
    messages.push({
      level: 'warning',
      text: `graphicsDriver=${drv} is the Bionic Turnip path; on Glibc use turnip / virgl / vortek instead.`,
    });
  }

  // Tier E realistic-scope warning.
  if (
    tier.tier === 'E' &&
    !['DirectDraw', 'DX9'].includes(game.primaryAPI)
  ) {
    messages.push({
      level: 'warning',
      text: `${device.name} is legacy/budget hardware — realistically only 2D / DirectDraw / DX7-era titles run. ${game.primaryAPI} is unlikely to be playable.`,
    });
  }

  return { config, messages };
}
