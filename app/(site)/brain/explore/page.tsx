// /brain/explore — free-play pillar picker. 3-card grid matching the
// /learn page hero pattern so the whole site reads as one design
// (decided 2026-06-29).

import Link from "next/link";
import { redirect } from "next/navigation";
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

const PILLAR_CTA_COLOR: Record<ModuleKey, string> = {
  memory:   "text-purple-700",
  focus:    "text-emerald-700",
  thinking: "text-orange-700",
};

// Distinct motions per pillar so the row has rhythm.
const PILLAR_ANIMATION: Record<ModuleKey, string> = {
  memory:   "animate-heartbeat",
  focus:    "animate-bounce",
  thinking: "animate-wiggle",
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
      <div className="max-w-5xl mx-auto">
        <BackLink href="/" label="Home" />

        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Explore
          </h1>
          <p className="text-sm text-gray-500">
            {isPaid
              ? "Pick a pillar — play any game any time."
              : "3 games free · subscribe to unlock the other 11."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PILLAR_ORDER.map((key) => {
            const mod = BRAIN_MODULES[key];
            const totalGames = getActivitiesForModule(key).filter((a) => a.available).length;
            return (
              <Link
                key={key}
                href={`/brain/${key}`}
                className={`group h-full bg-gradient-to-br ${PILLAR_GRADIENT[key]} rounded-2xl p-8 shadow-lg flex flex-col items-center text-center hover:shadow-xl hover:scale-[1.02] transition-all duration-200`}
              >
                <div className="w-24 h-24 bg-white/25 rounded-full flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200">
                  <span className={`text-5xl ${PILLAR_ANIMATION[key]}`}>
                    {mod.emoji}
                  </span>
                </div>
                <h2 className="text-white text-xl font-bold mb-2">{mod.name}</h2>
                <p className="text-white/90 text-sm leading-relaxed flex-1">
                  {mod.shortDescription}
                </p>
                <p className="text-xs font-semibold text-white/85 mt-3 mb-4">
                  {isPaid ? `${totalGames} games` : "1 game free · others locked"}
                </p>
                <span className={`mt-auto inline-block bg-white ${PILLAR_CTA_COLOR[key]} font-semibold px-6 py-2 rounded-full text-sm shadow-md group-hover:shadow-lg transition-shadow`}>
                  Play
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
