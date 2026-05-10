// Rule-based insight generation — Phase 2 MVP.
//
// Two layers:
//   1. `generateInsight()` — per-attempt insight (4 rules + bonuses) shown on
//      the round-summary card immediately after a session.
//   2. `summarizeProgress()` — cross-attempt summary insights computed on the
//      parent dashboard from attempt history. Surfaces consistency, pillar
//      strengths/weaknesses, and level-up celebrations.
//
// Per cognilift-pdf-mismatches.md resolved mismatch #6: ship MINIMAL insights
// for Phase 2; the full engine waits for usage data.

import type { ConfidenceLevel } from "./scoring";
import type { ModuleKey } from "./brain-modules";
import type { Difficulty } from "./difficulty";

export interface InsightInput {
  isCorrect: boolean;
  timeTakenSeconds: number;
  expectedTimeSeconds: number;
  confidence: ConfidenceLevel;
}

export interface Insight {
  type:
    | "careless"
    | "weak-understanding"
    | "overconfidence"
    | "underconfidence"
    | "strong-thinking"
    | "neutral";
  title: string;       // child-friendly headline
  message: string;     // explanation, ≤120 chars
}

const FAST_THRESHOLD_RATIO = 0.5;  // < 50% of expected time = "fast"
const SLOW_THRESHOLD_RATIO = 1.5;  // > 150% of expected time = "slow"

export function generateInsight(input: InsightInput): Insight {
  const timeRatio =
    input.expectedTimeSeconds > 0
      ? input.timeTakenSeconds / input.expectedTimeSeconds
      : 1;
  const isFast = timeRatio < FAST_THRESHOLD_RATIO;
  const isSlow = timeRatio > SLOW_THRESHOLD_RATIO;

  // Rule 1: Fast + Wrong → Careless
  if (!input.isCorrect && isFast) {
    return {
      type: "careless",
      title: "Take your time",
      message: "You answered quickly but missed it. Slow down a little next round.",
    };
  }

  // Rule 2: Slow + Wrong → Weak understanding
  if (!input.isCorrect && isSlow) {
    return {
      type: "weak-understanding",
      title: "Almost!",
      message: "Look at the pattern more carefully. You'll get it next time.",
    };
  }

  // Rule 3: High confidence + Wrong → Overconfidence
  if (!input.isCorrect && input.confidence === "high") {
    return {
      type: "overconfidence",
      title: "Double-check next time",
      message: "You felt sure, but missed it. A second look helps.",
    };
  }

  // Rule 4: Low confidence + Correct → Underconfidence
  if (input.isCorrect && input.confidence === "low") {
    return {
      type: "underconfidence",
      title: "Trust yourself!",
      message: "You got it right even though you weren't sure. Good thinking.",
    };
  }

  // Bonus: Correct + High confidence + reasonable time → Strong thinking
  if (input.isCorrect && input.confidence === "high" && !isSlow) {
    return {
      type: "strong-thinking",
      title: "Great memory!",
      message: "You knew it and answered confidently. Keep going.",
    };
  }

  // Default neutral
  return {
    type: "neutral",
    title: "Nice try",
    message: input.isCorrect
      ? "Good job — try the next round."
      : "Practice makes it stick. Try again.",
  };
}

// ── Cross-attempt summary insights (dashboard) ───────────────────────────

const PILLAR_LABEL: Record<ModuleKey, string> = {
  memory: "Memory",
  focus: "Focus",
  thinking: "Thinking",
};

const DIFFICULTY_RANK: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };

const ACTIVITY_LABEL: Record<string, string> = {
  "pattern-recall": "Pattern Recall",
  "find-the-object": "Find the Object",
  "pattern-logic": "Pattern Logic",
  "number-recall": "Number Recall",
  "number-sequence": "Number Sequence",
};

export interface AttemptForSummary {
  activityKey: string;
  moduleKey: ModuleKey;
  difficultyLevel: Difficulty;
  isCorrect: boolean;
  finalActivityScore: number;
  createdAt: Date;
}

