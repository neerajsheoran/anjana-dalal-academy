// /achievements — the kid's trophy room. Celebration-only by design:
// big counts, badge ladder, per-pillar tier, streak. No quiz scores,
// no failure framing, no "you need work in X" — that lives on the
// parent dashboard. Decided 2026-06-29.

import Link from "next/link";
import { redirect } from "next/navigation";
import { getActiveChild } from "@/lib/active-child";
import { getAchievementsData } from "@/lib/achievements";
import { BRAIN_TIERS } from "@/lib/brain-tiers";
import { BRAIN_MODULES, type ModuleKey } from "@/lib/brain-modules";
import BackLink from "@/components/brain/BackLink";

export const dynamic = "force-dynamic";

const PILLAR_GRADIENT: Record<ModuleKey, string> = {
  memory:   "from-purple-600 to-pink-600",
  focus:    "from-emerald-600 to-teal-600",
  thinking: "from-orange-500 to-amber-600",
};

const PILLAR_ORDER: ModuleKey[] = ["memory", "focus", "thinking"];

export default async function AchievementsPage() {
  const activeChild = await getActiveChild();
  if (!activeChild) redirect("/login");

  const data = await getAchievementsData(activeChild.parentUid, activeChild.id);
  const { brainStats, totalDaysActive, longestStreak, chaptersRead, chaptersCompleted } = data;

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-amber-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <BackLink href="/" label="Home" />

        {/* Hero */}
        <div className="text-center mb-10">
          <p className="text-amber-600 text-xs font-bold uppercase tracking-widest mb-2">
            Trophy Room
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
            <span className="inline-block animate-wiggle mr-2">🏆</span>
            {activeChild.name}&rsquo;s Achievements
          </h1>
          <p className="text-sm text-gray-500">
            All the games played, badges earned, and chapters explored.
          </p>
        </div>

        {/* Stats trio */}
        <section className="mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatTile
              icon="🎮"
              animation="animate-bounce"
              value={brainStats.totalSets}
              label="games played"
              gradient="from-purple-500 to-fuchsia-600"
            />
            <StatTile
              icon="📅"
              animation="animate-heartbeat"
              value={totalDaysActive}
              label="active days"
              gradient="from-emerald-500 to-teal-600"
            />
            <StatTile
              icon="📚"
              animation="animate-wiggle"
              value={chaptersRead}
              label={chaptersRead === 1 ? "chapter explored" : "chapters explored"}
              gradient="from-blue-500 to-indigo-600"
              sublabel={chaptersCompleted > 0 ? `${chaptersCompleted} completed` : undefined}
            />
          </div>
        </section>

        {/* Streak */}
        {(brainStats.streakDays > 0 || longestStreak > 0) && (
          <section className="mb-10">
            <SectionLabel>Streak</SectionLabel>
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 md:p-8 shadow-lg text-white">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-white/25 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-5xl animate-heartbeat">🔥</span>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <p className="text-3xl md:text-4xl font-extrabold leading-none">
                    {brainStats.streakDays} {brainStats.streakDays === 1 ? "day" : "days"}
                  </p>
                  <p className="text-orange-100 text-sm mt-1">current streak</p>
                  {longestStreak > brainStats.streakDays && (
                    <p className="text-xs text-white/85 mt-2">
                      🏅 personal best: {longestStreak} days
                    </p>
                  )}
                  {longestStreak === brainStats.streakDays && longestStreak > 0 && (
                    <p className="text-xs font-bold text-white/95 mt-2">
                      ✨ this IS your personal best!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tier ladder */}
        <section className="mb-10">
          <SectionLabel>Your Tier Ladder</SectionLabel>
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-gray-100">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {BRAIN_TIERS.map((tier) => {
                const unlocked = brainStats.bestTier.threshold >= tier.threshold;
                const isCurrent = tier.key === brainStats.bestTier.key;
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
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {tier.threshold}
                    </p>
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
        </section>

        {/* Next tier — focal card that used to live on /brain/badges
            before that page was collapsed into here. Shows the upcoming
            badge prominently so the kid knows what they're working toward. */}
        {brainStats.nextTier ? (
          <section className="mb-10">
            <SectionLabel>Next Tier</SectionLabel>
            <div className="bg-gradient-to-br from-purple-600 to-fuchsia-700 rounded-2xl p-6 md:p-8 shadow-lg text-white">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <p className="text-sm font-semibold text-purple-100 uppercase tracking-wider">
                  Coming up
                </p>
                <p className="text-sm font-bold text-white">
                  {brainStats.percentToNext}%
                </p>
              </div>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-5xl">{brainStats.nextTier.emoji}</span>
                <div>
                  <p className="text-2xl font-bold leading-none">
                    {brainStats.nextTier.name}
                  </p>
                  <p className="text-sm text-purple-100 mt-1">
                    {brainStats.setsToNext} more {brainStats.setsToNext === 1 ? "game" : "games"} to unlock
                  </p>
                </div>
              </div>
              <div className="h-3 w-full bg-white/25 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${brainStats.percentToNext}%` }}
                />
              </div>
            </div>
          </section>
        ) : (
          <section className="mb-10">
            <div className="bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl p-6 md:p-8 shadow-lg text-white text-center">
              <p className="text-5xl mb-2">{brainStats.bestTier.emoji}</p>
              <p className="text-xl font-bold">All tiers unlocked!</p>
              <p className="text-sm text-amber-50 mt-1">
                You&rsquo;re a {brainStats.bestTier.name}. Keep playing for fun. 🎉
              </p>
            </div>
          </section>
        )}

        {/* Training mix — pillar set counts, all feeding the same master
            ladder. Width is relative to the largest pillar (or 10, whichever
            is bigger) so a 2-set pillar doesn't fill the whole row. */}
        <section className="mb-10">
          <SectionLabel>Your Training Mix</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PILLAR_ORDER.map((key) => {
              const mod = BRAIN_MODULES[key];
              const pillar = brainStats[key];
              const max = Math.max(
                brainStats.memory.setsCount,
                brainStats.focus.setsCount,
                brainStats.thinking.setsCount,
                10,
              );
              const widthPct = Math.round((pillar.setsCount / max) * 100);
              return (
                <div
                  key={key}
                  className={`bg-gradient-to-br ${PILLAR_GRADIENT[key]} rounded-2xl p-6 shadow-lg text-white`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{mod.emoji}</span>
                    <h3 className="font-bold text-lg">{mod.name}</h3>
                  </div>
                  <p className="text-3xl font-extrabold leading-none">
                    {pillar.setsCount}
                  </p>
                  <p className="text-xs text-white/85 mt-1 uppercase tracking-wider font-semibold">
                    {pillar.setsCount === 1 ? "set played" : "sets played"}
                  </p>
                  <div className="mt-3 h-1.5 w-full bg-white/25 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-400 text-center mt-3">
            Any pillar counts toward the badge ladder · play a balanced mix to climb faster
          </p>
        </section>

        {/* Footer nudge */}
        <div className="text-center mt-8">
          <Link
            href="/brain/explore"
            className="inline-flex items-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold px-6 py-3 rounded-full shadow-md hover:shadow-lg transition-all"
          >
            <span className="text-lg">🎮</span>
            Play more to earn more
          </Link>
        </div>
      </div>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 ml-1">
      {children}
    </h2>
  );
}

function StatTile({
  icon,
  animation,
  value,
  label,
  gradient,
  sublabel,
}: {
  icon: string;
  animation: string;
  value: number;
  label: string;
  gradient: string;
  sublabel?: string;
}) {
  return (
    <div
      className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 shadow-lg text-white text-center`}
    >
      <div className="w-16 h-16 bg-white/25 rounded-full flex items-center justify-center mx-auto mb-3">
        <span className={`text-3xl ${animation}`}>{icon}</span>
      </div>
      <p className="text-4xl font-extrabold leading-none">{value}</p>
      <p className="text-xs text-white/90 mt-1.5 font-semibold uppercase tracking-wider">
        {label}
      </p>
      {sublabel && (
        <p className="text-[11px] text-white/80 mt-0.5">{sublabel}</p>
      )}
    </div>
  );
}
