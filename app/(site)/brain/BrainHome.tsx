// Kid-facing Brain home — the 3-card layout decided 2026-06-12.
//
// Three big destinations:
//   🎯 Today's Activity  → /brain/daily
//   🏅 Badges            → (next phase — placeholder for now)
//   🎮 Explore           → /brain/explore
//
// Two variants:
//   - PAID (hasFullAccess): real progress, real streak, real crest
//   - FREE: same shape, but Daily is preview-only, Badges padlocked,
//           Explore shows "3 free, 11 locked", bottom CTA banner.
//
// Server-rendered. Client interactivity lives in the locked-game modal
// (separate component), not here.

import Link from "next/link";
import { ChevronRight, Flame, Lock } from "lucide-react";
import type { BrainStats } from "@/lib/brain-stats";

interface BrainHomeProps {
  childName: string;
  stats: BrainStats;
  isPaid: boolean;
  dailyComplete: boolean;    // all 3 pillars touched today
  dailyDoneCount: number;    // 0..3
}

export default function BrainHome({
  childName,
  stats,
  isPaid,
  dailyComplete,
  dailyDoneCount,
}: BrainHomeProps) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white py-8 px-4">
      <div className="max-w-md mx-auto">
        <Header childName={childName} stats={stats} isPaid={isPaid} />

        <div className="space-y-3 mt-6">
          <DailyCard
            isPaid={isPaid}
            dailyDoneCount={dailyDoneCount}
            dailyComplete={dailyComplete}
          />
          <BadgesCard isPaid={isPaid} stats={stats} />
          <ExploreCard isPaid={isPaid} />
        </div>

        {!isPaid && <UpgradeCta />}
      </div>
    </main>
  );
}

