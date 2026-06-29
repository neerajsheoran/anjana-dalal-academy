// /brain used to be a 2-card hub (Badges + Explore). Collapsed
// 2026-06-30 — its content moved to /achievements (Badges info) and
// /brain/explore (pillar picker). Kept as a redirect so any old
// bookmarks, email links, or share URLs still work silently.

import { redirect } from "next/navigation";

export default function BrainPage(): never {
  redirect("/brain/explore");
}