export interface ProgressInsight {
  type:
    | "first-session"
    | "consistency"
    | "pillar-strength"
    | "pillar-needs-work"
    | "level-up";
  title: string;
  message: string;
  pillar?: ModuleKey;       // when scoped to a specific pillar
  emoji: string;            // for display
}

// Look at a child's attempt history and surface 0-N summary insights.
// Designed for the parent dashboard. Empty array = "not enough data yet".
export function summarizeProgress(attempts: AttemptForSummary[]): ProgressInsight[] {
  const insights: ProgressInsight[] = [];
  if (attempts.length === 0) return insights;

  // Not enough data → encourage more sessions instead of computing trends
  if (attempts.length < 3) {
    insights.push({
      type: "first-session",
      title: "Just getting started",
      message:
        "Play a few more sessions to unlock progress patterns and personalised insights.",
      emoji: "🌱",
    });
    return insights;
  }

  // Consistency: distinct training days in last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const recentAttempts = attempts.filter((a) => a.createdAt >= sevenDaysAgo);
  const distinctDays = new Set(
    recentAttempts.map((a) => a.createdAt.toISOString().slice(0, 10)),
  );
  if (distinctDays.size >= 4) {
    insights.push({
      type: "consistency",
      title: `${distinctDays.size}-day training week`,
      message: `Trained on ${distinctDays.size} different days this week. Habit forming nicely.`,
      emoji: "🔥",
    });
  } else if (distinctDays.size === 3) {
    insights.push({
      type: "consistency",
      title: "Building a habit",
      message: "3 days this week — one more session keeps the streak alive.",
      emoji: "✨",
    });
  }

  // Pillar performance: surface strongest + weakest when differential is meaningful
  const byPillar: Record<string, { sum: number; count: number }> = {};
  for (const a of recentAttempts) {
    if (!byPillar[a.moduleKey]) byPillar[a.moduleKey] = { sum: 0, count: 0 };
    byPillar[a.moduleKey].sum += a.finalActivityScore;
    byPillar[a.moduleKey].count += 1;
  }
  const pillarAvgs = Object.entries(byPillar).map(([k, v]) => ({
    pillar: k as ModuleKey,
    avg: Math.round(v.sum / v.count),
  }));
  if (pillarAvgs.length >= 2) {
    pillarAvgs.sort((a, b) => b.avg - a.avg);
    const strongest = pillarAvgs[0];
    const weakest = pillarAvgs[pillarAvgs.length - 1];
    if (strongest.avg - weakest.avg >= 25) {
      insights.push({
        type: "pillar-strength",
        pillar: strongest.pillar,
        title: `Strong on ${PILLAR_LABEL[strongest.pillar]}`,
        message: `${PILLAR_LABEL[strongest.pillar]} average: ${strongest.avg}/100 over the last week.`,
        emoji: "🌟",
      });
      insights.push({
        type: "pillar-needs-work",
        pillar: weakest.pillar,
        title: `${PILLAR_LABEL[weakest.pillar]} could use focus`,
        message: `${PILLAR_LABEL[weakest.pillar]} average: ${weakest.avg}/100. A few more sessions should lift it.`,
        emoji: "🎯",
      });
    }
  }

  // Level-up celebration: detect a difficulty climb in any activity
  const byActivity: Record<string, AttemptForSummary[]> = {};
  for (const a of attempts) {
    if (!byActivity[a.activityKey]) byActivity[a.activityKey] = [];
    byActivity[a.activityKey].push(a);
  }
  for (const [activityKey, list] of Object.entries(byActivity)) {
    list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const initialRank = DIFFICULTY_RANK[list[0].difficultyLevel];
    const latest = list[list.length - 1];
    const latestRank = DIFFICULTY_RANK[latest.difficultyLevel];
    if (latestRank > initialRank) {
      insights.push({
        type: "level-up",
        title: `Levelled up on ${ACTIVITY_LABEL[activityKey] || activityKey}`,
        message: `Climbed to ${latest.difficultyLevel} difficulty — the adaptive engine recognised the score trend.`,
        emoji: "🚀",
      });
      break; // one level-up celebration per session is enough
    }
  }

  return insights;
}
