// /brain/daily — the kid's Daily Activity flow (Screens 3 + 4 of the
// 2026-06-12 design). Shows 3 stacked cards (Memory / Focus / Thinking),
// each linking to one preselected game per pillar. The kid plays them
// in any order; the day counts as "complete" once all 3 are touched.
//
// Pillar → preselected game:
//   Memory   → Memory Match
//   Focus    → Find the Object
//   Thinking → Pattern Logic
//
// (Same as the free-tier demo games — keeps Daily simple and ensures
// the path is always playable by anyone with a profile, free or paid.)
//
// "Next pillar" highlight: the first not-yet-done card pulses with the
// Continue CTA. Auto-progression itself (the post-game countdown) lives
// inside each activity's summary screen — out of scope here.

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Check, Flame, Lock } from "lucide-react";
import { getActiveChild } from "@/lib/active-child";
import { isTrainEligible } from "@/lib/train-eligibility";
import { getContentAccessLevel, hasFullAccess } from "@/lib/subscription";
import { getBrainStats } from "@/lib/brain-stats";
import { DEMO_GAME_PER_PILLAR } from "@/lib/brain-demo-games";
import { BRAIN_ACTIVITIES, type ModuleKey } from "@/lib/brain-modules";

const PILLAR_ORDER: ModuleKey[] = ["memory", "focus", "thinking"];

const PILLAR_THEME: Record<ModuleKey, { emoji: string; label: string; ring: string; chip: string }> = {
  memory:   { emoji: "🧠", label: "Memory",   ring: "ring-purple-400",  chip: "bg-purple-100 text-purple-700" },
  focus:    { emoji: "🎯", label: "Focus",    ring: "ring-green-400",   chip: "bg-green-100 text-green-700" },
  thinking: { emoji: "🧩", label: "Thinking", ring: "ring-orange-400",  chip: "bg-orange-100 text-orange-700" },
};

export default async function BrainDailyPage() {
  const activeChild = await getActiveChild();
  if (!activeChild) redirect("/kids");
  if (!isTrainEligible(activeChild.classId)) {
    redirect(activeChild.classId ? `/class/${activeChild.classId}` : "/");
  }

  const [stats, accessLevel] = await Promise.all([
    getBrainStats(activeChild.parentUid, activeChild.id),
    getContentAccessLevel(activeChild.parentUid),
  ]);
  const isPaid = hasFullAccess(accessLevel);

  const done = {
    memory:   stats.memory.doneToday,
    focus:    stats.focus.doneToday,
    thinking: stats.thinking.doneToday,
  };
  const doneCount = Number(done.memory) + Number(done.focus) + Number(done.thinking);
  const dots = PILLAR_ORDER.map((p) => (done[p] ? "●" : "○")).join(" ");

  // The first pillar the kid hasn't done today gets the highlighted CTA.
  const nextPillar = PILLAR_ORDER.find((p) => !done[p]) ?? null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <Link
          href="/brain"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2} />
          Brain
        </Link>

        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-800">Today&apos;s Activity</h1>
          <div className="flex items-center justify-between mt-2">
            <span className="text-lg tracking-widest text-gray-600 font-bold">{dots}</span>
            {isPaid && stats.streakDays > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                <Flame className="w-3.5 h-3.5" strokeWidth={2.5} />
                Day {stats.streakDays}
              </span>
            )}
          </div>
          {doneCount === 3 && (
            <p className="text-sm text-emerald-700 font-medium mt-2">
              All done for today! Come back tomorrow to keep your streak.
            </p>
          )}
        </div>

        <div className="space-y-3">
          {PILLAR_ORDER.map((pillar) => (
            <DailyCard
              key={pillar}
              pillar={pillar}
              done={done[pillar]}
              isNext={pillar === nextPillar}
            />
          ))}
        </div>

        {!isPaid && (
          <div className="mt-6 bg-fuchsia-50 border border-fuchsia-200 rounded-2xl p-4 text-center">
            <p className="text-xs text-fuchsia-800 font-semibold inline-flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" strokeWidth={2.5} />
              Free preview — progress won&apos;t be saved
            </p>
            <Link
              href="/pricing"
              className="inline-block mt-2 text-xs font-bold bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-3 py-1.5 rounded-full"
            >
              Start 3-day free trial →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

function DailyCard({
  pillar,
  done,
  isNext,
}: {
  pillar: ModuleKey;
  done: boolean;
  isNext: boolean;
}) {
  const theme = PILLAR_THEME[pillar];
  const activityKey = DEMO_GAME_PER_PILLAR[pillar];
  const activity = BRAIN_ACTIVITIES[activityKey];
  if (!activity) notFound();
  const href = `/brain/${pillar}/${activityKey}`;
  const baseCls =
    "block bg-white rounded-2xl border p-5 transition-all";
  const ringCls = done
    ? "border-emerald-200"
    : isNext
      ? `border-transparent ring-2 ${theme.ring} shadow-md`
      : "border-gray-200 hover:border-gray-300";

  return (
    <Link href={href} className={`${baseCls} ${ringCls}`}>
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shrink-0 text-3xl border border-gray-100">
          {done ? (
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-100">
              <Check className="w-5 h-5 text-emerald-600" strokeWidth={3} />
            </span>
          ) : (
            <span>{theme.emoji}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-gray-800">{theme.label}</p>
            {done && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                Done
              </span>
            )}
            {isNext && !done && (
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${theme.chip}`}>
                Next
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {activity.name}
            <span className="text-gray-400"> · ~5 mins</span>
          </p>
        </div>
        <div className="flex items-center self-center">
          {!done && (
            <span className={`inline-flex items-center gap-1 text-sm font-bold ${isNext ? "text-gray-800" : "text-gray-500"}`}>
              {isNext ? "Play" : "Open"}
              <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
            </span>
          )}
          {done && (
            <span className="text-xs text-gray-400 inline-flex items-center gap-1">
              Replay
              <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
