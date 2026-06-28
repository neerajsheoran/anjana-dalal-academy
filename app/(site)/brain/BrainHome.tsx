// Kid-facing Brain home — light/white-bg version (decided 2026-06-12
// after user feedback on the dark purple gradient feeling dull). The
// 3-card layout stays. Cards keep their gradients so they pop against
// white. Icons bumped to w-16/text-4xl per feedback.

import Link from "next/link";
import { ChevronLeft, ChevronRight, Flame, Lock } from "lucide-react";
import type { BrainStats } from "@/lib/brain-stats";

interface BrainHomeProps {
  childName: string;
  stats: BrainStats;
  isPaid: boolean;
  // Distinguishes "not logged in" (push to signup) from "logged-in but
  // expired" (push to payment). At product stage today we only nudge
  // signup; pricing is a later phase.
  isAnonymous: boolean;
  // Read from PlatformConfig.trialDays — currently 30 by default,
  // editable by admins. Drives the "Start N-day free trial" copy.
  trialDays: number;
  dailyComplete: boolean;
  dailyDoneCount: number;
}

export default function BrainHome({
  childName,
  stats,
  isPaid,
  isAnonymous,
  trialDays,
  dailyComplete,
  dailyDoneCount,
}: BrainHomeProps) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {!isPaid && (
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm mb-5"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
            Home
          </Link>
        )}
        <Header childName={childName} stats={stats} isPaid={isPaid} />

        <div className="space-y-4 mt-6">
          <DailyCard
            isPaid={isPaid}
            dailyDoneCount={dailyDoneCount}
            dailyComplete={dailyComplete}
          />
          <BadgesCard isPaid={isPaid} isAnonymous={isAnonymous} stats={stats} />
          <ExploreCard isPaid={isPaid} />
        </div>

        {!isPaid && (
          <UpgradeCta isAnonymous={isAnonymous} trialDays={trialDays} />
        )}
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
      <p className="text-purple-600 text-xs font-bold uppercase tracking-widest mb-1">
        Brain Training
      </p>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Hi {childName}!</h1>
      {isPaid && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-sm">
          <span className="text-lg">{stats.bestTier.emoji}</span>
          <span className="font-bold text-gray-800">{stats.bestTier.name}</span>
          {stats.streakDays > 0 && (
            <span className="inline-flex items-center gap-1 ml-1 text-orange-600">
              <span className="text-gray-300">·</span>
              <Flame className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span className="font-bold">{stats.streakDays}</span>
              <span className="text-orange-500/80">day{stats.streakDays === 1 ? "" : "s"}</span>
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
  return (
    <Link
      href="/brain/daily"
      className="group block rounded-3xl p-5 bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-[0_12px_28px_rgba(59,130,246,0.35)] hover:shadow-[0_16px_32px_rgba(59,130,246,0.45)] hover:scale-[1.02] active:scale-[0.99] transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/25 flex items-center justify-center shrink-0 text-4xl">
          🎯
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold leading-tight">
            Today&apos;s Activity
          </h3>
          <p className="text-sm text-white/85 mt-0.5">
            Memory · Focus · Thinking
          </p>
          <p className="text-xs text-white/75 mt-1.5">
            <span className="tracking-widest text-base">{dots.join(" ")}</span>
            <span className="ml-2">
              {isPaid
                ? dailyComplete
                  ? "All done today!"
                  : `${3 - dailyDoneCount} left`
                : "3 sample games · 15 mins"}
            </span>
          </p>
          {!isPaid && (
            <p className="text-[11px] text-white/65 mt-1.5 inline-flex items-center gap-1">
              <Lock className="w-3 h-3" strokeWidth={2.5} />
              Subscribe to save progress + earn badges
            </p>
          )}
        </div>
        <ChevronRight className="w-10 h-10 text-white shrink-0 self-center" strokeWidth={3.5} />
      </div>
    </Link>
  );
}

function BadgesCard({
  isPaid,
  isAnonymous,
  stats,
}: {
  isPaid: boolean;
  isAnonymous: boolean;
  stats: BrainStats;
}) {
  if (!isPaid) {
    // Logged-out → push signup. Logged-in-but-unsubscribed → push trial,
    // not "Sign up free" (they already have an account).
    const href = isAnonymous ? "/login" : "/pricing";
    const subhead = isAnonymous
      ? "Sign up to start earning badges"
      : "Start trial to start earning badges";
    const cta = isAnonymous ? "Sign up free →" : "Start free trial →";
    return (
      <Link
        href={href}
        className="group block rounded-3xl p-5 bg-white border border-gray-200 hover:border-fuchsia-300 hover:shadow-md transition-all"
      >
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0 text-4xl grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
            🏅
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-800 leading-tight">Badges</h3>
            <p className="text-sm text-gray-500 mt-0.5">{subhead}</p>
            <p className="text-xs text-fuchsia-700 font-semibold mt-1.5 inline-flex items-center gap-1">
              <Lock className="w-3 h-3" strokeWidth={2.5} />
              {cta}
            </p>
          </div>
          <ChevronRight className="w-10 h-10 text-fuchsia-500 shrink-0 self-center" strokeWidth={3.5} />
        </div>
      </Link>
    );
  }

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
      className="group block rounded-3xl p-5 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-[0_12px_28px_rgba(251,146,60,0.35)] hover:shadow-[0_16px_32px_rgba(251,146,60,0.45)] hover:scale-[1.02] active:scale-[0.99] transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/25 flex items-center justify-center shrink-0 text-4xl">
          🏅
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold leading-tight">Badges</h3>
          <p className="text-sm text-white/90 mt-0.5">Next: {headline}</p>
          <div className="mt-2 h-2 w-full bg-white/25 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-xs text-white/85 mt-1.5">{progressText}</p>
        </div>
        <ChevronRight className="w-10 h-10 text-white shrink-0 self-center" strokeWidth={3.5} />
      </div>
    </Link>
  );
}

function ExploreCard({ isPaid }: { isPaid: boolean }) {
  return (
    <Link
      href="/brain/explore"
      className="group block rounded-3xl p-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-[0_12px_28px_rgba(16,185,129,0.35)] hover:shadow-[0_16px_32px_rgba(16,185,129,0.45)] hover:scale-[1.02] active:scale-[0.99] transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/25 flex items-center justify-center shrink-0 text-4xl">
          🎮
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold leading-tight">Explore</h3>
          <p className="text-sm text-white/90 mt-0.5">
            {isPaid ? "14 games · play any anytime" : "3 free games · 11 locked"}
          </p>
        </div>
        <ChevronRight className="w-10 h-10 text-white shrink-0 self-center" strokeWidth={3.5} />
      </div>
    </Link>
  );
}

function UpgradeCta({
  isAnonymous,
  trialDays,
}: {
  isAnonymous: boolean;
  trialDays: number;
}) {
  // At product stage today we only push signup — money comes later.
  // Anonymous → free signup. Expired logged-in users still see /pricing
  // because they already have an account.
  const href = isAnonymous ? "/login?intent=signup" : "/pricing";
  const buttonLabel = isAnonymous
    ? "Sign up free →"
    : `Start ${trialDays}-day free trial →`;
  return (
    <Link
      href={href}
      className="mt-5 block rounded-2xl p-4 bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-[0_8px_24px_rgba(217,70,239,0.35)] hover:scale-[1.01] active:scale-[0.99] transition-transform"
    >
      <p className="text-sm font-bold leading-tight">✨ Unlock all 14 games</p>
      <p className="text-xs text-white/85 mt-1">
        Track progress · Win badges · Save streaks
      </p>
      <span className="inline-block mt-2 text-[11px] font-bold bg-white/25 px-2.5 py-1 rounded-full">
        {buttonLabel}
      </span>
    </Link>
  );
}
