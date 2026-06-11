// Free-tier sampling: one game per pillar is unlocked without a paid
// subscription. Subscribing unlocks all 14 games and starts tracking
// progress.
//
// Picks (decided with user 2026-06-12):
//   - Memory   → Memory Match   (has both junior + senior content modes,
//                                best showcase of the academic-tier idea)
//   - Focus    → Find the Object (zero instructions needed, age 5+,
//                                 instantly playable)
//   - Thinking → Pattern Logic   ("what comes next?" — universal mechanic)
//
// Used by:
//   - /brain home (Screen 2, free) for the "1 free of N" copy
//   - /brain/[module]/page.tsx to lock the non-demo activity tiles
//   - the locked-game modal trigger

import type { ModuleKey } from "./brain-modules";

export const DEMO_GAME_PER_PILLAR: Record<ModuleKey, string> = {
  memory:   "memory-match",
  focus:    "find-the-object",
  thinking: "pattern-logic",
};

export function isDemoGame(moduleKey: ModuleKey, activityKey: string): boolean {
  return DEMO_GAME_PER_PILLAR[moduleKey] === activityKey;
}
