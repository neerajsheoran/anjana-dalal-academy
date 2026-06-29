// Badge tier ladder — single cumulative ladder for the kid's brain
// training. Refactored 2026-06-29 from the old per-pillar system, which
// repeated the same 6 badges three times and made each one feel non-
// unique. Now there's one master ladder; total sets across all pillars
// (memory + focus + thinking) move the kid up it.
//
// Same six aquatic creatures as before so existing memory of the system
// stays intact:
//   Tadpole (start) → Goldfish → Fish → Turtle → Dolphin → Whale
//
// Threshold = total game sessions completed across all 3 pillars. Each
// tier is 30 sessions apart, matching the old per-pillar 10-session
// jump scaled by 3 pillars. End state: Whale = 150 total games, exactly
// the same total work as maxing out all 3 pillars under the old system.
//
// 1 set = 1 finished game session at any difficulty. A session may
// write several attempt docs (Memory Match writes 3 round attempts);
// we collapse them by activityKey + minute when counting sets so multi-
// round games still count as one set per session. See countSets() in
// brain-stats.ts.

export interface BrainTier {
  key: string;        // stable id for storage / lookups
  name: string;       // display name
  emoji: string;      // single-glyph emoji (must render on iOS + Android)
  threshold: number;  // TOTAL sets across all pillars to UNLOCK this tier
}

export const BRAIN_TIERS: BrainTier[] = [
  { key: "tadpole",  name: "Tadpole",  emoji: "🐸", threshold: 0   },
  { key: "goldfish", name: "Goldfish", emoji: "🐠", threshold: 30  },
  { key: "fish",     name: "Fish",     emoji: "🐟", threshold: 60  },
  { key: "turtle",   name: "Turtle",   emoji: "🐢", threshold: 90  },
  { key: "dolphin",  name: "Dolphin",  emoji: "🐬", threshold: 120 },
  { key: "whale",    name: "Whale",    emoji: "🐳", threshold: 150 },
];

export interface TierProgress {
  current: BrainTier;          // never null — everyone starts at Tadpole
  next: BrainTier | null;      // null once they reach Whale
  setsIntoCurrent: number;     // sets done since reaching current tier
  setsToNext: number;          // sets remaining to reach next tier (0 if maxed)
  percentToNext: number;       // 0..100, 100 if maxed
}

export function tierForSets(sets: number): TierProgress {
  let current = BRAIN_TIERS[0];
  let next: BrainTier | null = null;
  for (let i = 0; i < BRAIN_TIERS.length; i++) {
    if (sets >= BRAIN_TIERS[i].threshold) {
      current = BRAIN_TIERS[i];
      next = BRAIN_TIERS[i + 1] ?? null;
    }
  }
  if (!next) {
    return {
      current,
      next: null,
      setsIntoCurrent: sets - current.threshold,
      setsToNext: 0,
      percentToNext: 100,
    };
  }
  const span = next.threshold - current.threshold;
  const setsIntoCurrent = sets - current.threshold;
  const setsToNext = next.threshold - sets;
  const percentToNext = Math.round((setsIntoCurrent / span) * 100);
  return { current, next, setsIntoCurrent, setsToNext, percentToNext };
}
