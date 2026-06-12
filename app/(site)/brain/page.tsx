// The Brain Screen — post-login, post-profile-switch landing.
// Requires an active child profile (redirects to /kids if not set).
//
// Renders the new 3-card home (Today / Badges / Explore). Decided
// 2026-06-12 with user — replaced the old brain-image lobe picker;
// that layout lives on at /brain/explore now.

import { redirect } from "next/navigation";
import { getActiveChild } from "@/lib/active-child";
import { isTrainEligible } from "@/lib/train-eligibility";
import { getBrainStats } from "@/lib/brain-stats";
import {
  getContentAccessLevel,
  getPlatformConfig,
  hasFullAccess,
} from "@/lib/subscription";
import BrainHome from "./BrainHome";

// Anonymous-friendly: visitors with no profile see the same layout in
// "preview" mode — 3 cards, demos playable from the pillar pages,
// progress shown as zero, badges padlocked. Hooks signup at the moment
// they try to save something.
export default async function BrainPage() {
  const activeChild = await getActiveChild();

  // Class 9+ kids who do have a profile are bounced to school work.
  if (activeChild && !isTrainEligible(activeChild.classId)) {
    redirect(activeChild.classId ? `/class/${activeChild.classId}` : "/");
  }

  const config = await getPlatformConfig();
  const trialDays = config.trialDays;

  if (!activeChild) {
    return (
      <BrainHome
        childName="there"
        stats={emptyStats()}
        isPaid={false}
        isAnonymous={true}
        trialDays={trialDays}
        dailyComplete={false}
        dailyDoneCount={0}
      />
    );
  }

  const [stats, accessLevel] = await Promise.all([
    getBrainStats(activeChild.parentUid, activeChild.id),
    getContentAccessLevel(activeChild.parentUid),
  ]);
  const isPaid = hasFullAccess(accessLevel);
  const doneCount =
    (stats.memory.doneToday ? 1 : 0) +
    (stats.focus.doneToday ? 1 : 0) +
    (stats.thinking.doneToday ? 1 : 0);

  return (
    <BrainHome
      childName={activeChild.name}
      stats={stats}
      isPaid={isPaid}
      isAnonymous={false}
      trialDays={trialDays}
      dailyComplete={doneCount === 3}
      dailyDoneCount={doneCount}
    />
  );
}

// Default zeroed-out stats for anonymous visitors. Keeps the shape that
// BrainHome expects without round-tripping to Firestore.
function emptyStats() {
  const t = {
    setsCount: 0,
    tier: { key: "tadpole", name: "Tadpole", emoji: "🐸", threshold: 0 },
    next: { key: "goldfish", name: "Goldfish", emoji: "🐠", threshold: 10 },
    setsToNext: 10,
    percentToNext: 0,
    doneToday: false,
  } as const;
  return {
    memory:   { ...t },
    focus:    { ...t },
    thinking: { ...t },
    totalSets: 0,
    bestTier: t.tier,
    streakDays: 0,
    lastActiveIstDay: null,
  };
}
