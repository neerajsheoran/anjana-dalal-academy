// /brain/badges — Badge ladder view. Renders the 6-tier ladder for
// each of the 3 pillars with the kid's current position highlighted.
// Decided 2026-06-12: 🐸 Tadpole → 🐠 Goldfish → 🐟 Fish → 🐢 Turtle
// → 🐬 Dolphin → 🐳 Whale, 10 sets between each tier.

import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getActiveChild } from "@/lib/active-child";
import { isTrainEligible } from "@/lib/train-eligibility";
import { getContentAccessLevel, hasFullAccess } from "@/lib/subscription";
import { getBrainStats } from "@/lib/brain-stats";
import { BRAIN_TIERS } from "@/lib/brain-tiers";
import { DEMO_GAME_PER_PILLAR } from "@/lib/brain-demo-games";
import BackLink from "@/components/brain/BackLink";
import type { ModuleKey } from "@/lib/brain-modules";

const PILLAR_THEME: Record<
  ModuleKey,
  { label: string; emoji: string; bg: string; bar: string; text: string; ring: string; chipBg: string }
> = {
  memory:   { label: "Memory",   emoji: "🧠", bg: "bg-purple-50/70", bar: "bg-purple-500", text: "text-purple-700", ring: "ring-purple-300", chipBg: "bg-purple-100" },
  focus:    { label: "Focus",    emoji: "🎯", bg: "bg-green-50/70",  bar: "bg-green-500",  text: "text-green-700",  ring: "ring-green-300",  chipBg: "bg-green-100" },
  thinking: { label: "Thinking", emoji: "🧩", bg: "bg-orange-50/70", bar: "bg-orange-500", text: "text-orange-700", ring: "ring-orange-300", chipBg: "bg-orange-100" },
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
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-amber-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <BackLink href="/brain" label="Brain" />

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
                  setsToNext={pStats.setsToNext}
                  percentToNext={pStats.percentToNext}
                  nextTierName={pStats.next?.name}
                  nextTierEmoji={pStats.next?.emoji}
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
  setsToNext,
  percentToNext,
  nextTierName,
  nextTierEmoji,
}: {
  pillar: ModuleKey;
  currentTierKey: string;
  setsCount: number;
  setsToNext: number;
  percentToNext: number;
  nextTierName?: string;
  nextTierEmoji?: string;
}) {
  const theme = PILLAR_THEME[pillar];
  const demoActivity = DEMO_GAME_PER_PILLAR[pillar];
  const playHref = `/brain/${pillar}/${demoActivity}`;
  const maxed = !nextTierName;
  const nudge = maxed
    ? "All tiers unlocked! Keep playing for fun."
    : `${setsToNext} more ${pillar} set${setsToNext === 1 ? "" : "s"} to ${nextTierEmoji} ${nextTierName}`;

  return (
    <div className={`rounded-2xl ${theme.bg} border border-white p-5 shadow-sm`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{theme.emoji}</span>
          <h2 className={`text-base font-bold ${theme.text}`}>{theme.label}</h2>
        </div>
        <span className="text-xs text-gray-600 font-semibold bg-white px-2.5 py-1 rounded-full">
          {setsCount} sets
        </span>
      </div>

      {/* Ladder row — bigger, colored even when locked, with a soft halo on
          current and the "you are here" arrow underneath. */}
      <div className="flex items-end gap-1 mb-3">
        {BRAIN_TIERS.map((tier) => {
          const unlocked = setsCount >= tier.threshold;
          const isCurrent = tier.key === currentTierKey;
          return (
            <div key={tier.key} className="flex-1 flex flex-col items-center">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center text-xl transition-transform ${
                  isCurrent
                    ? `bg-white ring-4 ${theme.ring} shadow-md scale-110`
                    : unlocked
                      ? "bg-white shadow-sm"
                      : `${theme.chipBg} opacity-80`
                }`}
                title={`${tier.name} · ${tier.threshold} sets`}
              >
                <span className={isCurrent || unlocked ? "" : "opacity-50"}>
                  {tier.emoji}
                </span>
              </div>
              <span
                className={`text-[10px] mt-1 font-semibold ${
                  isCurrent ? theme.text : unlocked ? "text-gray-700" : "text-gray-500"
                }`}
              >
                {tier.name}
              </span>
              <span className="text-[9px] text-gray-400">{tier.threshold}</span>
              {isCurrent && (
                <span className={`block w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent ${theme.bar.replace("bg-", "border-b-")} mt-1`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress to next tier */}
      {!maxed && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-gray-600">{nudge}</span>
            <span className="text-[11px] font-bold text-gray-500">{percentToNext}%</span>
          </div>
          <div className="h-2 w-full bg-white rounded-full overflow-hidden">
            <div
              className={`h-full ${theme.bar} rounded-full transition-all`}
              style={{ width: `${percentToNext}%` }}
            />
          </div>
        </div>
      )}

      {/* CTA — go play */}
      <Link
        href={playHref}
        className={`mt-1 inline-flex items-center justify-center gap-1 w-full bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm text-sm font-bold ${theme.text} py-2.5 rounded-xl`}
      >
        {maxed ? "Play more" : "Train this pillar"}
        <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
      </Link>
    </div>
  );
}
