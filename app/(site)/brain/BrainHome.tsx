// Kid-facing Brain home. Reached from the Games card on /. Today's
// Activity used to sit at the top here, but / now hosts it as the hero;
// having it here too was redundant, so /brain shows just Badges +
// Explore (decided 2026-06-29). Layout matches /learn so the whole
// site reads as one design.

import Link from "next/link";
import { ChevronLeft, Flame, Lock } from "lucide-react";
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
}

export default function BrainHome({
  childName,
  stats,
  isPaid,
  isAnonymous,
  trialDays,
}: BrainHomeProps) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <BadgesCard isPaid={isPaid} isAnonymous={isAnonymous} stats={stats} />
          <ExploreCard isPaid={isPaid} />
        </div>

        {!isPaid && (
          <div className="max-w-2xl mx-auto">
            <UpgradeCta isAnonymous={isAnonymous} trialDays={trialDays} />
          </div>
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
    const cta = isAnonymous ? "Sign up free" : "Start Free Trial";
    return (
      <Link
        href={href}
        className="group h-full bg-white border border-gray-200 rounded-2xl p-8 shadow-lg flex flex-col items-center text-center hover:shadow-xl hover:scale-[1.02] hover:border-fuchsia-300 transition-all duration-200"
      >
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-5 grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
          <span className="text-5xl animate-heartbeat">🏅</span>
        </div>
        <h3 className="text-gray-800 text-xl font-bold mb-2">Badges</h3>
        <p className="text-gray-500 text-sm leading-relaxed flex-1">{subhead}</p>
        <span className="mt-auto inline-flex items-center gap-1.5 bg-fuchsia-600 text-white font-semibold px-6 py-2 rounded-full text-sm shadow-md group-hover:shadow-lg transition-shadow">
          <Lock className="w-3.5 h-3.5" strokeWidth={2.5} />
          {cta}
        </span>
      </Link>
    );
  }

  const headline = stats.nextTier
    ? `${stats.nextTier.emoji} ${stats.nextTier.name}`
    : "All Whales! 🐳";
  const progressText = stats.nextTier
    ? `${stats.setsToNext} more ${stats.setsToNext === 1 ? "game" : "games"}`
    : "Top of the ladder";
  const percent = stats.nextTier ? stats.percentToNext : 100;

  return (
    <Link
      href="/brain/badges"
      className="group h-full bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-8 shadow-lg flex flex-col items-center text-center hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
    >
      <div className="w-24 h-24 bg-white/25 rounded-full flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200">
        <span className="text-5xl animate-heartbeat">🏅</span>
      </div>
      <h3 className="text-white text-xl font-bold mb-2">Badges</h3>
      <p className="text-amber-50 text-sm leading-relaxed">Next: {headline}</p>
      <div className="mt-3 mb-2 h-2 w-full bg-white/25 rounded-full overflow-hidden">
        <div
          className="h-full bg-white rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-white/85 flex-1">{progressText}</p>
      <span className="mt-auto inline-block bg-white text-amber-700 font-semibold px-6 py-2 rounded-full text-sm shadow-md group-hover:shadow-lg transition-shadow">
        View
      </span>
    </Link>
  );
}

function ExploreCard({ isPaid }: { isPaid: boolean }) {
  return (
    <Link
      href="/brain/explore"
      className="group h-full bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-8 shadow-lg flex flex-col items-center text-center hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
    >
      <div className="w-24 h-24 bg-white/25 rounded-full flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200">
        <span className="text-5xl animate-bounce">🎮</span>
      </div>
      <h3 className="text-white text-xl font-bold mb-2">Explore</h3>
      <p className="text-emerald-50 text-sm leading-relaxed flex-1">
        {isPaid ? "14 games · play any one anytime" : "3 free games · 11 locked"}
      </p>
      <span className="mt-auto inline-block bg-white text-emerald-700 font-semibold px-6 py-2 rounded-full text-sm shadow-md group-hover:shadow-lg transition-shadow">
        Browse
      </span>
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
      className="mt-6 block rounded-2xl p-4 bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-[0_8px_24px_rgba(217,70,239,0.35)] hover:scale-[1.01] active:scale-[0.99] transition-transform"
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
