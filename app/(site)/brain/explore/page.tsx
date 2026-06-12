// /brain/explore — free-play picker. Just three pillar cards. The old
// transparent-brain lobe-tap layout was removed 2026-06-12 after the
// user said the brain pictures felt ugly. The pillar cards reuse the
// same gradient styling as the home for visual continuity.

import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getActiveChild } from "@/lib/active-child";
import { isTrainEligible } from "@/lib/train-eligibility";
import { getContentAccessLevel, hasFullAccess } from "@/lib/subscription";
import { BRAIN_MODULES, getActivitiesForModule, type ModuleKey } from "@/lib/brain-modules";
import BackLink from "@/components/brain/BackLink";

const PILLAR_GRADIENT: Record<ModuleKey, string> = {
  memory:   "from-purple-600 to-pink-600",
  focus:    "from-emerald-600 to-teal-600",
  thinking: "from-orange-500 to-amber-600",
};

const PILLAR_SHADOW: Record<ModuleKey, string> = {
  memory:   "shadow-[0_12px_28px_rgba(168,85,247,0.35)]",
  focus:    "shadow-[0_12px_28px_rgba(16,185,129,0.35)]",
  thinking: "shadow-[0_12px_28px_rgba(251,146,60,0.35)]",
};

const PILLAR_ORDER: ModuleKey[] = ["memory", "focus", "thinking"];

export default async function BrainExplorePage() {
  const activeChild = await getActiveChild();
  if (activeChild && !isTrainEligible(activeChild.classId)) {
    redirect(activeChild.classId ? `/class/${activeChild.classId}` : "/");
  }
  const accessLevel = activeChild
    ? await getContentAccessLevel(activeChild.parentUid)
    : "anonymous" as const;
  const isPaid = hasFullAccess(accessLevel);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <BackLink href="/brain" label="Brain" />

        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Explore</h1>
          <p className="text-sm text-gray-500">
            {isPaid
              ? "Pick a pillar — play any game any time."
              : "3 games free · subscribe to unlock the other 11."}
          </p>
        </div>

        <div className="space-y-4">
          {PILLAR_ORDER.map((key) => {
            const mod = BRAIN_MODULES[key];
            const totalGames = getActivitiesForModule(key).filter((a) => a.available).length;
            return (
              <Link
                key={key}
                href={`/brain/${key}`}
                className={`group block rounded-3xl p-5 bg-gradient-to-br ${PILLAR_GRADIENT[key]} text-white ${PILLAR_SHADOW[key]} hover:scale-[1.02] active:scale-[0.99] transition-all`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/25 flex items-center justify-center shrink-0 text-4xl">
                    {mod.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold leading-tight">
                      {mod.name}
                    </h2>
                    <p className="text-sm text-white/85 mt-0.5 leading-snug">
                      {mod.shortDescription}
                    </p>
                    <p className="text-[11px] font-semibold text-white/80 mt-1.5">
                      {isPaid ? `${totalGames} games` : "1 game free · others locked"}
                    </p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-white/80 shrink-0" strokeWidth={2.5} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
