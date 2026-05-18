import { isAdreno, isMali } from '../data/devices';
import type { GraphicsDriver, WorkingConfig } from '../types/container';
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

const BIONIC_DRIVERS = new Set<GraphicsDriver>(['wrapper', 'wrapper-v2']);
const GLIBC_DRIVERS = new Set<GraphicsDriver>(['turnip', 'virgl', 'vortek']);

// A coherent driver + driver-version pair for a Glibc container on this tier.
// Adreno tiers use direct Turnip (Glibc-only); Mali/legacy use VirGL.
function glibcDriver(tier: DeviceTierInfo): {
  driver: GraphicsDriver;
  version: string;
} {
  if (isAdreno(tier.tier)) {
    const turnip =
      tier.bundledDriverVersions.find((v) => v.startsWith('turnip')) ??
      'turnip26.0.0_R8';
    return { driver: 'turnip', version: turnip };
  }
  return { driver: 'virgl', version: 'virgl' };
}

// Container variant <-> graphics driver must be coherent. Rewrite (not just
// warn) so the export is launchable even when a priority overlay produced a
// Bionic-driver / Glibc-container mix. Returns the info message, if any.
function reconcileDriver(
  config: WorkingConfig,
  tier: DeviceTierInfo
): Message | null {
  const from = config.graphicsDriver;
  if (config.containerVariant === 'glibc' && BIONIC_DRIVERS.has(from)) {
    const g = glibcDriver(tier);
    config.graphicsDriver = g.driver;
    config.graphicsDriverVersion = g.version;
    return {
      level: 'info',
      text: `graphicsDriver=${from} is a Bionic-only Turnip path but the container is Glibc — reconciled to ${g.driver} (${g.version}).`,
    };
  }
  if (config.containerVariant === 'bionic' && GLIBC_DRIVERS.has(from)) {
    config.graphicsDriver = tier.defaultGraphicsDriver;
    config.graphicsDriverVersion = tier.defaultGraphicsDriverVersion;
    return {
      level: 'info',
      text: `graphicsDriver=${from} is a Glibc-path driver but the container is Bionic — reconciled to ${tier.defaultGraphicsDriver} (${tier.defaultGraphicsDriverVersion}).`,
    };
  }
  return null;
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
  const mali = isMali(tier.tier);

  // No-AArch32 flagship SoC: 32-bit Windows code can only run through
  // FEX-Core WoW64 pinned to the prime cores. Deterministic regardless of
  // which priority last touched cpuListWoW64.
  if (!tier.hasAArch32) config.cpuListWoW64 = '6-7';

  // Mali + Bionic -> block, force a coherent Glibc graphics stack.
  if (mali && config.containerVariant === 'bionic') {
    config.containerVariant = 'glibc';
    config.wineVersion = tier.bundledWineVersions[0];
    const g = glibcDriver(tier);
    config.graphicsDriver = g.driver;
    config.graphicsDriverVersion = g.version;
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

  const reconciled = reconcileDriver(config, tier);
  if (reconciled) messages.push(reconciled);

  // launchRealSteam + useLegacyDRM -> mutually exclusive.
  if (config.launchRealSteam && config.useLegacyDRM) {
    messages.push({
      level: 'error',
      text: 'launchRealSteam and useLegacyDRM are mutually exclusive — disable one. (Goldberg/legacy DRM cannot run alongside real Steam; achievements only unlock with launchRealSteam.)',
    });
  }

  // wineVersion not bundled for this device -> Issue #580 launch crash.
  if (!tier.bundledWineVersions.includes(config.wineVersion)) {
    messages.push({
      level: 'warning',
      text: `wineVersion "${config.wineVersion}" is not in ${device.name}'s bundled list (${tier.bundledWineVersions.join(', ')}). Download it in GameNative first or the launch will fail (Issue #580).`,
    });
  }

  // graphicsDriverVersion not bundled -> custom driver pack must be installed
  // via the Contents UI or it is silently ignored (Issue #580 class).
  if (!tier.bundledDriverVersions.includes(config.graphicsDriverVersion)) {
    messages.push({
      level: 'warning',
      text: `graphicsDriverVersion "${config.graphicsDriverVersion}" is not in ${device.name}'s bundled driver list (${tier.bundledDriverVersions.join(', ')}). Install the driver pack via the Contents UI first or it will be ignored.`,
    });
  }

  // Remaining driver-version compatibility note.
  if (
    config.graphicsDriverVersion === 'Mr_Purple_T26' &&
    config.graphicsDriver !== 'wrapper-v2'
  ) {
    messages.push({
      level: 'warning',
      text: 'Mr_Purple_T26 is only valid with graphicsDriver=wrapper-v2.',
    });
  }

  // Tier E realistic-scope warning.
  if (tier.tier === 'E' && !['DirectDraw', 'DX9'].includes(game.primaryAPI)) {
    messages.push({
      level: 'warning',
      text: `${device.name} is legacy/budget hardware — realistically only 2D / DirectDraw / DX7-era titles run. ${game.primaryAPI} is unlikely to be playable.`,
    });
  }

  return { config, messages };
}
