// Module page: shows activities for one pillar (Memory, Focus, or Thinking).
// MVP scope: ONE active activity per module + "coming soon" stubs.

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ChevronRight, Lock } from "lucide-react";
import { getActiveChild } from "@/lib/active-child";
import { isTrainEligible } from "@/lib/train-eligibility";
import { getContentAccessLevel, hasFullAccess } from "@/lib/subscription";
import {
  BRAIN_MODULES,
  getActivitiesForModule,
  ZONE_BG_SOFT,
  ZONE_TEXT,
  type ModuleKey,
} from "@/lib/brain-modules";
import { DEMO_GAME_PER_PILLAR } from "@/lib/brain-demo-games";
import ActivityPreview from "@/components/brain/ActivityPreview";
import LockedGameTile from "@/components/brain/LockedGameTile";
import BackLink from "@/components/brain/BackLink";

const VALID_MODULES: ModuleKey[] = ["memory", "focus", "thinking"];

export default async function ModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module: moduleParam } = await params;
  if (!VALID_MODULES.includes(moduleParam as ModuleKey)) notFound();
  const moduleKey = moduleParam as ModuleKey;

  const activeChild = await getActiveChild();
  // Class 9+ kids with a profile go back to school work. Anonymous
  // visitors fall through to a preview view (no signin required).
  if (activeChild && !isTrainEligible(activeChild.classId)) {
    redirect(activeChild.classId ? `/class/${activeChild.classId}` : "/");
  }

  const mod = BRAIN_MODULES[moduleKey];
  const activities = getActivitiesForModule(moduleKey);
  const accessLevel = activeChild
    ? await getContentAccessLevel(activeChild.parentUid)
    : "anonymous" as const;
  const isPaid = hasFullAccess(accessLevel);
  const demoActivityKey = DEMO_GAME_PER_PILLAR[moduleKey];

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-md mx-auto">

        <BackLink href="/brain" label="Brain" />

        {/* Module header */}
        <div className={`${ZONE_BG_SOFT[mod.zoneColor]} rounded-2xl p-6 mb-6 text-center`}>
          <div className="text-5xl mb-2">{mod.emoji}</div>
          <h1 className={`text-2xl font-bold ${ZONE_TEXT[mod.zoneColor]} mb-1`}>
            {mod.name}
          </h1>
          <p className="text-sm text-gray-600 max-w-xs mx-auto">
            {mod.shortDescription}
          </p>
        </div>

        {/* Activity list */}
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
          Activities {activeChild ? `for ${activeChild.name}` : "(preview)"}
        </h2>

        {/* Filter out activities the child can't play (age-gated).
            Parents see the full catalog on /dashboard; on the kid's module
            page, hide locked content rather than show "WRONG AGE" badges —
            no point teasing what they can't try. */}
        <div className="space-y-3">
          {activities
            .filter(
              (activity) =>
                !activeChild ||
                (activeChild.age >= activity.minAge &&
                  activeChild.age <= activity.maxAge),
            )
            .map((activity) => {
              const lockedForFree =
                !isPaid && activity.available && activity.key !== demoActivityKey;
              if (lockedForFree) {
                return (
                  <LockedGameTile
                    key={activity.key}
                    activityName={activity.name}
                    activitySkill={activity.skill}
                    ageRange={`Age ${activity.minAge}–${activity.maxAge}`}
                  />
                );
              }
              return (
                <ActivityCard
                  key={activity.key}
                  href={
                    activity.available
                      ? `/brain/${moduleKey}/${activity.key}`
                      : undefined
                  }
                  activityKey={activity.key}
                  name={activity.name}
                  skill={activity.skill}
                  ageRange={`Age ${activity.minAge}–${activity.maxAge}`}
                  ageOk={true}
                  available={activity.available}
                  color={mod.zoneColor}
                />
              );
            })}
        </div>

        {/* Footer note */}
        {!isPaid && (
          <p className="text-[11px] text-fuchsia-700 text-center mt-5 inline-flex items-center justify-center gap-1 w-full">
            <Lock className="w-3 h-3" strokeWidth={2.5} />
            Subscribe to unlock all activities + save progress
          </p>
        )}
        <p className="text-xs text-gray-400 text-center mt-4">
          Train one pillar daily for best results.
        </p>
      </div>
    </main>
  );
}

function ActivityCard({
  href,
  activityKey,
  name,
  skill,
  ageRange,
  ageOk,
  available,
  color,
}: {
  href?: string;
  activityKey: string;
  name: string;
  skill: string;
  ageRange: string;
  ageOk: boolean;
  available: boolean;
  color: "purple" | "green" | "orange";
}) {
  const inner = (
    <div
      className={`bg-white rounded-2xl border ${
        href
          ? "border-gray-200 hover:border-gray-300 hover:shadow-md cursor-pointer"
          : "border-gray-100 opacity-60"
      } p-4 transition-all flex items-center gap-4`}
    >
      <ActivityPreview activityKey={activityKey} color={color} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <h3 className="font-bold text-gray-800 text-base">{name}</h3>
          {!available && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              Coming soon
            </span>
          )}
          {available && !ageOk && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
              Wrong age
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500">{skill} · {ageRange}</p>
      </div>
      {href && (
        <ChevronRight className="w-7 h-7 text-gray-500 shrink-0" strokeWidth={3} />
      )}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
