// /brain/daily — single mixed-game session of 9 activities, 3 per
// pillar, interleaved M-F-T-M-F-T-M-F-T. Refactored 2026-06-30 from
// the old 3-pillar-block layout because varied practice keeps kid
// attention higher than blocked practice (Bjork interleaving effect).
//
// Loose-finish policy: any of the 9 played counts. The kid sees their
// progress as N of 9. There's no penalty for stopping after fewer.
// The kid home hero reflects the same progress.

import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Flame, Lock } from "lucide-react";
import { getActiveChild } from "@/lib/active-child";
import { isTrainEligible } from "@/lib/train-eligibility";
import {
  getContentAccessLevel,
  getPlatformConfig,
  hasFullAccess,
} from "@/lib/subscription";
import { getBrainStats } from "@/lib/brain-stats";
import { getDailyMission, type DailyMissionGame } from "@/lib/daily-mission";
import { type ModuleKey } from "@/lib/brain-modules";
import BackLink from "@/components/brain/BackLink";

const PILLAR_THEME: Record<
  ModuleKey,
  { emoji: string; label: string; gradient: string }
> = {
  memory: {
    emoji: "🧠",
    label: "Memory",
    gradient: "from-purple-600 to-pink-600",
  },
  focus: {
    emoji: "🎯",
    label: "Focus",
    gradient: "from-emerald-600 to-teal-600",
  },
  thinking: {
    emoji: "💡",
    label: "Thinking",
    gradient: "from-orange-500 to-amber-600",
  },
};

export default async function BrainDailyPage() {
  const activeChild = await getActiveChild();
  if (activeChild && !isTrainEligible(activeChild.classId)) {
    redirect(activeChild.classId ? `/class/${activeChild.classId}` : "/");
  }

  const [stats, accessLevel, config] = activeChild
    ? await Promise.all([
        getBrainStats(activeChild.parentUid, activeChild.id),
        getContentAccessLevel(activeChild.parentUid),
        getPlatformConfig(),
      ])
    : [null, "anonymous" as const, await getPlatformConfig()];
  const isPaid = hasFullAccess(accessLevel);
  const isAnonymous = !activeChild;
  const trialDays = config.trialDays;

  const mission = getDailyMission({
    childId: activeChild?.id ?? null,
    age: activeChild?.age ?? 12,
    playedTodayKeys: stats?.playedTodayKeys ?? [],
  });

  const percent = mission.total > 0
    ? Math.round((mission.doneCount / mission.total) * 100)
    : 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <BackLink href="/brain" label="Brain" />

        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Today&rsquo;s Mission
          </h1>
          <p className="text-sm text-gray-500">
            {mission.isComplete
              ? "Nice work — all 9 games done!"
              : `9 mixed games · ~12 mins · ${mission.doneCount} of ${mission.total} done`}
          </p>
          {isPaid && stats && stats.streakDays > 0 && (
            <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
              <Flame className="w-3.5 h-3.5" strokeWidth={2.5} />
              Day {stats.streakDays} streak
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-6 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="font-bold text-gray-800">
              {mission.doneCount} of {mission.total}
            </span>
            <span className="font-semibold text-gray-500">{percent}%</span>
          </div>
          <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-600 rounded-full transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Big next-game CTA — the only thing the kid needs to see. The
            ordered lineup that used to sit below was removed 2026-06-30
            after user feedback that it added noise without helping kids
            decide what to do. */}
        {mission.nextGame ? (
          <NextGameHero game={mission.nextGame} index={mission.doneCount} total={mission.total} />
        ) : (
          <AllDoneHero />
        )}

        {!isPaid && (
          <div className="mt-6 bg-fuchsia-50 border border-fuchsia-200 rounded-2xl p-4 text-center">
            <p className="text-xs text-fuchsia-800 font-semibold inline-flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" strokeWidth={2.5} />
              Free preview — progress won&apos;t be saved
            </p>
            <Link
              href={isAnonymous ? "/login?intent=signup" : "/pricing"}
              className="inline-block mt-2 text-xs font-bold bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-3 py-1.5 rounded-full"
            >
              {isAnonymous
                ? "Sign up free →"
                : `Start ${trialDays}-day free trial →`}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

function NextGameHero({
  game,
  index,
  total,
}: {
  game: DailyMissionGame;
  index: number;
  total: number;
}) {
  const theme = PILLAR_THEME[game.module];
  const href = `/brain/${game.module}/${game.activityKey}?from=daily`;
  return (
    <Link
      href={href}
      className={`group block bg-gradient-to-br ${theme.gradient} rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200`}
    >
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-white/25 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
          <span className="text-5xl animate-bounce">{theme.emoji}</span>
        </div>
        <div className="flex-1 min-w-0 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-white/80">
            {index === 0 ? "Start with" : "Next up"} · {index + 1} of {total}
          </p>
          <h2 className="text-2xl font-bold leading-tight mt-1">{game.name}</h2>
          <p className="text-sm text-white/85 mt-1">{theme.label} · ~1 min</p>
        </div>
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white text-gray-800 shrink-0 self-center">
          <ChevronRight className="w-7 h-7" strokeWidth={3} />
        </div>
      </div>
    </Link>
  );
}

function AllDoneHero() {
  return (
    <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl p-8 shadow-lg text-white text-center">
      <div className="w-24 h-24 bg-white/25 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-5xl animate-bounce">🎉</span>
      </div>
      <h2 className="text-2xl font-bold mb-2">All 9 games done today!</h2>
      <p className="text-emerald-100 text-sm">
        Come back tomorrow for a fresh mix of games.
      </p>
      <Link
        href="/brain/explore"
        className="inline-block mt-5 bg-white text-emerald-700 font-semibold px-6 py-2 rounded-full text-sm shadow-md hover:shadow-lg transition-shadow"
      >
        Play more for fun
      </Link>
    </div>
  );
}

