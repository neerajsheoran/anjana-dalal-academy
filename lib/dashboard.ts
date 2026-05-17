// Server-only helpers for the parent brain-training dashboard.
// Loads + aggregates a child's `attempts` subcollection into a ChildDashboard.
//
// Types + constants live in `lib/dashboard-types.ts` so client components can
// import them without dragging `next/headers` / `firebase-admin` into the bundle.

import "server-only";

import { adminAuth, adminDb } from "./firebase-admin";
import { cookies } from "next/headers";
import {
  summarizeProgress,
  type AttemptForSummary,
} from "./insights";
import {
  BRAIN_ACTIVITIES,
  type ModuleKey,
} from "./brain-modules";
import { type Difficulty } from "./difficulty";
import type {
  ActivityProgress,
  ChildDashboard,
  DashboardChild,
  PillarSummary,
} from "./dashboard-types";

// Re-export types so callers can import from either location during refactors.
export type {
  DashboardChild,
  PillarSummary,
  ActivityProgress,
  ChildDashboard,
} from "./dashboard-types";

const PILLARS: ModuleKey[] = ["memory", "focus", "thinking"];

export async function getParentUid(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(session);
    return decoded.uid;
  } catch {
    return null;
  }
}

export async function loadDashboardChildren(
  parentUid: string,
): Promise<DashboardChild[]> {
  const snap = await adminDb
    .collection("users")
    .doc(parentUid)
    .collection("children")
    .orderBy("createdAt", "asc")
    .get();
  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      name: (d.name as string) || "",
      age: (d.age as number) || 0,
      classId: (d.classId as string) || null,
      ageGroup: (d.ageGroup as string) || "foundation",
    };
  });
}

interface RawAttempt {
  activityKey?: string;
  moduleKey?: string;
  difficultyLevel?: string;
  isCorrect?: boolean;
  scores?: { finalActivityScore?: number };
  createdAt?: { toDate?: () => Date };
}

function isModuleKey(v: unknown): v is ModuleKey {
  return v === "memory" || v === "focus" || v === "thinking";
}
function isDifficulty(v: unknown): v is Difficulty {
  return v === "easy" || v === "medium" || v === "hard";
}

export async function loadChildDashboard(
  parentUid: string,
  child: DashboardChild,
): Promise<ChildDashboard> {
  const snap = await adminDb
    .collection("users")
    .doc(parentUid)
    .collection("children")
    .doc(child.id)
    .collection("attempts")
    .orderBy("createdAt", "desc")
    .limit(200)
    .get();

  const rawAttempts: AttemptForSummary[] = [];
  let lastSessionAt: Date | null = null;

  for (const doc of snap.docs) {
    const d = doc.data() as RawAttempt;
    if (!isModuleKey(d.moduleKey)) continue;
    if (!isDifficulty(d.difficultyLevel)) continue;
    const createdAt = d.createdAt?.toDate?.();
    if (!createdAt) continue;
    if (!lastSessionAt || createdAt > lastSessionAt) lastSessionAt = createdAt;
    rawAttempts.push({
      activityKey: d.activityKey || "",
      moduleKey: d.moduleKey,
      difficultyLevel: d.difficultyLevel,
      isCorrect: d.isCorrect === true,
      finalActivityScore: d.scores?.finalActivityScore ?? 0,
      createdAt,
    });
  }

  const totalAttempts = rawAttempts.length;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const days7 = new Set<string>();
  const days30 = new Set<string>();
  const allTrainingDays = new Set<string>();
  for (const a of rawAttempts) {
    const day = a.createdAt.toISOString().slice(0, 10);
    allTrainingDays.add(day);
    if (a.createdAt >= thirtyDaysAgo) days30.add(day);
    if (a.createdAt >= sevenDaysAgo) days7.add(day);
  }

  // ── Streak ────────────────────────────────────────────────────────────
  // Count consecutive trained days ending today (or yesterday if today
  // hasn't been trained yet — gives the kid a grace day so streak doesn't
  // "die" mid-day before bedtime).
  const todayLocal = new Date();
  todayLocal.setHours(0, 0, 0, 0);
  const dayKey = (d: Date): string => d.toISOString().slice(0, 10);

  let streakDays = 0;
  const cursor = new Date(todayLocal);
  if (allTrainingDays.has(dayKey(cursor))) {
    while (allTrainingDays.has(dayKey(cursor))) {
      streakDays += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
  } else {
    // Grace: today not trained yet, count back from yesterday
    cursor.setDate(cursor.getDate() - 1);
    while (allTrainingDays.has(dayKey(cursor))) {
      streakDays += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  // ── 7-day heatmap pattern ────────────────────────────────────────────
  // Index 0 = today, 6 = 6 days ago. true means trained that day.
  const weekdayPattern: boolean[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(todayLocal);
    d.setDate(todayLocal.getDate() - i);
    weekdayPattern.push(allTrainingDays.has(dayKey(d)));
  }

  const pillars: PillarSummary[] = PILLARS.map((p) => {
    const inPillar = rawAttempts.filter((a) => a.moduleKey === p);
    if (inPillar.length === 0) {
      return { pillar: p, attempts: 0, avgScore: null, trend: "n/a", recentScores: [] };
    }
    const sum = inPillar.reduce((s, a) => s + a.finalActivityScore, 0);
    const avgScore = Math.round(sum / inPillar.length);

    let trend: PillarSummary["trend"] = "flat";
    if (inPillar.length >= 6) {
      const recent3 =
        inPillar.slice(0, 3).reduce((s, a) => s + a.finalActivityScore, 0) / 3;
      const prior3 =
        inPillar.slice(3, 6).reduce((s, a) => s + a.finalActivityScore, 0) / 3;
      if (recent3 - prior3 >= 8) trend = "up";
      else if (prior3 - recent3 >= 8) trend = "down";
      else trend = "flat";
    } else {
      trend = "n/a";
    }

    // rawAttempts (and therefore inPillar) is ordered newest-first. The
    // sparkline wants chronological (oldest → newest) so we reverse.
    const recentScores = inPillar
      .slice(0, 10)
      .map((a) => a.finalActivityScore)
      .reverse();

    return { pillar: p, attempts: inPillar.length, avgScore, trend, recentScores };
  });

  const activities: ActivityProgress[] = Object.values(BRAIN_ACTIVITIES).map(
    (act) => {
      const myAttempts = rawAttempts.filter((a) => a.activityKey === act.key);
      const bestScore =
        myAttempts.length > 0
          ? myAttempts.reduce((b, a) => Math.max(b, a.finalActivityScore), 0)
          : null;
      const currentDifficulty =
        myAttempts.length > 0 ? myAttempts[0].difficultyLevel : null;
      const ageGated = child.age < act.minAge || child.age > act.maxAge;
      return {
        activityKey: act.key,
        activityName: act.name,
        pillar: act.module,
        currentDifficulty,
        attemptCount: myAttempts.length,
        bestScore,
        available: act.available,
        ageGated,
      };
    },
  );

  const insights = summarizeProgress(rawAttempts);

  return {
    child,
    totalAttempts,
    trainingDays7d: days7.size,
    trainingDays30d: days30.size,
    lastSessionAt,
    streakDays,
    weekdayPattern,
    pillars,
    activities,
    insights,
  };
}
