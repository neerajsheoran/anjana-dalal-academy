// /brain/explore — free-play picker. The original brain-image lobe
// layout lives here now. Kids tap a lobe or a tile to pick a pillar,
// then pick an activity from that module's page. For free users the
// module page locks non-demo activities (see brain-demo-games.ts).

import { redirect } from "next/navigation";
import { getActiveChild } from "@/lib/active-child";
import { isTrainEligible } from "@/lib/train-eligibility";
import BrainScreenClient from "../BrainScreenClient";

export default async function BrainExplorePage() {
  const activeChild = await getActiveChild();
  if (!activeChild) redirect("/kids");
  if (!isTrainEligible(activeChild.classId)) {
    redirect(activeChild.classId ? `/class/${activeChild.classId}` : "/");
  }
  return <BrainScreenClient childName={activeChild.name} />;
}
