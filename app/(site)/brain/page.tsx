// The Brain Screen — post-login, post-profile-switch landing.
// Requires an active child profile (redirects to /kids if not set).

import { redirect } from "next/navigation";
import { getActiveChild } from "@/lib/active-child";
import { isTrainEligible } from "@/lib/train-eligibility";
import BrainScreenClient from "./BrainScreenClient";

export default async function BrainPage() {
  const activeChild = await getActiveChild();
  if (!activeChild) {
    // Force the user to pick a profile first — the screen has no meaning without one.
    redirect("/kids");
  }
  // Class 9+ kids are in board-prep mode (cognilift-three-pillar-roadmap.md).
  // Brain training is hidden on their homepage; direct navigation here
  // redirects them to their school work instead of showing a wall.
  if (!isTrainEligible(activeChild.classId)) {
    redirect(activeChild.classId ? `/class/${activeChild.classId}` : "/");
  }

  return <BrainScreenClient childName={activeChild.name} />;
}
