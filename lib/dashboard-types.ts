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
  pillars: PillarSummary[];
  activities: ActivityProgress[];
  insights: ProgressInsight[];
}

export const PILLAR_META: Record<
  ModuleKey,
  { label: string; emoji: string; chip: string; bar: string; soft: string }
> = {
  memory: {
    label: BRAIN_MODULES.memory.name,
    emoji: BRAIN_MODULES.memory.emoji,
    chip: "bg-purple-100 text-purple-700",
    bar: "bg-purple-500",
    soft: "bg-purple-50",
  },
  focus: {
    label: BRAIN_MODULES.focus.name,
    emoji: BRAIN_MODULES.focus.emoji,
    chip: "bg-green-100 text-green-700",
    bar: "bg-green-500",
    soft: "bg-green-50",
  },
  thinking: {
    label: BRAIN_MODULES.thinking.name,
    emoji: BRAIN_MODULES.thinking.emoji,
    chip: "bg-orange-100 text-orange-700",
    bar: "bg-orange-500",
    soft: "bg-orange-50",
  },
};
