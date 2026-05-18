import type { WorkingConfig } from '../types/container';
import type { DeviceTierInfo } from '../types/domain';

// Builds the base WorkingConfig for a device tier. This is the bottom layer;
// curated/heuristic/priority overrides and the validation pass are applied on
// top by the resolver. Scalar defaults follow the canonical .container schema
// example in the research foundation (Section 1).
export function buildBaseConfig(t: DeviceTierInfo): WorkingConfig {
  const bionic = t.defaultVariant === 'bionic';
  const noAArch32 = !t.hasAArch32;
  const mali = t.tier === 'D' || t.tier === 'E';

  // Default to a conservatively bundled Wine build, never the newest cloud
  // recommendation (research: avoids the Issue #580 un-bundled-Proton crash).
  const wineVersion = bionic ? 'proton-9.0-arm64ec' : 'wine-9.2-x86_64';
  // FEX-Core only where AArch32 is gone; otherwise Box64 (+Box86) is the
  // lower-overhead default.
  const emulator = noAArch32 ? 'FEXCore' : 'Box64';

  const graphicsDriverConfig: Record<string, string> = {
    vulkanVersion: '1.3',
    presentMode: 'mailbox',
    resourceType: mali ? 'buffer' : 'auto',
  };
  if (mali) {
    graphicsDriverConfig.bcnEmulation = 'on';
    graphicsDriverConfig.bcnEmulationType = 'compute';
  } else {
    graphicsDriverConfig.bcnEmulation = 'off';
  }

  const dxwrapperConfig: Record<string, string> = {
    version: mali ? 'async-1.10.3' : '2.4.1-gplasync',
    framerate: '0',
    maxDeviceMemory: '2048',
  };

  return {
    // ---- General ----
    name: 'MyContainer',
    screenSize: '1280x720',
    executablePath: '',
    execArgs: '',
    language: 'english',
    showFPS: false,
    launchRealSteam: false,
    allowSteamUpdates: false,
    steamType: 'STEAM_TYPE_NORMAL',
    forceDlc: false,
    useLegacyDRM: false,
    unpackFiles: false,
    startupSelection: 0,
    audioDriver: 'alsa',

    // ---- Emulation ----
    containerVariant: t.defaultVariant,
    wineVersion,
    emulator,
    box86Version: '0.3.7',
    box64Version: '0.3.7',
    box86Preset: 'PERFORMANCE',
    box64Preset: 'PERFORMANCE',
    fexcoreVersion: '0.3.0',
    fexcoreTSOMode: 'true',
    fexcoreX87Mode: 'JIT',
    fexcoreMultiBlock: 'true',
    fexcorePreset: 'Fast',
    wow64Mode: true,
    cpuList: '0-7',
    cpuListWoW64: t.tier === 'A' || t.tier === 'A-' ? '6-7' : '4-7',

    // ---- Graphics ----
    graphicsDriver: t.defaultGraphicsDriver,
    graphicsDriverVersion: t.defaultGraphicsDriverVersion,
    graphicsDriverConfig,
    dxwrapper: 'dxvk',
    dxwrapperConfig,

    // ---- Wine ----
    renderer: 'gl',
    csmt: true,
    videoPciDeviceID: 1024,
    offScreenRenderingMode: 'fbo',
    strictShaderMath: true,
    useDRI3: true,
    videoMemorySize: '2048',
    mouseWarpOverride: 'enable',
    desktopTheme: 'default',

    // ---- Controller ----
    sdlControllerAPI: true,
    useSteamInput: false,
    enableXInput: true,
    enableDInput: true,
    dinputMapperType: 1,
    disableMouseInput: false,
    touchscreenMode: false,

    // ---- Drives / Components / Env ----
    drives: 'D:/storage/emulated/0/Download',
    wincomponents: 'vcrun2019=1,dotnet48=1,physx=1,xnafx40=1',
    envVars: 'WINEDEBUG=-all',

    // ---- Advanced / Display ----
    externalDisplayMode: 0,
    externalDisplaySwap: false,

    // ---- Hidden / Extras ----
    extras: {
      sharpnessEffect: 'None',
      sharpnessLevel: '30',
      sharpnessDenoise: '100',
      lsfgEnabled: 'false',
      lsfgMultiplier: '2',
      lsfgFlowScale: '0.80',
      lsfgPerformanceMode: 'true',
    },
  };
}
