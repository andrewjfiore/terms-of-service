# Handoff — GameNative Configuration Builder

## What this is

A pure client-side **Vite + React + TypeScript** SPA that resolves an Android
device + target PC game + user priorities into a downloadable GameNative
`.container` config. Knowledge is bundled offline (no scraper, no backend).

- **Repo:** `andrewjfiore/terms-of-service` (the repo name is unrelated — it
  also holds an SMS/privacy README that must be left intact)
- **Branch:** `claude/gaming-device-platform-input-hRlz3` (4 commits past
  `main`, no PR opened)
- **Status:** feature-complete, three review passes (build → correctness →
  simplify); 19/19 tests pass; `tsc`, ESLint, and `vite build` are all clean

## Get it running

```bash
git checkout claude/gaming-device-platform-input-hRlz3
npm install
npm run dev      # http://localhost:5173
npm test         # vitest (resolver + e2e wizard)
npm run build    # tsc -b && vite build -> dist/
npm run lint
```

Node 22 / npm 10. No environment variables. No backend.

## Architecture in one breath

```
device + game + priorities
  -> base config from tier defaults              (data/defaults.ts)
  -> stage 1: curated DB override                (resolver/curated.ts)
     OR stage 2: heuristic rules                 (resolver/heuristicEngine.ts)
  -> priority overlay                            (data/priorities.ts)
  -> stage 3: validate + auto-correct            (resolver/validate.ts)
  -> serialize nested maps to .container JSON    (resolver/serialize.ts)
```

Orchestrator: `src/resolver/resolve.ts`. UI wizard wraps it via
`src/components/Wizard.tsx`.

## File map (what to edit for common tasks)

| You want to… | Edit |
|---|---|
| Add a curated game | `src/data/games.json` (validated at load; runtime check throws on a bad entry) |
| Add a device | `src/data/devices.ts` (`DEVICES` array; tier must exist in `TIERS`) |
| Add/modify a device tier | `src/data/devices.ts` `TIERS` + `bundledWineVersions`/`bundledDriverVersions` |
| Change a heuristic rule | `src/data/heuristics.ts` (ordered; later rules refine earlier) |
| Change a priority's overrides | `src/data/priorities.ts` |
| Add a validator / auto-correction | `src/resolver/validate.ts` |
| Touch the `.container` schema | `src/types/container.ts` + `src/resolver/serialize.ts` |
| Add an Engine/API/DRM/AntiCheat string | `src/types/enums.ts` (single source — types derive from here) |

Shared helpers worth knowing:
- `src/data/devices.ts` → `isMali` / `isAdreno` / `MALI_TIERS` / `ADRENO_TIERS`
- `src/data/textMatch.ts` → `slug` + anchored `titlesMatch`
- `src/resolver/merge.ts` → `applyOverride` (nested map + extras shallow-merge,
  `envVars`/`wincomponents` union-merge, everything else replace)

## Source of knowledge

The whole data layer is derived from the research foundation PDF at
`/root/.claude/uploads/f3ac8acf-9a87-4c86-8d7d-9aa7d48a5cee/02485e96-GameNative_Configuration_Builder__Schema_Heuristics_and_Device_Tier_Reference.pdf`
(21 pages). When the GameNative codebase or the community sites change,
re-read the relevant section and update the matching data module.

External references the data was drawn from:
- `github.com/utkarshdalal/GameNative` (`ContainerData.kt`, `Container.java`,
  `ContainerUtils.kt`, `arrays.xml`, `DefaultVersion.java`)
- `gamenative.app/compatibility`, EmuReady, Ryan Retro benchmarks
- Joey's Retro Handhelds GameNative setup guide

## Known gaps / open next steps

Ranked by value. Pick whichever the project needs:

1. **Real-browser QA of the manual-metadata + priority paths.** The e2e
   test (`src/components/__tests__/wizard.test.tsx`) covers only the
   curated Elden Ring golden path. The manual form, sliders, and download
   button have only been verified to render and typecheck. Run `npm run
   dev` in a real browser, or add component tests for the manual flow.
2. **Schema verification against a real export.** Per the research caveats,
   `ContainerData` field *names* are authoritative but the exact PR #649
   export file structure (extension, whether `extras` is nested vs
   flattened, exact enum strings from `arrays.xml`) was never confirmed
   against an actual export. Export one container from the app on a real
   device and diff it against our output before shipping for sideloading.
3. **Curated DB is 18 titles.** Extensible loader is in place; growing
   coverage is now a data-only task (append to `games.json`).
4. **No deployment.** Builds to static `dist/`; not wired to GitHub Pages
   or any host.
5. **Cloud "known config" sync** (the `BestConfigService` endpoint) is
   intentionally out of scope (future work, per spec).

## Things that look weird but are intentional

- **Default `wineVersion` is the older bundled Proton**, not the newest
  (`proton-9.0-arm64ec` rather than `proton-10.0-arm64ec-2`). This is
  deliberate — GameNative Issue #580: an un-bundled Proton crashes the
  launch. The validator warns if a recommended version isn't in the
  device's bundled list.
- **"AI upscaling" is two sliders + a toggle**, never labeled DLSS or
  FSR. GameNative does not bundle either — the upscaling pipeline is
  render-below-native + CAS sharpening, and the toggle is LSFG-VK frame
  *interpolation* (requires the user's own Lossless Scaling Steam licence,
  app 993090).
- **The repo name is `terms-of-service`** and `README.md` is an unrelated
  SMS consent / privacy policy. Leave that file alone.
- **The resolver always honours the explicit user selection** over title
  text. `curatedId` (set when the user clicks a suggestion) wins; `manual:
  true` (set by the manual-metadata form) forces heuristics even if the
  title collides with a curated entry. This is regression-tested.
- **`graphicsDriverConfig` / `dxwrapperConfig` are nested objects in
  React state and only collapse to the comma-separated `key=value` string
  at export.** This mirrors what the GameNative Compose UI does.

## Pre-ship checklist

```bash
npm test                                   # 19/19 must pass
npm run lint                                # 0 warnings
npm run build                               # clean tsc + vite build
```

Then click through the wizard in a real browser, export a `.container`
from the app, and confirm it imports cleanly into GameNative on at least
one Tier A and one Tier D device.

## Quick test recipes

If you're verifying the resolver after a change, these golden paths in
`src/resolver/__tests__/resolve.test.ts` are the load-bearing ones:

- **Curated fast path**: Elden Ring on AYN Odin 3 → Bionic + Proton 10
  + VKD3D + FEX-Core; no blocking errors.
- **Heuristic + validator block**: unknown UE5 DX12 game on Anbernic
  RG406V (Mali) → glibc forced, DX12 error, coherent virgl driver pair.
- **32-bit auto-force**: Dead Space + stability priority on Tier A →
  emulator FEX-Core (Box86 is non-functional on 8 Elite).
- **Manual-collision regression**: title "Elden Ring" with `manual: true`
  + OpenGL/Unity meta → heuristic path, not curated.
- **Priority coherence**: stability priority on a curated Bionic profile
  → driver reconciled from `wrapper-v2` to `turnip` for the glibc container.

## Commits on this branch

```
076f8a2  Simplify: dedupe shared helpers, remove redundant state, fix latent bug
6291604  Fix resolver correctness issues found in second-pass review
47bf4af  Add GameNative Configuration Builder web app
```
