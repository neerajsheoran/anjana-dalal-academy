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

// Pill text color matched to each pillar's gradient so the white CTA
// pill inherits the right brand-ish accent inside its card.
const PILLAR_PILL_TEXT: Record<ModuleKey, string> = {
  memory:   "text-purple-700",
  focus:    "text-emerald-700",
  thinking: "text-orange-700",
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

        {/* Badge Progress group — Tier Ladder + Next Tier + Training Mix
            are all one story (the kid's badge journey). Wrapping them in
            a soft amber container with a single header makes that
            relationship visible instead of letting them read as 3 unrelated
            sections sitting next to Stats and Streak. Decided 2026-06-30. */}
        <section className="mb-10 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-3xl p-5 md:p-7 border border-amber-200/60 shadow-sm">
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-widest">
              <span className="text-base">🏆</span>
              Badge Progress
            </span>
          </div>

        {/* Tier ladder */}
        <div className="mb-6">
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
        </div>

        {/* Next tier — focal card that used to live on /brain/badges
            before that page was collapsed into here. Shows the upcoming
            badge prominently so the kid knows what they're working toward. */}
        {brainStats.nextTier ? (
          <div className="mb-6">
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
                  {/* Show both halves of the journey: what's already done +
                      what's remaining. Effort gets visible credit. The span
                      is (next.threshold - current.threshold), the done part
                      is (totalSets - current.threshold). */}
                  <p className="text-sm text-purple-100 mt-1">
                    {brainStats.totalSets - brainStats.bestTier.threshold}
                    {" of "}
                    {brainStats.nextTier.threshold - brainStats.bestTier.threshold}
                    {" games done · "}
                    <span className="font-semibold text-white">
                      {brainStats.setsToNext} to go
                    </span>
                  </p>
                </div>
              </div>
              {/* Swimming-toward-next-tier visualization:
                  - flat readable bar with shimmer scrolling inside the
                    filled portion (suggests current/water flowing)
                  - current tier emoji marker bobbing at the front of
                    the fill ("you're here, mid-swim")
                  - decorative wavy line below the bar (ocean line)
                  Decided 2026-06-30 — kept the bar straight for
                  readability instead of a fully wavy bar. */}
              <div className="relative mt-4 mb-1">
                <div className="h-3 w-full bg-white/25 rounded-full overflow-hidden">
                  <div
                    className="relative h-full bg-white rounded-full overflow-hidden transition-all"
                    style={{ width: `${brainStats.percentToNext}%` }}
                  >
                    <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-purple-200/80 to-transparent animate-shimmer" />
                  </div>
                </div>
                <div
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ left: `${Math.max(3, Math.min(97, brainStats.percentToNext))}%` }}
                  aria-label="You are here"
                >
                  <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md animate-bounce">
                    <span className="text-lg">{brainStats.bestTier.emoji}</span>
                  </div>
                </div>
              </div>
              <svg
                className="w-full h-2 mt-1 opacity-50"
                viewBox="0 0 100 4"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M 0,2 Q 5,0 10,2 T 20,2 T 30,2 T 40,2 T 50,2 T 60,2 T 70,2 T 80,2 T 90,2 T 100,2"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <div className="bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl p-6 md:p-8 shadow-lg text-white text-center">
              <p className="text-5xl mb-2">{brainStats.bestTier.emoji}</p>
              <p className="text-xl font-bold">All tiers unlocked!</p>
              <p className="text-sm text-amber-50 mt-1">
                You&rsquo;re a {brainStats.bestTier.name}. Keep playing for fun. 🎉
              </p>
            </div>
          </div>
        )}

        {/* Training mix — pillar set counts, all feeding the same master
            ladder. Width is relative to the largest pillar (or 10, whichever
            is bigger) so a 2-set pillar doesn't fill the whole row. */}
        <div>
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
              // 0-set pillars get "Start" (more inviting for a fresh
              // pillar); pillars already touched get "Play". Decided
              // 2026-06-30.
              const ctaLabel = pillar.setsCount === 0 ? "Start" : "Play";
              return (
                <Link
                  key={key}
                  href={`/brain/${key}`}
                  className={`group block bg-gradient-to-br ${PILLAR_GRADIENT[key]} rounded-2xl p-6 shadow-lg text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.99] transition-all duration-200`}
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
                  <div className="mt-4 flex justify-end">
                    <span
                      className={`inline-block bg-white ${PILLAR_PILL_TEXT[key]} font-semibold px-5 py-1.5 rounded-full text-sm shadow-md group-hover:shadow-lg transition-shadow`}
                    >
                      {ctaLabel} →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-600 text-center mt-3">
            Any pillar counts toward the badge ladder · play a balanced mix to climb faster
          </p>
        </div>
        </section>

        {/* Footer CTA — Today's Mission. Per-pillar play paths are now
            on the training-mix cards above, so this CTA covers the
            "I don't know what to play, just give me something"
            case by sending the kid to their daily mixed 9-game session. */}
        <div className="text-center mt-8">
          <Link
            href="/brain/daily"
            className="inline-flex items-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold px-6 py-3 rounded-full shadow-md hover:shadow-lg transition-all"
          >
            <span className="text-lg">🎯</span>
            Today&rsquo;s Mission
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
