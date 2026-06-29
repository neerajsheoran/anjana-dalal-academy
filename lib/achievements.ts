// Server-side aggregation for the /achievements page (the kid's
// trophy room). Wraps getBrainStats and adds the bits that page
// needs but the brain dashboard does not:
//   - days-active count (BrainStats has lastActiveIstDay only)
//   - chapters read count (academic side)
//   - longest streak (best streak ever, not just current)
//
// Kept celebration-only by design: no quiz scores, no failure framing,
// no negative deltas. The parent dashboard owns evaluative metrics.

import { FieldPath } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";
import type { ModuleKey } from "./brain-modules";
import { getBrainStats, type BrainStats } from "./brain-stats";

const VALID_MODULES: ModuleKey[] = ["memory", "focus", "thinking"];
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function istDayKey(date: Date): string {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  return ist.toISOString().slice(0, 10);
}

function prevIstDay(istDay: string): string {
  const [y, m, d] = istDay.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d) - 24 * 60 * 60 * 1000;
  return new Date(t).toISOString().slice(0, 10);
}

export interface AchievementsData {
  brainStats: BrainStats;
  totalDaysActive: number;
  longestStreak: number;
  chaptersRead: number;
  chaptersCompleted: number;
}

export async function getAchievementsData(
  parentUid: string,
  childId: string,
): Promise<AchievementsData> {
  if (!parentUid || !childId) return emptyData();

  const [brainStats, attemptsExtras, chapterCounts] = await Promise.all([
    getBrainStats(parentUid, childId),
    getAttemptsExtras(parentUid, childId),
    getChapterCounts(parentUid, childId),
  ]);

  return {
    brainStats,
    totalDaysActive: attemptsExtras.totalDaysActive,
    longestStreak: attemptsExtras.longestStreak,
    chaptersRead: chapterCounts.read,
    chaptersCompleted: chapterCounts.completed,
  };
}

async function getAttemptsExtras(
  parentUid: string,
  childId: string,
): Promise<{ totalDaysActive: number; longestStreak: number }> {
  try {
    const snap = await adminDb
      .collection("users")
      .doc(parentUid)
      .collection("children")
      .doc(childId)
      .collection("attempts")
      .get();

    if (snap.empty) return { totalDaysActive: 0, longestStreak: 0 };

    const activeDays = new Set<string>();
    for (const doc of snap.docs) {
      const d = doc.data();
      const mod = d.moduleKey as ModuleKey | undefined;
      if (!mod || !VALID_MODULES.includes(mod)) continue;
      const ts: Date = d.createdAt?.toDate?.() ?? new Date();
      activeDays.add(istDayKey(ts));
    }

    const sortedDays = [...activeDays].sort();
    let longest = 0;
    let current = 0;
    let prev: string | null = null;
    for (const day of sortedDays) {
      if (prev === null || prevIstDay(day) === prev) {
        current++;
      } else {
        current = 1;
      }
      if (current > longest) longest = current;
      prev = day;
    }

    return { totalDaysActive: activeDays.size, longestStreak: longest };
  } catch {
    return { totalDaysActive: 0, longestStreak: 0 };
  }
}

async function getChapterCounts(
  parentUid: string,
  childId: string,
): Promise<{ read: number; completed: number }> {
  try {
    const prefix = `${childId}__`;
    const HIGH = String.fromCharCode(0xf8ff);
    const snap = await adminDb
      .collection("users")
      .doc(parentUid)
      .collection("progress")
      .where(FieldPath.documentId(), ">=", prefix)
      .where(FieldPath.documentId(), "<", prefix + HIGH)
      .get();

    let completed = 0;
    for (const doc of snap.docs) {
      if (doc.data().completed === true) completed++;
    }
    return { read: snap.size, completed };
  } catch {
    return { read: 0, completed: 0 };
  }
}

function emptyData(): AchievementsData {
  return {
    brainStats: {
      memory:   emptyPillar(),
      focus:    emptyPillar(),
      thinking: emptyPillar(),
      totalSets: 0,
      bestTier: { key: "tadpole", name: "Tadpole", emoji: "🐸", threshold: 0 },
      streakDays: 0,
      lastActiveIstDay: null,
    },
    totalDaysActive: 0,
    longestStreak: 0,
    chaptersRead: 0,
    chaptersCompleted: 0,
  };
}

function emptyPillar() {
  return {
    setsCount: 0,
    tier: { key: "tadpole", name: "Tadpole", emoji: "🐸", threshold: 0 },
    next: { key: "goldfish", name: "Goldfish", emoji: "🐠", threshold: 10 },
    setsToNext: 10,
    percentToNext: 0,
    doneToday: false,
  };
}
