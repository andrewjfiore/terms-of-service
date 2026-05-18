import type { ContainerExport, WorkingConfig } from '../types/container';

function kv(obj: Record<string, string>): string {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${v}`)
    .join(',');
}

// Collapses the structured WorkingConfig into the flat on-disk .container
// shape: the two packed config maps become comma-separated key=value strings
// and extras becomes a plain string map (mirrors the GameNative Compose UI).
export function toExport(c: WorkingConfig): ContainerExport {
  return {
    name: c.name,
    screenSize: c.screenSize,
    executablePath: c.executablePath,
    execArgs: c.execArgs,
    language: c.language,
    showFPS: c.showFPS,
    launchRealSteam: c.launchRealSteam,
    allowSteamUpdates: c.allowSteamUpdates,
    steamType: c.steamType,
    forceDlc: c.forceDlc,
    useLegacyDRM: c.useLegacyDRM,
    unpackFiles: c.unpackFiles,
    startupSelection: c.startupSelection,
    audioDriver: c.audioDriver,

    containerVariant: c.containerVariant,
    wineVersion: c.wineVersion,
    emulator: c.emulator,
    box86Version: c.box86Version,
    box64Version: c.box64Version,
    box86Preset: c.box86Preset,
    box64Preset: c.box64Preset,
    fexcoreVersion: c.fexcoreVersion,
    fexcoreTSOMode: c.fexcoreTSOMode,
    fexcoreX87Mode: c.fexcoreX87Mode,
    fexcoreMultiBlock: c.fexcoreMultiBlock,
    fexcorePreset: c.fexcorePreset,
    wow64Mode: c.wow64Mode,
    cpuList: c.cpuList,
    cpuListWoW64: c.cpuListWoW64,

    graphicsDriver: c.graphicsDriver,
    graphicsDriverVersion: c.graphicsDriverVersion,
    graphicsDriverConfig: kv(c.graphicsDriverConfig),
    dxwrapper: c.dxwrapper,
    dxwrapperConfig: kv(c.dxwrapperConfig),

    renderer: c.renderer,
    csmt: c.csmt,
    videoPciDeviceID: c.videoPciDeviceID,
    offScreenRenderingMode: c.offScreenRenderingMode,
    strictShaderMath: c.strictShaderMath,
    useDRI3: c.useDRI3,
    videoMemorySize: c.videoMemorySize,
    mouseWarpOverride: c.mouseWarpOverride,
    desktopTheme: c.desktopTheme,

    sdlControllerAPI: c.sdlControllerAPI,
    useSteamInput: c.useSteamInput,
    enableXInput: c.enableXInput,
    enableDInput: c.enableDInput,
    dinputMapperType: c.dinputMapperType,
    disableMouseInput: c.disableMouseInput,
    touchscreenMode: c.touchscreenMode,

    drives: c.drives,
    wincomponents: c.wincomponents,
    envVars: c.envVars,

    externalDisplayMode: c.externalDisplayMode,
    externalDisplaySwap: c.externalDisplaySwap,

    extras: { ...c.extras },
  };
}

export function toJson(c: WorkingConfig): string {
  return JSON.stringify(toExport(c), null, 2);
}
