import { Wizard } from './components/Wizard';

export default function App() {
  return (
    <div className="mx-auto min-h-full max-w-4xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          GameNative Configuration Builder
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Pick your Android device, your target PC game, and your priorities —
          get a GameNative-ready <code>.container</code> config. Curated
          per-title profiles are the fast path; a heuristics engine handles
          everything else; a validation pass catches device/config conflicts.
        </p>
      </header>
      <Wizard />
      <footer className="mt-10 border-t border-edge pt-4 text-xs text-slate-600">
        Offline tool — no telemetry, no cloud sync. Knowledge snapshot derived
        from Winlator/GameNative internals, EmuReady, gamenative.app/compatibility
        and Ryan Retro benchmarks. Verify versions are downloaded on-device
        before importing (GameNative Issue #580).
      </footer>
    </div>
  );
}
