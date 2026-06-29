// /brain/badges — Single master tier ladder for the kid's training.
// Refactored 2026-06-29: was 3 duplicate ladders (one per pillar) with
// the same 6 emojis repeated, which made each badge feel non-unique.
// Now one cumulative ladder driven by total games across all pillars.
// The per-pillar mix is shown below as a "training mix" breakdown so
// the kid still sees skill-level progress.

import Link from "next/link";
import { redirect } from "next/navigation";
import { getActiveChild } from "@/lib/active-child";
import { isTrainEligible } from "@/lib/train-eligibility";
import { getContentAccessLevel, hasFullAccess } from "@/lib/subscription";
import { getBrainStats } from "@/lib/brain-stats";
import { BRAIN_TIERS } from "@/lib/brain-tiers";
import { BRAIN_MODULES, type ModuleKey } from "@/lib/brain-modules";
import BackLink from "@/components/brain/BackLink";

const PILLAR_BAR_COLOR: Record<ModuleKey, string> = {
  memory:   "bg-purple-500",
  focus:    "bg-emerald-500",
  thinking: "bg-orange-500",
};

const PILLAR_ORDER: ModuleKey[] = ["memory", "focus", "thinking"];

export default async function BadgesPage() {
  const activeChild = await getActiveChild();
  if (!activeChild) redirect("/kids");
  if (!isTrainEligible(activeChild.classId)) {
    redirect(activeChild.classId ? `/class/${activeChild.classId}` : "/");
  }
  const accessLevel = await getContentAccessLevel(activeChild.parentUid);
  const isPaid = hasFullAccess(accessLevel);
  const stats = isPaid
    ? await getBrainStats(activeChild.parentUid, activeChild.id)
    : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-amber-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <BackLink href="/brain" label="Brain" />

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Badges</h1>
          <p className="text-sm text-gray-500">
            {isPaid
              ? "One ladder · play any pillar to climb · 150 sets to crown Whale"
              : "Subscribe to start earning badges and the physical certificate."}
          </p>
        </div>

        {!isPaid ? <FreeLockedView /> : <PaidView stats={stats!} />}
      </div>
    </main>
  );
}

function PaidView({ stats }: { stats: NonNullable<Awaited<ReturnType<typeof getBrainStats>>> }) {
  return (
    <div className="space-y-6">
      <MasterLadder
        currentTierKey={stats.bestTier.key}
        totalSets={stats.totalSets}
      />

      <NextTierProgress
        currentName={stats.bestTier.name}
        currentEmoji={stats.bestTier.emoji}
        nextName={stats.nextTier?.name ?? null}
        nextEmoji={stats.nextTier?.emoji ?? null}
        setsToNext={stats.setsToNext}
        percentToNext={stats.percentToNext}
      />

      <TrainingMix stats={stats} />

      <div className="text-center pt-2">
        <Link
          href="/brain/explore"
          className="inline-flex items-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold px-6 py-3 rounded-full shadow-md hover:shadow-lg transition-all"
        >
          <span className="text-lg">🎮</span>
          Play to climb the ladder
        </Link>
      </div>
    </div>
  );
}

function MasterLadder({
  currentTierKey,
  totalSets,
}: {
  currentTierKey: string;
  totalSets: number;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-gray-100">
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 text-center">
        Master Ladder
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {BRAIN_TIERS.map((tier) => {
          const unlocked = totalSets >= tier.threshold;
          const isCurrent = tier.key === currentTierKey;
          return (
            <div
              key={tier.key}
              className={`flex flex-col items-center text-center p-3 rounded-xl border-2 transition-all ${
                isCurrent
                  ? "border-amber-400 bg-amber-50"
                  : unlocked
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-gray-100 bg-gray-50"
              }`}
            >
              <span
                className={`text-4xl mb-1 ${
                  unlocked ? "" : "grayscale opacity-30"
                } ${isCurrent ? "animate-bounce" : ""}`}
              >
                {tier.emoji}
              </span>
              <p
                className={`text-xs font-bold ${
                  isCurrent
                    ? "text-amber-700"
                    : unlocked
                      ? "text-emerald-700"
                      : "text-gray-400"
                }`}
              >
                {tier.name}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">{tier.threshold}</p>
              {isCurrent && (
                <p className="text-[10px] font-semibold text-amber-600 mt-0.5">
                  you&rsquo;re here!
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NextTierProgress({
  currentName,
  currentEmoji,
  nextName,
  nextEmoji,
  setsToNext,
  percentToNext,
}: {
  currentName: string;
  currentEmoji: string;
  nextName: string | null;
  nextEmoji: string | null;
  setsToNext: number;
  percentToNext: number;
}) {
  if (!nextName) {
    return (
      <div className="bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl p-6 md:p-8 shadow-lg text-white text-center">
        <p className="text-5xl mb-2">{currentEmoji}</p>
        <p className="text-xl font-bold">All tiers unlocked!</p>
        <p className="text-sm text-amber-50 mt-1">
          You&rsquo;re a {currentName}. Keep playing for fun. 🎉
        </p>
      </div>
    );
  }
  return (
    <div className="bg-gradient-to-br from-purple-600 to-fuchsia-700 rounded-2xl p-6 md:p-8 shadow-lg text-white">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="text-sm font-semibold text-purple-100 uppercase tracking-wider">
          Next tier
        </p>
        <p className="text-sm font-bold text-white">{percentToNext}%</p>
      </div>
      <div className="flex items-center gap-4 mb-3">
        <span className="text-4xl">{nextEmoji}</span>
        <div>
          <p className="text-2xl font-bold leading-none">{nextName}</p>
          <p className="text-sm text-purple-100 mt-1">
            {setsToNext} more {setsToNext === 1 ? "game" : "games"} to unlock
          </p>
        </div>
      </div>
      <div className="h-3 w-full bg-white/25 rounded-full overflow-hidden">
        <div
          className="h-full bg-white rounded-full transition-all"
          style={{ width: `${percentToNext}%` }}
        />
      </div>
    </div>
  );
}

function TrainingMix({
  stats,
}: {
  stats: NonNullable<Awaited<ReturnType<typeof getBrainStats>>>;
}) {
  const max = Math.max(
    stats.memory.setsCount,
    stats.focus.setsCount,
    stats.thinking.setsCount,
    10, // floor so single-set bars don't fill the row
  );
  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-gray-100">
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 text-center">
        Your Training Mix
      </h2>
      <div className="space-y-4">
        {PILLAR_ORDER.map((key) => {
          const mod = BRAIN_MODULES[key];
          const setsCount = stats[key].setsCount;
          const widthPct = Math.round((setsCount / max) * 100);
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{mod.emoji}</span>
                  <span className="text-sm font-bold text-gray-800">
                    {mod.name}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-600">
                  {setsCount} {setsCount === 1 ? "set" : "sets"}
                </span>
              </div>
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${PILLAR_BAR_COLOR[key]} rounded-full transition-all`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-gray-400 text-center mt-4">
        Any pillar counts toward the ladder · play a balanced mix to grow faster
      </p>
    </div>
  );
}

function FreeLockedView() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-3xl mx-auto mb-3">
        🔒
      </div>
      <p className="text-base font-bold text-gray-800 mb-1">Badges are a subscriber perk</p>
      <p className="text-sm text-gray-500 mb-5">
        Climb 6 tiers — from 🐸 Tadpole to 🐳 Whale. Every quarter, the top
        milestone earns a physical certificate.
      </p>
      <Link
        href="/pricing"
        className="inline-block bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold px-5 py-2.5 rounded-full text-sm"
      >
        Start 3-day free trial →
      </Link>
    </div>
  );
}
