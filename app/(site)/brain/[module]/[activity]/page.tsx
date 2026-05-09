// Activity wrapper page. Validates routing + age + active child, then loads
// the right activity component.

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getActiveChild } from "@/lib/active-child";
import {
  BRAIN_ACTIVITIES,
  BRAIN_MODULES,
  type ModuleKey,
} from "@/lib/brain-modules";
import PatternRecallActivity from "@/components/brain/PatternRecallActivity";

const VALID_MODULES: ModuleKey[] = ["memory", "focus", "thinking"];

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ module: string; activity: string }>;
}) {
  const { module: moduleParam, activity: activityKey } = await params;
  if (!VALID_MODULES.includes(moduleParam as ModuleKey)) notFound();
  const moduleKey = moduleParam as ModuleKey;

  const activeChild = await getActiveChild();
  if (!activeChild) redirect("/kids");

  const activity = BRAIN_ACTIVITIES[activityKey];
  if (!activity || activity.module !== moduleKey) notFound();

  const mod = BRAIN_MODULES[moduleKey];

  // Age gate
  const ageOk =
    activeChild.age >= activity.minAge && activeChild.age <= activity.maxAge;
  if (!ageOk) {
    return (
      <NotAvailable
        backHref={`/brain/${moduleKey}`}
        title="Different age range"
        message={`This activity is designed for kids age ${activity.minAge}–${activity.maxAge}. ${activeChild.name} is ${activeChild.age}.`}
      />
    );
  }

  // Coming-soon stub
  if (!activity.available) {
    return (
      <NotAvailable
        backHref={`/brain/${moduleKey}`}
        title="Coming soon"
        message={`${activity.name} is being polished. Try ${mod.name === "Memory" ? "Pattern Recall" : "Pattern Recall in Memory"} for now.`}
      />
    );
  }

  // Route to the right activity component
  if (activityKey === "pattern-recall") {
    return (
      <PatternRecallActivity
        moduleKey={moduleKey}
        childName={activeChild.name}
      />
    );
  }

  // Defensive — should never reach here for available activities
  notFound();
}

function NotAvailable({
  title,
  message,
  backHref,
}: {
  title: string;
  message: string;
  backHref: string;
}) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10 px-4">
      <div className="max-w-md mx-auto">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          ← Back
        </Link>
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-3xl mx-auto mb-4">
            ⏳
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">{title}</h1>
          <p className="text-sm text-gray-500 mb-6">{message}</p>
          <Link
            href={backHref}
            className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
          >
            Back to module
          </Link>
        </div>
      </div>
    </main>
  );
}
