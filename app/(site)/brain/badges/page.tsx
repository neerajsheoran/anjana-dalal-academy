// /brain/badges — Badge ladder view. Renders the 6-tier ladder for
// each of the 3 pillars with the kid's current position highlighted.
// Decided 2026-06-12: 🐸 Tadpole → 🐠 Goldfish → 🐟 Fish → 🐢 Turtle
// → 🐬 Dolphin → 🐳 Whale, 10 sets between each tier.

import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, Lock } from "lucide-react";
import { getActiveChild } from "@/lib/active-child";
import { isTrainEligible } from "@/lib/train-eligibility";
import { getContentAccessLevel, hasFullAccess } from "@/lib/subscription";
import { getBrainStats } from "@/lib/brain-stats";
import { BRAIN_TIERS } from "@/lib/brain-tiers";
import type { ModuleKey } from "@/lib/brain-modules";

const PILLAR_THEME: Record<ModuleKey, { label: string; emoji: string; bg: string; bar: string; text: string }> = {
  memory:   { label: "Memory",   emoji: "🧠", bg: "bg-purple-50",  bar: "bg-purple-500", text: "text-purple-700" },
  focus:    { label: "Focus",    emoji: "🎯", bg: "bg-green-50",   bar: "bg-green-500",  text: "text-green-700" },
  thinking: { label: "Thinking", emoji: "🧩", bg: "bg-orange-50",  bar: "bg-orange-500", text: "text-orange-700" },
};

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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <Link
          href="/brain"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2} />
          Brain
        </Link>

        <h1 className="text-2xl font-bold text-gray-800 mb-1">Badges</h1>
        <p className="text-sm text-gray-500 mb-5">
          {isPaid
            ? "6 tiers per pillar. Train 10 sets to climb each."
            : "Subscribe to start earning badges and the physical certificate."}
        </p>

        {!isPaid ? (
          <FreeLockedView />
        ) : (
          <div className="space-y-5">
            {(Object.keys(PILLAR_THEME) as ModuleKey[]).map((p) => {
              const pStats = stats![p];
              return (
                <PillarLadder
                  key={p}
                  pillar={p}
                  currentTierKey={pStats.tier.key}
                  setsCount={pStats.setsCount}
                />
              );
            })}
          </div>
        )}
      </div>
    </main>
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
        Climb 6 tiers per pillar — from 🐸 Tadpole to 🐳 Whale.
        Every quarter, the top milestone earns a physical certificate.
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

function PillarLadder({
  pillar,
  currentTierKey,
  setsCount,
}: {
  pillar: ModuleKey;
  currentTierKey: string;
  setsCount: number;
}) {
  const theme = PILLAR_THEME[pillar];
  return (
    <div className={`rounded-2xl ${theme.bg} p-5`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{theme.emoji}</span>
          <h2 className={`text-base font-bold ${theme.text}`}>{theme.label}</h2>
        </div>
        <span className="text-xs text-gray-500 font-semibold">
          {setsCount} sets done
        </span>
      </div>
      <div className="flex items-center gap-1">
        {BRAIN_TIERS.map((tier, i) => {
          const unlocked = setsCount >= tier.threshold;
          const isCurrent = tier.key === currentTierKey;
          return (
            <div key={tier.key} className="flex-1 flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                  isCurrent
                    ? `${theme.bar} text-white ring-4 ring-white shadow-lg scale-110`
                    : unlocked
                      ? "bg-white text-gray-700"
                      : "bg-gray-200 text-gray-400 grayscale opacity-60"
                }`}
                title={`${tier.name} · ${tier.threshold} sets`}
              >
                {unlocked || isCurrent ? tier.emoji : <Lock className="w-3.5 h-3.5" strokeWidth={2.5} />}
              </div>
              <span className={`text-[10px] mt-1 font-semibold ${isCurrent ? theme.text : "text-gray-500"}`}>
                {tier.name}
              </span>
              <span className="text-[9px] text-gray-400">{tier.threshold}</span>
              {i < BRAIN_TIERS.length - 1 && (
                <div className="hidden" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
