// Module page: shows activities for one pillar (Memory, Focus, or Thinking).
// MVP scope: ONE active activity per module + "coming soon" stubs.

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import { getActiveChild } from "@/lib/active-child";
import {
  BRAIN_MODULES,
  getActivitiesForModule,
  ZONE_BG,
  ZONE_BG_SOFT,
  ZONE_TEXT,
  type ModuleKey,
} from "@/lib/brain-modules";

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
  if (!activeChild) redirect("/kids");

  const mod = BRAIN_MODULES[moduleKey];
  const activities = getActivitiesForModule(moduleKey);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-md mx-auto">

        {/* Back to brain */}
        <Link
          href="/brain"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          Brain
        </Link>

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
          Activities for {activeChild.name}
        </h2>

        {/* Filter out activities the child can't play (age-gated).
            Parents see the full catalog on /dashboard; on the kid's module
            page, hide locked content rather than show "WRONG AGE" badges —
            no point teasing what they can't try. */}
        <div className="space-y-3">
          {activities
            .filter(
              (activity) =>
                activeChild.age >= activity.minAge &&
                activeChild.age <= activity.maxAge,
            )
            .map((activity) => (
              <ActivityCard
                key={activity.key}
                href={
                  activity.available
                    ? `/brain/${moduleKey}/${activity.key}`
                    : undefined
                }
                name={activity.name}
                skill={activity.skill}
                ageRange={`Age ${activity.minAge}–${activity.maxAge}`}
                ageOk={true}
                available={activity.available}
                color={mod.zoneColor}
              />
            ))}
        </div>

        {/* Footer note */}
        <p className="text-xs text-gray-400 text-center mt-6">
          More activities coming soon. Train one daily for best results.
        </p>
      </div>
    </main>
  );
}

function ActivityCard({
  href,
  name,
  skill,
  ageRange,
  ageOk,
  available,
  color,
}: {
  href?: string;
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
      } p-5 transition-all flex items-center gap-4`}
    >
      <div className={`w-12 h-12 rounded-xl ${ZONE_BG[color]} flex items-center justify-center text-white shrink-0`}>
        <Play className="w-5 h-5 fill-white" strokeWidth={2} />
      </div>
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
        <ArrowRight className="w-5 h-5 text-gray-400 shrink-0" strokeWidth={2} />
      )}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
