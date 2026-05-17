// Pure types + constants for the parent dashboard. Importable by client
// components (no server-only imports like `next/headers` or firebase-admin).
//
// Keep this file dependency-free of any server modules. `lib/dashboard.ts`
// holds the server-only helpers and re-exports nothing from here.

import { BRAIN_MODULES, type ModuleKey } from "./brain-modules";
import { type Difficulty } from "./difficulty";
import { type ProgressInsight } from "./insights";

export interface DashboardChild {
  id: string;
  name: string;
  age: number;
  classId: string | null;
  ageGroup: string;
}

export interface PillarSummary {
  pillar: ModuleKey;
  attempts: number;
  avgScore: number | null;
  trend: "up" | "down" | "flat" | "n/a";
  // Last ~10 attempt scores in chronological order (oldest first → newest
  // last). Used to render an inline sparkline inside the pillar card.
  recentScores: number[];
}

export interface ActivityProgress {
  activityKey: string;
  activityName: string;
  pillar: ModuleKey;
  currentDifficulty: Difficulty | null;
  attemptCount: number;
  bestScore: number | null;
  available: boolean;
  ageGated: boolean;
}

export interface ChildDashboard {
  child: DashboardChild;
  totalAttempts: number;
  trainingDays7d: number;
  trainingDays30d: number;
  lastSessionAt: Date | null;
  // Current consecutive-days streak. Grace rule: if the kid hasn't trained
  // today yet, the streak still counts back from yesterday (so the streak
  // doesn't "die" mid-day until tomorrow rolls over). 0 means no streak.
  streakDays: number;
  // 7-element array, index 0 = today, index 6 = 6 days ago. true = trained.
  // Used by the heatmap strip at the top of the dashboard.
  weekdayPattern: boolean[];
  // All ISO date strings (YYYY-MM-DD) within the last 35 days on which the
  // child trained. Lets the heatmap navigate back up to 4 weeks without
  // refetching data — the client picks any 7-day window from this set.
  trainingDayKeys: string[];
  pillars: PillarSummary[];
  activities: ActivityProgress[];
  insights: ProgressInsight[];
}

export const PILLAR_META: Record<
  ModuleKey,
  { label: string; emoji: string; chip: string; bar: string; soft: string; line: string }
> = {
  memory: {
    label: BRAIN_MODULES.memory.name,
    emoji: BRAIN_MODULES.memory.emoji,
    chip: "bg-purple-100 text-purple-700",
    bar: "bg-purple-500",
    soft: "bg-purple-50",
    line: "text-purple-500",
  },
  focus: {
    label: BRAIN_MODULES.focus.name,
    emoji: BRAIN_MODULES.focus.emoji,
    chip: "bg-green-100 text-green-700",
    bar: "bg-green-500",
    soft: "bg-green-50",
    line: "text-green-500",
  },
  thinking: {
    label: BRAIN_MODULES.thinking.name,
    emoji: BRAIN_MODULES.thinking.emoji,
    chip: "bg-orange-100 text-orange-700",
    bar: "bg-orange-500",
    soft: "bg-orange-50",
    line: "text-orange-500",
  },
};
