import type { Device, DeviceTierInfo, Tier } from '../types/domain';

// Adreno (Snapdragon) tiers run the Bionic/Turnip path; Mali/legacy tiers are
// Glibc/VirGL-only. Single source for these predicates.
export const ADRENO_TIERS = new Set<Tier>(['A', 'A-', 'B', 'C']);
export const MALI_TIERS = new Set<Tier>(['D', 'E']);
export const isMali = (tier: Tier) => MALI_TIERS.has(tier);
export const isAdreno = (tier: Tier) => ADRENO_TIERS.has(tier);

// Device-tier matrix. Sourced from the research foundation (Section 3 "Device
// Tier Matrix" + "Critical edge cases per tier").
export const TIERS: Record<Tier, DeviceTierInfo> = {
  A: {
    tier: 'A',
    label: 'A — Flagship',
    soc: 'Snapdragon 8 Elite',
    gpu: 'Adreno 830',
    ram: '12–16 GB',
    bionicCapable: true,
    hasAArch32: false,
    defaultVariant: 'bionic',
    defaultGraphicsDriver: 'wrapper-v2',
    defaultGraphicsDriverVersion: 'Turnip_Gen8_V23',
    bundledWineVersions: ['proton-10.0-arm64ec-2', 'proton-9.0-arm64ec'],
    bundledDriverVersions: [
      'Turnip_Gen8_V23',
      'Mr_Purple_T26',
      'turnip26.0.0_R8',
    ],
    notes:
      '32-bit ARM removed at the SoC/kernel level — Box86 is non-functional, 32-bit Windows games must run through FEX-Core in WoW64. Pin cpuListWoW64 to the prime cores (6-7).',
  },
  'A-': {
    tier: 'A-',
    label: 'A− — Last-gen flagship',
    soc: 'Snapdragon 8 Gen 3',
    gpu: 'Adreno 750',
    ram: '12 GB',
    bionicCapable: true,
    hasAArch32: false,
    defaultVariant: 'bionic',
    defaultGraphicsDriver: 'wrapper',
    defaultGraphicsDriverVersion: 'turnip26.0.0_R8',
    bundledWineVersions: ['proton-10.0-arm64ec-2', 'proton-9.0-arm64ec'],
    bundledDriverVersions: ['turnip26.0.0_R8', 'Turnip_Gen8_V23'],
    notes:
      'Most 8 Gen 3 phones also drop native AArch32 — treat like Tier A for 32-bit titles (force FEX-Core).',
  },
  B: {
    tier: 'B',
    label: 'B — High-end handheld',
    soc: 'Snapdragon 8 Gen 2 / G3x Gen 2',
    gpu: 'Adreno 740',
    ram: '8–16 GB',
    bionicCapable: true,
    hasAArch32: true,
    defaultVariant: 'bionic',
    defaultGraphicsDriver: 'wrapper',
    defaultGraphicsDriverVersion: 'turnip26.0.0_R8',
    bundledWineVersions: ['proton-9.0-arm64ec', 'proton-10.0-arm64ec-2'],
    bundledDriverVersions: ['turnip26.0.0_R8'],
    notes:
      'Sweet spot — keeps native AArch32 so Box64 + Box86 hybrid works for legacy 32-bit titles. Can outperform Tier A on 32-bit-heavy titles (no FEX-Core overhead).',
  },
  C: {
    tier: 'C',
    label: 'C — Mid-tier',
    soc: 'Snapdragon 865 / 870 / 8cx Gen 2',
    gpu: 'Adreno 650 / 660',
    ram: '6–8 GB',
    bionicCapable: true,
    hasAArch32: true,
    defaultVariant: 'bionic',
    defaultGraphicsDriver: 'wrapper',
    defaultGraphicsDriverVersion: 'turnip25.1.0',
    bundledWineVersions: ['proton-9.0-arm64ec'],
    bundledDriverVersions: ['turnip25.1.0', 'turnip26.0.0_R8'],
    notes:
      'Render below panel native (e.g. 540p internal upscaled to 1080p with CAS 30–50) is the universal performance lever here.',
  },
  D: {
    tier: 'D',
    label: 'D — Dimensity / Mali',
    soc: 'Dimensity 9000/8200/1100, Exynos 1380',
    gpu: 'Mali-G710 / G77 / G68',
    ram: '6–12 GB',
    bionicCapable: false,
    hasAArch32: true,
    defaultVariant: 'glibc',
    defaultGraphicsDriver: 'virgl',
    defaultGraphicsDriverVersion: 'virgl',
    bundledWineVersions: ['wine-9.2-x86_64', 'proton-9.0-x86_64'],
    bundledDriverVersions: ['virgl', 'vortek'],
    notes:
      'Glibc-only (Bionic Wine builds are not validated against Mali Vulkan ICDs). Must enable BCn texture emulation for DX9+ titles. DX12 / Vulkan-only titles will not run. DMA-Buf often crashes — fall back to resourceType=buffer.',
  },
  E: {
    tier: 'E',
    label: 'E — Legacy / budget',
    soc: 'A55/A76 LP cores',
    gpu: 'weak Mali (G57 / G52)',
    ram: '1–4 GB',
    bionicCapable: false,
    hasAArch32: true,
    defaultVariant: 'glibc',
    defaultGraphicsDriver: 'virgl',
    defaultGraphicsDriverVersion: 'virgl',
    bundledWineVersions: ['wine-9.2-x86_64'],
    bundledDriverVersions: ['virgl'],
    notes:
      'Realistically limited to 2D / DirectDraw / DX7-era titles.',
  },
};

