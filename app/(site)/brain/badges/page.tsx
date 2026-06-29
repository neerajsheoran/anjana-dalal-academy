// /brain/badges used to be a dedicated tier-ladder page. Collapsed
// 2026-06-30 — its content moved into /achievements, which already
// shows the ladder + training mix as part of the trophy room.
// Kept as a redirect so any old bookmarks / shared URLs still land
// somewhere sensible.

import { redirect } from "next/navigation";

export default function BadgesPage(): never {
  redirect("/achievements");
}
