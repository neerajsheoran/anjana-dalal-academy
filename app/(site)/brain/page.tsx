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
import { getContentAccessLevel, hasFullAccess } from "@/lib/subscription";
import BrainHome from "./BrainHome";

export default async function BrainPage() {
  const activeChild = await getActiveChild();
  if (!activeChild) {
    redirect("/kids");
  }
  // Class 9+ kids are in board-prep mode (cognilift-three-pillar-roadmap.md).
  if (!isTrainEligible(activeChild.classId)) {
    redirect(activeChild.classId ? `/class/${activeChild.classId}` : "/");
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
      dailyComplete={doneCount === 3}
      dailyDoneCount={doneCount}
    />
  );
}