function Header({
  childName,
  stats,
  isPaid,
}: {
  childName: string;
  stats: BrainStats;
  isPaid: boolean;
}) {
  return (
    <div className="text-center">
      <p className="text-purple-200 text-xs font-semibold uppercase tracking-widest mb-1">
        Brain Training
      </p>
      <h1 className="text-2xl font-bold mb-2">Hi {childName}!</h1>
      {isPaid && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-sm">
          <span className="text-base">{stats.bestTier.emoji}</span>
          <span className="font-semibold">{stats.bestTier.name}</span>
          {stats.streakDays > 0 && (
            <span className="inline-flex items-center gap-0.5 ml-1 text-orange-300">
              <span>·</span>
              <Flame className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span className="font-bold">{stats.streakDays}</span>
              <span className="text-orange-200/80 ml-0.5">day{stats.streakDays === 1 ? "" : "s"}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function DailyCard({
  isPaid,
  dailyDoneCount,
  dailyComplete,
}: {
  isPaid: boolean;
  dailyDoneCount: number;
  dailyComplete: boolean;
}) {
  const dots = ["○", "○", "○"];
  for (let i = 0; i < dailyDoneCount && i < 3; i++) dots[i] = "●";
  const ctaLabel = !isPaid
    ? "Try now"
    : dailyComplete
      ? "Replay"
      : dailyDoneCount > 0
        ? "Continue"
        : "Start";
  return (
    <Link
      href="/brain/daily"
      className="group block rounded-2xl p-5 bg-gradient-to-br from-indigo-600 to-blue-700 shadow-[0_8px_24px_rgba(59,130,246,0.35)] hover:scale-[1.02] active:scale-[0.99] transition-transform"
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 text-3xl">
          🎯
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold leading-tight">
            Today&apos;s Activity
          </h3>
          <p className="text-xs sm:text-sm text-white/80 mt-0.5">
            Memory · Focus · Thinking
          </p>
          <p className="text-xs text-white/70 mt-1">
            <span className="tracking-widest">{dots.join(" ")}</span>
            <span className="ml-2">
              {isPaid
                ? dailyComplete
                  ? "All done today!"
                  : `${3 - dailyDoneCount} left`
                : "3 sample games · 15 mins"}
            </span>
          </p>
          {!isPaid && (
            <p className="text-[11px] text-white/60 mt-1.5 inline-flex items-center gap-1">
              <Lock className="w-3 h-3" strokeWidth={2.5} />
              Subscribe to save progress + earn badges
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <ChevronRight className="w-6 h-6 text-white/70" strokeWidth={2.5} />
          <span className="text-[11px] font-semibold bg-white/15 px-2 py-0.5 rounded-full">
            {ctaLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}

function BadgesCard({ isPaid, stats }: { isPaid: boolean; stats: BrainStats }) {
  if (!isPaid) {
    return (
      <div className="block rounded-2xl p-5 bg-white/5 border border-white/10 opacity-90">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 text-3xl">
            🏅
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold leading-tight">Badges</h3>
            <p className="text-xs text-white/70 mt-0.5">
              Subscribe to start earning badges
            </p>
          </div>
          <Lock className="w-5 h-5 text-white/40 shrink-0" strokeWidth={2.5} />
        </div>
      </div>
    );
  }

  // Pick the pillar closest to its next tier as the "next badge" headline.
  const pillars: Array<{ name: string; pillar: BrainStats["memory"] }> = [
    { name: "Memory",   pillar: stats.memory },
    { name: "Focus",    pillar: stats.focus },
    { name: "Thinking", pillar: stats.thinking },
  ];
  const closestNext = pillars
    .filter((p) => p.pillar.next !== null)
    .sort((a, b) => b.pillar.percentToNext - a.pillar.percentToNext)[0];
  const headline = closestNext
    ? `${closestNext.pillar.next!.emoji} ${closestNext.pillar.next!.name}`
    : "All Whales! 🐳";
  const progressText = closestNext
    ? `${closestNext.pillar.setsToNext} more in ${closestNext.name.toLowerCase()}`
    : "All pillars maxed";
  const percent = closestNext ? closestNext.pillar.percentToNext : 100;

  return (
    <Link
      href="/brain/badges"
      className="group block rounded-2xl p-5 bg-gradient-to-br from-amber-500 to-orange-600 shadow-[0_8px_24px_rgba(251,146,60,0.35)] hover:scale-[1.02] active:scale-[0.99] transition-transform"
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 text-3xl">
          🏅
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold leading-tight">Badges</h3>
          <p className="text-xs text-white/85 mt-0.5">Next: {headline}</p>
          <div className="mt-2 h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-[11px] text-white/80 mt-1">{progressText}</p>
        </div>
        <ChevronRight className="w-6 h-6 text-white/70 shrink-0" strokeWidth={2.5} />
      </div>
    </Link>
  );
}

function ExploreCard({ isPaid }: { isPaid: boolean }) {
  return (
    <Link
      href="/brain/explore"
      className="group block rounded-2xl p-5 bg-gradient-to-br from-emerald-600 to-teal-700 shadow-[0_8px_24px_rgba(16,185,129,0.35)] hover:scale-[1.02] active:scale-[0.99] transition-transform"
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 text-3xl">
          🎮
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold leading-tight">Explore</h3>
          <p className="text-xs text-white/85 mt-0.5">
            {isPaid ? "14 games · play any anytime" : "3 free games · 11 locked"}
          </p>
        </div>
        <ChevronRight className="w-6 h-6 text-white/70 shrink-0" strokeWidth={2.5} />
      </div>
    </Link>
  );
}

function UpgradeCta() {
  return (
    <Link
      href="/pricing"
      className="mt-5 block rounded-2xl p-4 bg-gradient-to-r from-fuchsia-600 to-pink-600 shadow-[0_8px_24px_rgba(217,70,239,0.4)] hover:scale-[1.01] active:scale-[0.99] transition-transform"
    >
      <p className="text-sm font-bold leading-tight">
        ✨ Unlock all 14 games
      </p>
      <p className="text-xs text-white/85 mt-1">
        Track progress · Win badges · Save streaks
      </p>
      <span className="inline-block mt-2 text-[11px] font-bold bg-white/20 px-2.5 py-1 rounded-full">
        Start 3-day free trial →
      </span>
    </Link>
  );
}
