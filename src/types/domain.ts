import type {
  ANTICHEATS,
  DRMS,
  ENGINES,
  GRAPHICS_APIS,
  TIER_ORDER,
} from './enums';
import type {
  ConfigOverride,
  ContainerVariant,
  GraphicsDriver,
  WorkingConfig,
} from './container';

export type Tier = (typeof TIER_ORDER)[number];
export type GraphicsAPI = (typeof GRAPHICS_APIS)[number];
export type Bitness = 32 | 64 | '32->64';
export type Engine = (typeof ENGINES)[number];
export type DRM = (typeof DRMS)[number];
export type AntiCheat = (typeof ANTICHEATS)[number];

export interface DeviceTierInfo {
  tier: Tier;
  label: string;
  soc: string;
  gpu: string;
  ram: string;
  bionicCapable: boolean;
  hasAArch32: boolean;
  defaultVariant: ContainerVariant;
  defaultGraphicsDriver: GraphicsDriver;
  defaultGraphicsDriverVersion: string;
  // Proton/Wine + Turnip builds that ship bundled for this tier. The resolver
  // warns when a recommended version is NOT in this list (GameNative Issue
  // #580: an un-bundled wineVersion crashes the launch).
  bundledWineVersions: string[];
  bundledDriverVersions: string[];
  notes: string;
}

export interface Device {
  id: string;
  name: string;
  tier: Tier;
}

export interface GameMeta {
  engine: Engine;
  primaryAPI: GraphicsAPI;
  bitness: Bitness;
  drm: DRM;
  anticheat: AntiCheat;
  year: number;
}

export interface CuratedGame extends GameMeta {
  id: string;
  title: string;
  aliases: string[];
  steamAppId?: number;
  // Shared overrides plus per-tier refinements. Tier overrides win over shared.
  shared?: ConfigOverride;
  perTier?: Partial<Record<Tier, ConfigOverride>>;
  notes?: string;
}

export type Priority =
  | 'maxfps'
  | 'battery'
  | 'stability'
  | 'upscaling'
  | 'lowlatency'
  | 'fidelity';

export interface PriorityDef {
  id: Priority;
  label: string;
  blurb: string;
}

// A heuristic rule. `if` is matched against the resolution context; the first
// matching rule per field wins, later rules may still refine other fields.
export interface HeuristicRule {
  id: string;
  if: HeuristicCondition;
  then: ConfigOverride;
  message?: { level: MessageLevel; text: string };
}

export interface HeuristicCondition {
  tier?: Tier | Tier[];
  engine?: Engine | Engine[];
  primaryAPI?: GraphicsAPI | GraphicsAPI[];
  drm?: DRM | DRM[];
  anticheat?: AntiCheat | AntiCheat[];
  bitness?: Bitness | Bitness[];
  yearBefore?: number;
  yearAfter?: number;
}

export type MessageLevel = 'error' | 'warning' | 'info';

export interface Message {
  level: MessageLevel;
  text: string;
}

export type ResolveSource = 'curated' | 'heuristic';

export interface ResolveInput {
  device: Device;
  game: GameMeta;
  gameTitle: string;
  /** Set when the user explicitly picked a curated entry. */
  curatedId?: string;
  /** Set when the user supplied metadata by hand (bypasses the curated DB). */
  manual?: boolean;
  priorities: Priority[];
  /** UI-driven knobs for the upscaling priority. */
  resolutionScalePct?: number; // 50-100, % of panel native
  sharpnessLevel?: number; // 0-100
  frameGenEnabled?: boolean; // LSFG-VK toggle
}

export interface ResolveResult {
  config: WorkingConfig;
  exportObject: import('./container').ContainerExport;
  json: string;
  source: ResolveSource;
  matchedCuratedId?: string;
  appliedRuleIds: string[];
  messages: Message[];
}

export interface FpsRow {
  title: string;
  /** device-id -> eyeballed average FPS, or null when untested. */
  fps: Record<string, number | null>;
}
