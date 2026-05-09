// The Brain Screen — post-login, post-profile-switch landing.
// Requires an active child profile (redirects to /kids if not set).

import { redirect } from "next/navigation";
import { getActiveChild } from "@/lib/active-child";
import BrainScreenClient from "./BrainScreenClient";

export default async function BrainPage() {
  const activeChild = await getActiveChild();
  if (!activeChild) {
    // Force the user to pick a profile first — the screen has no meaning without one.
    redirect("/kids");
  }

  return <BrainScreenClient childName={activeChild.name} />;
}
