// Brain Screen — single-tap-to-train layout.
//   - Brain image with pulsing colored glows over each lobe (visible cue
//     that those zones are tappable).
//   - Below the brain, 3 row-tile cards (Memory / Focus / Thinking) with
//     short descriptions — same destination as the lobes, two paths.
//   - Tapping anywhere goes straight to /brain/{module}, no two-step
//     "select then train" interaction.

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { BRAIN_MODULES, type ModuleKey } from '@/lib/brain-modules';

// Each lobe's tap zone (rectangular, percentages relative to the brain image)
// + the visible pulse-glow color. The brain image faces LEFT — front of head
// is on the left side, so Thinking and Focus sit at the top-left/top-middle.
const LOBES: {
  zone: ModuleKey;
  zonePct: { top: string; left: string; width: string; height: string };
  ringColor: string;
  dotColor: string;
  pingColor: string;
  ariaLabel: string;
}[] = [
  {
    zone: 'thinking',
    zonePct: { top: '12%', left: '15%', width: '32%', height: '30%' },
    ringColor: 'ring-orange-300/70',
    dotColor: 'bg-orange-500',
    pingColor: 'bg-orange-400',
    ariaLabel: 'Train Thinking',
  },
  {
    zone: 'focus',
    zonePct: { top: '8%', left: '42%', width: '32%', height: '30%' },
    ringColor: 'ring-green-300/70',
    dotColor: 'bg-green-500',
    pingColor: 'bg-green-400',
    ariaLabel: 'Train Focus',
  },
  {
    zone: 'memory',
    zonePct: { top: '45%', left: '20%', width: '55%', height: '30%' },
    ringColor: 'ring-purple-300/70',
    dotColor: 'bg-purple-500',
    pingColor: 'bg-purple-400',
    ariaLabel: 'Train Memory',
  },
];

// Tile order — matches the brand reading order Memory · Focus · Thinking.
const TILE_ORDER: ModuleKey[] = ['memory', 'focus', 'thinking'];

const TILE_GRADIENT: Record<ModuleKey, string> = {
  memory: 'from-purple-600 to-pink-600',
  focus: 'from-green-600 to-emerald-600',
  thinking: 'from-orange-600 to-amber-600',
};

const TILE_SHADOW: Record<ModuleKey, string> = {
  memory: 'shadow-[0_8px_24px_rgba(168,85,247,0.35)]',
  focus: 'shadow-[0_8px_24px_rgba(34,197,94,0.35)]',
  thinking: 'shadow-[0_8px_24px_rgba(251,146,60,0.35)]',
};

export default function BrainScreenClient({ childName }: { childName: string }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white py-10 px-4">
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="text-center mb-4">
          <p className="text-purple-300 text-xs font-semibold uppercase tracking-widest mb-1">
            Hi {childName}
          </p>
          <h1 className="text-2xl font-bold">Your Brain</h1>
          <p className="text-blue-200 text-xs mt-1">
            Tap a glowing part — or pick a card below
          </p>
        </div>

        {/* Brain visual: transparent base + pulsing glow markers as Links */}
        <div className="relative aspect-square w-full">
          <Image
            src="/images/brain/brain_base_transparent.png"
            alt="Brain"
            fill
            priority
            sizes="(max-width: 448px) 100vw, 448px"
            className="object-contain"
          />

          {/* Three pulsing tap zones — each is a Link covering a rectangular
              area, with a centered pulse-glow as the visible affordance. */}
          {LOBES.map((lobe) => (
            <Link
              key={lobe.zone}
              href={`/brain/${lobe.zone}`}
              aria-label={lobe.ariaLabel}
              className="absolute rounded-full focus:outline-none focus:ring-2 focus:ring-white/60 active:scale-95 transition-transform"
              style={lobe.zonePct}
            >
              {/* Centered glow indicator — purely visual, doesn't block taps */}
              <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="relative flex h-7 w-7">
                  {/* Outer expanding pulse */}
                  <span
                    className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${lobe.pingColor}`}
                  />
                  {/* Inner solid dot */}
                  <span
                    className={`relative inline-flex h-7 w-7 rounded-full ring-4 shadow-lg ${lobe.dotColor} ${lobe.ringColor}`}
                  />
                </span>
              </span>
            </Link>
          ))}
        </div>

        {/* Three tile cards — same destinations as the lobes, more obvious affordance.
            Always-visible descriptions so kids know what each pillar is. */}
        <div className="space-y-3 mt-2">
          {TILE_ORDER.map((zone) => {
            const mod = BRAIN_MODULES[zone];
            return (
              <Link
                key={zone}
                href={`/brain/${zone}`}
                className={`block rounded-2xl p-4 bg-gradient-to-r ${TILE_GRADIENT[zone]} ${TILE_SHADOW[zone]} hover:scale-[1.02] active:scale-[0.99] transition-transform`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl shrink-0">
                    {mod.emoji}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <h3 className="text-lg font-bold leading-tight">{mod.name}</h3>
                    <p className="text-xs sm:text-sm text-white/85 mt-0.5 leading-snug">
                      {mod.shortDescription}
                    </p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-white/70 shrink-0" strokeWidth={2.5} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
