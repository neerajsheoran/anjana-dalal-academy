// Brain Screen — single-tap-to-train layout.
//   - Brain image with pulsing colored glows over each lobe (visible cue
//     that those zones are tappable).
//   - Below the brain, 3 row-tile cards (Memory / Focus / Thinking) with
//     short descriptions — same destination as the lobes, two paths.
//   - Tapping anywhere goes straight to /brain/{module}, no two-step
//     "select then train" interaction.

import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronRight,
  Brain,
  Target,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react';
import { BRAIN_MODULES, type ModuleKey } from '@/lib/brain-modules';

// Each lobe's tap zone (rectangular, percentages relative to the brain image)
// + the visible pulse-glow color + the icon that lives inside the dot. The
// brain image faces LEFT — front of head is on the left side, so Thinking
// and Focus sit at the top-left/top-middle.
const LOBES: {
  zone: ModuleKey;
  zonePct: { top: string; left: string; width: string; height: string };
  ringColor: string;
  dotColor: string;
  pingColor: string;
  ariaLabel: string;
  icon: LucideIcon;
  delay: string;   // staggered animation delay so the 3 hearts don't sync
}[] = [
  {
    zone: 'thinking',
    zonePct: { top: '12%', left: '15%', width: '32%', height: '30%' },
    ringColor: 'ring-orange-300/70',
    dotColor: 'bg-orange-500',
    pingColor: 'bg-orange-400',
    ariaLabel: 'Train Thinking',
    icon: Lightbulb,
    delay: '0s',
  },
  {
    zone: 'focus',
    zonePct: { top: '8%', left: '42%', width: '32%', height: '30%' },
    ringColor: 'ring-green-300/70',
    dotColor: 'bg-green-500',
    pingColor: 'bg-green-400',
    ariaLabel: 'Train Focus',
    icon: Target,
    delay: '0.45s',
  },
  {
    zone: 'memory',
    zonePct: { top: '45%', left: '20%', width: '55%', height: '30%' },
    ringColor: 'ring-purple-300/70',
    dotColor: 'bg-purple-500',
    pingColor: 'bg-purple-400',
    ariaLabel: 'Train Memory',
    icon: Brain,
    delay: '0.9s',
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

// Each tile emoji gets its own animation rhythm so the page feels alive
// (mirrors /learn page pattern). animate-bounce / wiggle / heartbeat all
// live in app/globals.css.
const TILE_EMOJI_ANIM: Record<ModuleKey, string> = {
  memory: 'animate-bounce',
  focus: 'animate-wiggle',
  thinking: 'animate-heartbeat',
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

        {/* Brain visual: transparent base + pulsing glow markers as Links.
            The base brain "breathes" via a slow scale animation so it feels
            alive. Lobe markers are 56px coloured dots with the pillar icon
            inside, expanding pulse ring outside, and a staggered heartbeat
            so the three dots don't peak together. */}
        <div className="relative aspect-square w-full">
          <Image
            src="/images/brain/brain_base_transparent.png"
            alt="Brain"
            fill
            priority
            sizes="(max-width: 448px) 100vw, 448px"
            className="object-contain animate-breathe"
          />

          {LOBES.map((lobe) => {
            const Icon = lobe.icon;
            return (
              <Link
                key={lobe.zone}
                href={`/brain/${lobe.zone}`}
                aria-label={lobe.ariaLabel}
                className="absolute rounded-full focus:outline-none focus:ring-2 focus:ring-white/60 active:scale-95 transition-transform group"
                style={lobe.zonePct}
              >
                {/* Centered marker — bigger now (56px), icon inside, dramatic
                    pulse ring, staggered heartbeat on the dot itself. */}
                <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="relative flex h-14 w-14">
                    {/* Outer expanding pulse — visual cue "tap here" */}
                    <span
                      className={`absolute inline-flex h-full w-full rounded-full opacity-50 animate-ping ${lobe.pingColor}`}
                      style={{ animationDelay: lobe.delay }}
                    />
                    {/* Inner dot with the pillar icon */}
                    <span
                      className={`relative inline-flex h-14 w-14 rounded-full ring-4 shadow-xl animate-heartbeat items-center justify-center ${lobe.dotColor} ${lobe.ringColor} group-hover:scale-110 transition-transform`}
                      style={{ animationDelay: lobe.delay }}
                    >
                      <Icon className="w-6 h-6 text-white" strokeWidth={2.25} />
                    </span>
                  </span>
                </span>
              </Link>
            );
          })}
        </div>

        {/* Three tile cards — same destinations as the lobes, more obvious
            affordance. Each tile emoji has its own animation rhythm
            (bounce / wiggle / heartbeat) so the page feels alive. */}
        <div className="space-y-3 mt-2">
          {TILE_ORDER.map((zone) => {
            const mod = BRAIN_MODULES[zone];
            return (
              <Link
                key={zone}
                href={`/brain/${zone}`}
                className={`group block rounded-2xl p-4 bg-gradient-to-r ${TILE_GRADIENT[zone]} ${TILE_SHADOW[zone]} hover:scale-[1.02] active:scale-[0.99] transition-transform`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <span className={`text-3xl ${TILE_EMOJI_ANIM[zone]}`}>
                      {mod.emoji}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <h3 className="text-lg font-bold leading-tight">{mod.name}</h3>
                    <p className="text-xs sm:text-sm text-white/85 mt-0.5 leading-snug">
                      {mod.shortDescription}
                    </p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-white/70 shrink-0" strokeWidth={2.5} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