export const DEVICES: Device[] = [
  // Tier A — Snapdragon 8 Elite
  { id: 'ayn-odin-3', name: 'AYN Odin 3', tier: 'A' },
  { id: 'rog-phone-9', name: 'Asus ROG Phone 9', tier: 'A' },
  { id: 'samsung-s25-ultra', name: 'Samsung Galaxy S25 Ultra', tier: 'A' },
  { id: 'samsung-fold-7', name: 'Samsung Galaxy Z Fold 7', tier: 'A' },
  { id: 'xiaomi-15-ultra', name: 'Xiaomi 15 Ultra', tier: 'A' },
  // Tier A− — Snapdragon 8 Gen 3
  { id: 'rog-phone-8-pro', name: 'Asus ROG Phone 8 Pro', tier: 'A-' },
  { id: 'pixel-9-pro', name: 'Google Pixel 9 Pro', tier: 'A-' },
  { id: 'oneplus-12', name: 'OnePlus 12', tier: 'A-' },
  { id: 'konkr-pocket-fit', name: 'Konkr Pocket Fit', tier: 'A-' },
  // Tier B — Snapdragon 8 Gen 2
  { id: 'ayn-odin-2', name: 'AYN Odin 2', tier: 'B' },
  { id: 'ayn-odin-2-pro', name: 'AYN Odin 2 Pro', tier: 'B' },
  { id: 'ayn-odin-2-portal', name: 'AYN Odin 2 Portal', tier: 'B' },
  { id: 'retroid-pocket-g2', name: 'Retroid Pocket G2', tier: 'B' },
  { id: 'anbernic-rg556', name: 'Anbernic RG556', tier: 'B' },
  { id: 'razer-edge', name: 'Razer Edge', tier: 'B' },
  // Tier C — Snapdragon 865 / 870
  { id: 'retroid-pocket-5', name: 'Retroid Pocket 5', tier: 'C' },
  { id: 'logitech-g-cloud', name: 'Logitech G Cloud', tier: 'C' },
  { id: 'gpd-xp-plus', name: 'GPD XP Plus', tier: 'C' },
  { id: 'ayaneo-pocket-s', name: 'AYANEO Pocket S', tier: 'C' },
  { id: 'ayaneo-pocket-air', name: 'AYANEO Pocket Air', tier: 'C' },
  { id: 'anbernic-rg-cube-xx', name: 'Anbernic RG Cube XX', tier: 'C' },
  // Tier D — Dimensity / Mali
  { id: 'anbernic-rg406v', name: 'Anbernic RG406V', tier: 'D' },
  { id: 'anbernic-rg405m', name: 'Anbernic RG405M', tier: 'D' },
  { id: 'ayaneo-pocket-micro', name: 'AYANEO Pocket Micro', tier: 'D' },
  { id: 'samsung-tab-s9-fe', name: 'Samsung Galaxy Tab S9 FE', tier: 'D' },
  { id: 'anbernic-rg-nano', name: 'Anbernic RG Nano', tier: 'D' },
  // Tier E — Legacy / budget
  { id: 'anbernic-rg-pocket-v', name: 'Anbernic RG Pocket V', tier: 'E' },
  { id: 'anbernic-rg35xx-h', name: 'Anbernic RG35XX-H', tier: 'E' },
];

export function tierOf(device: Device): DeviceTierInfo {
  return TIERS[device.tier];
}
