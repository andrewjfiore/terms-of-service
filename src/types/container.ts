// GameNative container schema.
//
// `ContainerExport` is the flat .container JSON shape (keys mirror the Kotlin
// ContainerData data class). `graphicsDriverConfig` / `dxwrapperConfig` are
// comma-separated key=value strings on disk, and `extras` is a string->string
// map. While resolving we keep those three as structured objects
// (`WorkingConfig`) and only collapse them to the on-disk string form at
// export time (this mirrors what the GameNative Compose UI does internally).

export interface ContainerExport {
  // ---- General ----
  name: string;
  screenSize: string;
  executablePath: string;
  execArgs: string;
  language: string;
  showFPS: boolean;
  launchRealSteam: boolean;
  allowSteamUpdates: boolean;
  steamType: string;
  forceDlc: boolean;
  useLegacyDRM: boolean;
  unpackFiles: boolean;
  startupSelection: number;
  audioDriver: string;

  // ---- Emulation ----
  containerVariant: ContainerVariant;
  wineVersion: string;
  emulator: Emulator;
  box86Version: string;
  box64Version: string;
  box86Preset: BoxPreset;
  box64Preset: BoxPreset;
  fexcoreVersion: string;
  fexcoreTSOMode: string;
  fexcoreX87Mode: string;
  fexcoreMultiBlock: string;
  fexcorePreset: FexPreset;
  wow64Mode: boolean;
  cpuList: string;
  cpuListWoW64: string;

  // ---- Graphics ----
  graphicsDriver: GraphicsDriver;
  graphicsDriverVersion: string;
  graphicsDriverConfig: string;
  dxwrapper: DxWrapper;
  dxwrapperConfig: string;

  // ---- Wine ----
  renderer: string;
  csmt: boolean;
  videoPciDeviceID: number;
  offScreenRenderingMode: string;
  strictShaderMath: boolean;
  useDRI3: boolean;
  videoMemorySize: string;
  mouseWarpOverride: string;
  desktopTheme: string;

  // ---- Controller ----
  sdlControllerAPI: boolean;
  useSteamInput: boolean;
  enableXInput: boolean;
  enableDInput: boolean;
  dinputMapperType: number;
  disableMouseInput: boolean;
  touchscreenMode: boolean;

  // ---- Drives / Components / Env ----
  drives: string;
  wincomponents: string;
  envVars: string;

  // ---- Advanced / Display ----
  externalDisplayMode: number;
  externalDisplaySwap: boolean;

  // ---- Hidden / Extras ----
  extras: Record<string, string>;
}

export type ContainerVariant = 'glibc' | 'bionic';
export type Emulator = 'FEXCore' | 'Box64';
export type BoxPreset =
  | 'COMPATIBILITY'
  | 'INTERMEDIATE'
  | 'PERFORMANCE'
  | 'STABILITY';
export type FexPreset = 'Fastest' | 'Fast' | 'Slow' | 'Slowest';
export type GraphicsDriver =
  | 'turnip'
  | 'wrapper'
  | 'wrapper-v2'
  | 'virgl'
  | 'vortek'
  | 'adreno';
export type DxWrapper = 'dxvk' | 'vkd3d' | 'wined3d' | 'cnc-ddraw' | 'none';

export interface Extras {
  sharpnessEffect: 'None' | 'CAS';
  sharpnessLevel: string;
  sharpnessDenoise: string;
  lsfgEnabled: string;
  lsfgMultiplier: string;
  lsfgFlowScale: string;
  lsfgPerformanceMode: string;
}

// Structured working representation used during resolution. Everything except
// the three packed maps matches ContainerExport 1:1.
export type WorkingConfig = Omit<
  ContainerExport,
  'graphicsDriverConfig' | 'dxwrapperConfig' | 'extras'
> & {
  graphicsDriverConfig: Record<string, string>;
  dxwrapperConfig: Record<string, string>;
  extras: Extras;
};

// Overrides accumulate as deep-partials so curated / heuristic / priority
// layers can touch just the keys they care about.
export type ConfigOverride = {
  [K in keyof WorkingConfig]?: K extends
    | 'graphicsDriverConfig'
    | 'dxwrapperConfig'
    ? Record<string, string>
    : K extends 'extras'
      ? Partial<Extras>
      : WorkingConfig[K];
};
