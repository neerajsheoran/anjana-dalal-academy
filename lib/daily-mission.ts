// Daily mission picker. Refactored 2026-06-30 from 3-pillar-block
// (do 1 Memory + 1 Focus + 1 Thinking) to a mixed 9-game session
// based on user feedback that varied practice keeps engagement higher.
//
// Picks 3 age-eligible activities per pillar deterministically based on
// (childId, IST date), then interleaves them M-F-T-M-F-T-M-F-T so the
// kid never plays the same pillar twice in a row.
//
// Determinism matters: refreshing the page should NOT reshuffle the
// session, because the kid's already-played games need to map back to
// the same slots.

import { BRAIN_ACTIVITIES, getActivitiesForModule, type ModuleKey } from "./brain-modules";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const PICKS_PER_PILLAR = 3;
const PILLAR_ORDER: ModuleKey[] = ["memory", "focus", "thinking"];

export interface DailyMissionGame {
  activityKey: string;
  module: ModuleKey;
  name: string;
  done: boolean;
}

export interface DailyMission {
  date: string;              // IST date key (YYYY-MM-DD)
  games: DailyMissionGame[]; // 9 items in interleaved order
  doneCount: number;
  total: number;
  isComplete: boolean;
  // The next not-yet-done game in the queue — what the "Continue" CTA
  // should point at. null when isComplete.
  nextGame: DailyMissionGame | null;
}

function istDayKey(date: Date): string {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  return ist.toISOString().slice(0, 10);
}

// djb2-style hash, deterministic. Used to seed the daily picker so that
// (same childId, same date) -> same 9-game pick every time.
function seedFor(childId: string, dateKey: string, salt: number): number {
  let h = 5381;
  const s = `${childId}::${dateKey}::${salt}`;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
    h = h >>> 0;
  }
  return h || 1; // avoid 0 seed which would freeze the LCG
}

function shuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let rng = seed;
  const next = () => {
    rng = (rng * 1664525 + 1013904223) >>> 0;
    return rng / 0xffffffff;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickPerPillar(
  pillar: ModuleKey,
  age: number,
  seed: number,
): { activityKey: string; module: ModuleKey; name: string }[] {
  const eligible = getActivitiesForModule(pillar).filter(
    (a) => a.available && age >= a.minAge && age <= a.maxAge,
  );
  // If we don't have enough age-eligible games, fall back to all
  // available games in this pillar — better one repeat than a short day.
  const pool = eligible.length >= PICKS_PER_PILLAR
    ? eligible
    : getActivitiesForModule(pillar).filter((a) => a.available);
  const shuffled = shuffle(pool, seed);
  return shuffled.slice(0, PICKS_PER_PILLAR).map((a) => ({
    activityKey: a.key,
    module: a.module,
    name: a.name,
  }));
}

export function getDailyMission(opts: {
  childId: string | null;
  age: number;
  playedTodayKeys: string[];
}): DailyMission {
  const today = istDayKey(new Date());
  const seedId = opts.childId || "anon";
  const memorySeed = seedFor(seedId, today, 1);
  const focusSeed = seedFor(seedId, today, 2);
  const thinkingSeed = seedFor(seedId, today, 3);

  const memoryPicks = pickPerPillar("memory", opts.age, memorySeed);
  const focusPicks = pickPerPillar("focus", opts.age, focusSeed);
  const thinkingPicks = pickPerPillar("thinking", opts.age, thinkingSeed);

  const interleaved: { activityKey: string; module: ModuleKey; name: string }[] = [];
  for (let i = 0; i < PICKS_PER_PILLAR; i++) {
    if (memoryPicks[i])   interleaved.push(memoryPicks[i]);
    if (focusPicks[i])    interleaved.push(focusPicks[i]);
    if (thinkingPicks[i]) interleaved.push(thinkingPicks[i]);
  }

  const playedSet = new Set(opts.playedTodayKeys);
  const games: DailyMissionGame[] = interleaved.map((g) => ({
    ...g,
    done: playedSet.has(g.activityKey),
  }));

  const doneCount = games.filter((g) => g.done).length;
  const total = games.length;
  const isComplete = total > 0 && doneCount === total;
  const nextGame = games.find((g) => !g.done) ?? null;

  return { date: today, games, doneCount, total, isComplete, nextGame };
}

// Convenience helper for the kid home hero — same picker but just
// returns the headline numbers, no game array.
export function getDailyMissionProgress(opts: {
  childId: string | null;
  age: number;
  playedTodayKeys: string[];
}): { doneCount: number; total: number; isComplete: boolean } {
  const m = getDailyMission(opts);
  return { doneCount: m.doneCount, total: m.total, isComplete: m.isComplete };
}

// Used by activity name lookups outside this module.
export function activityNameFromKey(activityKey: string): string {
  return BRAIN_ACTIVITIES[activityKey]?.name ?? activityKey;
}
