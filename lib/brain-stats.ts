// Server-side aggregation over a child's brain-training attempts.
//
// Reads users/{parentUid}/children/{childId}/attempts and computes:
//   - sets per pillar (Memory / Focus / Thinking)
//   - current + next tier per pillar
//   - "best" tier across pillars (the crest the kid shows off)
//   - daily progress (which pillars touched TODAY)
//   - streak (consecutive days with at least one attempt, IST day boundary)
//
// "1 set" = 1 game session. A session may write multiple attempt
// documents (Memory Match writes 3 rounds = 3 attempts). We collapse
// them by (activityKey, minute-bucket) so a single 3-round play is
// counted once.

import { adminDb } from "./firebase-admin";
import type { ModuleKey } from "./brain-modules";
import {
  bestTier,
  tierForSets,
  type BrainTier,
  type TierProgress,
} from "./brain-tiers";

const VALID_MODULES: ModuleKey[] = ["memory", "focus", "thinking"];
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// IST day key: YYYY-MM-DD in Asia/Kolkata. We use IST consistently so
// "today" feels right to Indian parents and the streak doesn't jump
// when the kid plays at 11pm local.
function istDayKey(date: Date): string {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  return ist.toISOString().slice(0, 10);
}

// Round a Date down to the minute — used to collapse multi-round
// sessions of the same activity into one set.
function minuteBucket(date: Date): string {
  return date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
}

export interface PillarStats {
  setsCount: number;
  tier: BrainTier;
  next: BrainTier | null;
  setsToNext: number;
  percentToNext: number;
  doneToday: boolean;
}

export interface BrainStats {
  memory: PillarStats;
  focus: PillarStats;
  thinking: PillarStats;
  totalSets: number;
  bestTier: BrainTier;          // for the home crest
  streakDays: number;           // current streak
  lastActiveIstDay: string | null;
}

function emptyStats(): BrainStats {
  const t0 = tierForSets(0);
  const emptyPillar: PillarStats = {
    setsCount: 0,
    tier: t0.current,
    next: t0.next,
    setsToNext: t0.setsToNext,
    percentToNext: t0.percentToNext,
    doneToday: false,
  };
  return {
    memory:   { ...emptyPillar },
    focus:    { ...emptyPillar },
    thinking: { ...emptyPillar },
    totalSets: 0,
    bestTier: t0.current,
    streakDays: 0,
    lastActiveIstDay: null,
  };
}

export async function getBrainStats(
  parentUid: string,
  childId: string,
): Promise<BrainStats> {
  if (!parentUid || !childId) return emptyStats();

  // Pull all attempts for this child. Each child accumulates a few
  // hundred per year — small enough to read fully here. If this ever
  // becomes a hotspot, page or cache.
  let snapshot;
  try {
    snapshot = await adminDb
      .collection("users")
      .doc(parentUid)
      .collection("children")
      .doc(childId)
      .collection("attempts")
      .get();
  } catch {
    return emptyStats();
  }

  if (snapshot.empty) return emptyStats();

  // Collapse attempts into sessions. A "session" = unique
  // (moduleKey, activityKey, minute-bucket). Within a session we keep
  // the earliest createdAt for IST-day classification.
  const sessions = new Map<string, { moduleKey: ModuleKey; istDay: string }>();
  for (const doc of snapshot.docs) {
    const d = doc.data();
    const mod = d.moduleKey as ModuleKey | undefined;
    if (!mod || !VALID_MODULES.includes(mod)) continue;
    const ts: Date = d.createdAt?.toDate?.() ?? new Date();
    const bucket = minuteBucket(ts);
    const sessionKey = `${mod}::${d.activityKey}::${bucket}`;
    if (sessions.has(sessionKey)) continue;
    sessions.set(sessionKey, { moduleKey: mod, istDay: istDayKey(ts) });
  }

  // Per-pillar set counts + per-pillar daily-touched-today set.
  const counts: Record<ModuleKey, number> = { memory: 0, focus: 0, thinking: 0 };
  const today = istDayKey(new Date());
  const todaysModules = new Set<ModuleKey>();
  const activeIstDays = new Set<string>();
  for (const s of sessions.values()) {
    counts[s.moduleKey]++;
    activeIstDays.add(s.istDay);
    if (s.istDay === today) todaysModules.add(s.moduleKey);
  }

  // Streak: walk back from today (or yesterday if not played today) counting
  // consecutive IST days that appear in activeIstDays. Stops on first gap.
  let streak = 0;
  const todayPlayed = activeIstDays.has(today);
  const startKey = todayPlayed ? today : prevIstDay(today);
  if (activeIstDays.has(startKey)) {
    let cursor = startKey;
    while (activeIstDays.has(cursor)) {
      streak++;
      cursor = prevIstDay(cursor);
    }
  }

  const memProg = tierForSets(counts.memory);
  const focProg = tierForSets(counts.focus);
  const thiProg = tierForSets(counts.thinking);

  const lastActive =
    activeIstDays.size === 0
      ? null
      : [...activeIstDays].sort().pop() ?? null;

  return {
    memory:   asPillarStats(memProg, counts.memory, todaysModules.has("memory")),
    focus:    asPillarStats(focProg, counts.focus, todaysModules.has("focus")),
    thinking: asPillarStats(thiProg, counts.thinking, todaysModules.has("thinking")),
    totalSets: counts.memory + counts.focus + counts.thinking,
    bestTier: bestTier(counts.memory, counts.focus, counts.thinking),
    streakDays: streak,
    lastActiveIstDay: lastActive,
  };
}

function asPillarStats(p: TierProgress, count: number, doneToday: boolean): PillarStats {
  return {
    setsCount: count,
    tier: p.current,
    next: p.next,
    setsToNext: p.setsToNext,
    percentToNext: p.percentToNext,
    doneToday,
  };
}

// YYYY-MM-DD → previous IST day's key.
function prevIstDay(istDay: string): string {
  const [y, m, d] = istDay.split("-").map(Number);
  // Use UTC math then shift back — avoids local-timezone surprises in
  // the dev environment.
  const t = Date.UTC(y, m - 1, d) - 24 * 60 * 60 * 1000;
  const dt = new Date(t);
  return dt.toISOString().slice(0, 10);
}
