import type { ConfigOverride } from '../types/container';
import type {
  Message,
  Priority,
  PriorityDef,
  Tier,
} from '../types/domain';

export const PRIORITY_DEFS: PriorityDef[] = [
  {
    id: 'maxfps',
    label: 'Max FPS',
    blurb: 'Newest Proton/Turnip, DXVK async, FEX-Core, mailbox present.',
  },
  {
    id: 'battery',
    label: 'Battery / thermals',
    blurb: 'FIFO present, framerate cap, lower resolution, fewer cores.',
  },
  {
    id: 'stability',
    label: 'Stability',
    blurb: 'Glibc + Proton 9 x86_64, COMPATIBILITY preset, async off.',
  },
  {
    id: 'upscaling',
    label: 'AI upscaling / sharpness',
    blurb: 'Render below native + CAS sharpening; optional frame generation.',
  },
  {
    id: 'lowlatency',
    label: 'Low input lag',
    blurb: 'Immediate/mailbox present, AHB-backed images, no frame cap.',
  },
  {
    id: 'fidelity',
    label: 'Visual fidelity',
    blurb: 'Native resolution, more video memory, higher VKD3D feature level.',
  },
];

export interface PriorityContext {
  tier: Tier;
  /** % of 1920x1080 reference panel to render internally (50-100). */
  resolutionScalePct: number;
  /** 0-100 CAS strength. */
  sharpnessLevel: number;
  /** LSFG-VK frame generation (requires Lossless Scaling, Steam app 993090). */
  frameGenEnabled: boolean;
}

const PANEL_W = 1920;
const PANEL_H = 1080;

function scaleRes(pct: number): string {
  const clamp = Math.max(40, Math.min(100, pct));
  const w = Math.round((PANEL_W * clamp) / 100 / 2) * 2;
  const h = Math.round((PANEL_H * clamp) / 100 / 2) * 2;
  return `${w}x${h}`;
}

export interface PriorityResult {
  override: ConfigOverride;
  messages: Message[];
}

type PriorityFn = (ctx: PriorityContext) => PriorityResult;

// Field-override sets per user priority. Sourced from research Section 6
// ("Priority -> Settings Mapping") + Section 7 notes on AI upscaling.
const PRIORITY_FNS: Record<Priority, PriorityFn> = {
  maxfps: (ctx) => ({
    override: {
      containerVariant: 'bionic',
      wineVersion: 'proton-10.0-arm64ec-2',
      graphicsDriver: 'wrapper-v2',
      dxwrapper: 'dxvk',
      dxwrapperConfig: { async: '1', asyncCache: '1', framerate: '0' },
      emulator: 'FEXCore',
      fexcorePreset: 'Fast',
      graphicsDriverConfig: {
        presentMode: 'mailbox',
        resourceType: 'auto',
        ...(ctx.tier === 'A' || ctx.tier === 'A-' || ctx.tier === 'B'
          ? { bcnEmulation: 'off' }
          : {}),
      },
      csmt: true,
      startupSelection: 2,
      ...(ctx.tier === 'A' ? { cpuListWoW64: '6-7' } : {}),
    },
    messages: [
      {
        level: 'info',
        text: 'Max FPS: newest Proton 10 + Wrapper-v2; verify these are downloaded on-device or the launch will fail (Issue #580).',
      },
    ],
  }),

  battery: (ctx) => ({
    override: {
      graphicsDriverConfig: { presentMode: 'fifo' },
      dxwrapperConfig: { framerate: '60' },
      screenSize: scaleRes(Math.min(ctx.resolutionScalePct, 75)),
      cpuList: '2-5',
      fexcorePreset: 'Slow',
    },
    messages: [
      {
        level: 'info',
        text: 'Battery: FIFO present, 60 FPS cap, render dropped to ~75% panel, fewer cores.',
      },
    ],
  }),

  stability: () => ({
    override: {
      containerVariant: 'glibc',
      wineVersion: 'proton-9.0-x86_64',
      emulator: 'Box64',
      box64Preset: 'COMPATIBILITY',
      dxwrapperConfig: { async: '0' },
      startupSelection: 0,
    },
    messages: [
      {
        level: 'info',
        text: 'Stability: Glibc + Proton 9 x86_64, COMPATIBILITY preset, DXVK async off. Use when Bionic fails.',
      },
    ],
  }),

  upscaling: (ctx) => {
    const messages: Message[] = [
      {
        level: 'info',
        text: `AI upscaling: rendering at ${ctx.resolutionScalePct}% of panel native + CAS sharpening (level ${ctx.sharpnessLevel}). This is CAS, not DLSS/FSR.`,
      },
    ];
    const override: ConfigOverride = {
      screenSize: scaleRes(ctx.resolutionScalePct),
      extras: {
        sharpnessEffect: 'CAS',
        sharpnessLevel: String(ctx.sharpnessLevel),
        sharpnessDenoise: '100',
      },
    };
    if (ctx.frameGenEnabled) {
      override.extras = {
        ...override.extras,
        lsfgEnabled: 'true',
        lsfgMultiplier: '2',
        lsfgFlowScale: '0.80',
        lsfgPerformanceMode: 'true',
      };
      messages.push({
        level: 'warning',
        text: 'Frame generation (LSFG-VK) requires you to own + have installed Lossless Scaling (Steam app 993090); it is Bionic-only and adds ≥1 frame of latency.',
      });
    }
    return { override, messages };
  },

  lowlatency: (ctx) => ({
    override: {
      graphicsDriverConfig: {
        presentMode: ctx.tier === 'D' || ctx.tier === 'E' ? 'mailbox' : 'immediate',
        resourceType: 'image',
        disablePresentWait: '0',
      },
      emulator: 'FEXCore',
      dxwrapperConfig: { framerate: '0' },
      extras: { lsfgEnabled: 'false' },
    },
    messages: [
      {
        level: 'info',
        text: 'Low input lag: immediate/mailbox present, AHB-backed images, no frame cap. Frame generation force-disabled (adds latency).',
      },
    ],
  }),

  fidelity: () => ({
    override: {
      screenSize: `${PANEL_W}x${PANEL_H}`,
      videoMemorySize: '4096',
      dxwrapperConfig: { videoMemorySize: '4096', maxDeviceMemory: '4096' },
      graphicsDriverConfig: { maxDeviceMemory: '4096' },
      extras: { sharpnessEffect: 'None' },
    },
    messages: [
      {
        level: 'info',
        text: 'Visual fidelity: native panel resolution, 4 GB video memory, no sharpening. Raise vkd3dLevel to 12_2 if the title supports it.',
      },
    ],
  }),
};

export function applyPriority(
  id: Priority,
  ctx: PriorityContext
): PriorityResult {
  return PRIORITY_FNS[id](ctx);
}
