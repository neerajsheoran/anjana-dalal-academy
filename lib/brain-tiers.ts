// Badge tier ladder for the Train (Brain) section.
//
// Decided 2026-06-12 with the user: 6 aquatic tiers ascending by size.
// Threshold = cumulative SETS completed in that pillar (Memory / Focus /
// Thinking). 1 set = 1 finished activity session (any difficulty). A
// session may write multiple attempts (Memory Match writes 3 round
// attempts per session, etc.) — we collapse by activityKey + minute
// when counting sets so multi-round games still count as one set per
// session. See countSets() in brain-stats.ts.
//
// Per-pillar uniform 10-set jumps:
//   Tadpole (start)  →  Goldfish 10  →  Fish 20  →  Turtle 30
//   →  Dolphin 40  →  Whale 50
//
// Max-out per pillar = 50 sets. Across 3 pillars = 150 sets to crown
// all three. At ~4 sessions/week that's ~9 months — pegged near the
// length of an Indian academic year.

export interface BrainTier {
  key: string;        // stable id for storage / lookups
  name: string;       // display name
  emoji: string;      // single-glyph emoji (must render on iOS + Android)
  threshold: number;  // sets needed in this pillar to UNLOCK this tier
}

export const BRAIN_TIERS: BrainTier[] = [
  { key: "tadpole",  name: "Tadpole",  emoji: "🐸", threshold: 0  },
  { key: "goldfish", name: "Goldfish", emoji: "🐠", threshold: 10 },
  { key: "fish",     name: "Fish",     emoji: "🐟", threshold: 20 },
  { key: "turtle",   name: "Turtle",   emoji: "🐢", threshold: 30 },
  { key: "dolphin",  name: "Dolphin",  emoji: "🐬", threshold: 40 },
  { key: "whale",    name: "Whale",    emoji: "🐳", threshold: 50 },
];

// Given a per-pillar set count, find the highest tier the kid has
// unlocked + how many more sets they need for the next tier.
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
  const span = next.threshold - current.threshold;       // always 10 today, but compute from data
  const setsIntoCurrent = sets - current.threshold;
  const setsToNext = next.threshold - sets;
  const percentToNext = Math.round((setsIntoCurrent / span) * 100);
  return { current, next, setsIntoCurrent, setsToNext, percentToNext };
}

// Highest tier across the 3 pillars — used for the kid's "crest" on
// the Brain home (the single badge they show off).
export function bestTier(
  memorySets: number,
  focusSets: number,
  thinkingSets: number,
): BrainTier {
  const tiers = [
    tierForSets(memorySets).current,
    tierForSets(focusSets).current,
    tierForSets(thinkingSets).current,
  ];
  let best = tiers[0];
  for (const t of tiers) {
    if (t.threshold > best.threshold) best = t;
  }
  return best;
}
