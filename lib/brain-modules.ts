// Registry of brain training modules + their Phase 2 MVP activities.
// Per cognilift-pdf-mismatches.md resolved mismatch #5: depth over breadth —
// MVP ships ONE activity per pillar, validated, before adding more.

export type ModuleKey = "memory" | "focus" | "thinking";

export interface BrainModule {
  key: ModuleKey;
  name: string;
  shortDescription: string;     // child-friendly explanation
  mvpActivityKey: string;       // the one activity we ship for Phase 2 MVP
  zoneColor: "purple" | "green" | "orange";
  emoji: string;
}

export const BRAIN_MODULES: Record<ModuleKey, BrainModule> = {
  memory: {
    key: "memory",
    name: "Memory",
    shortDescription:
      "This part helps you remember things like patterns and stories.",
    mvpActivityKey: "pattern-recall",
    zoneColor: "purple",
    emoji: "🧠",
  },
  focus: {
    key: "focus",
    name: "Focus",
    shortDescription:
      "This helps you pay attention and ignore distractions.",
    mvpActivityKey: "find-the-object",
    zoneColor: "green",
    emoji: "🎯",
  },
  thinking: {
    key: "thinking",
    name: "Thinking",
    shortDescription:
      "This helps you solve problems and make smart decisions.",
    mvpActivityKey: "pattern-logic",
    zoneColor: "orange",
    emoji: "💡",
  },
};

export interface BrainActivity {
  key: string;
  name: string;
  module: ModuleKey;
  skill: string;       // what it measures, e.g. "Visual memory"
  minAge: number;
  maxAge: number;
  available: boolean;  // false = "coming soon" stub
}

export const BRAIN_ACTIVITIES: Record<string, BrainActivity> = {
  "pattern-recall": {
    key: "pattern-recall",
    name: "Pattern Recall",
    module: "memory",
    skill: "Visual memory",
    minAge: 5,
    maxAge: 15,
    available: true,
  },
  "find-the-object": {
    key: "find-the-object",
    name: "Find the Object",
    module: "focus",
    skill: "Visual scanning",
    minAge: 5,
    maxAge: 15,
    available: true,
  },
  "pattern-logic": {
    key: "pattern-logic",
    name: "Pattern Logic",
    module: "thinking",
    skill: "Logical reasoning",
    minAge: 5,
    maxAge: 15,
    available: true,
  },
  "number-recall": {
    key: "number-recall",
    name: "Number Recall",
    module: "memory",
    skill: "Numerical working memory",
    minAge: 9,
    maxAge: 15,
    available: true,
  },
  "number-sequence": {
    key: "number-sequence",
    name: "Number Sequence",
    module: "thinking",
    skill: "Mathematical reasoning",
    minAge: 11,
    maxAge: 15,
    available: true,
  },
  "spot-the-difference": {
    key: "spot-the-difference",
    name: "Spot the Difference",
    module: "focus",
    skill: "Visual attention to detail",
    minAge: 5,
    maxAge: 15,
    available: true,
  },
  "stroop-task": {
    key: "stroop-task",
    name: "Color Catch",
    module: "focus",
    skill: "Inhibition control",
    minAge: 8,
    maxAge: 15,
    available: true,
  },
  "color-sequence": {
    key: "color-sequence",
    name: "Color Sequence",
    module: "memory",
    skill: "Sequential memory",
    minAge: 5,
    maxAge: 15,
    available: true,
  },
  "tap-back": {
    key: "tap-back",
    name: "Tap-Back",
    module: "memory",
    skill: "Spatial-sequential memory",
    minAge: 7,
    maxAge: 15,
    available: true,
  },
  "odd-one-out": {
    key: "odd-one-out",
    name: "Odd One Out",
    module: "thinking",
    skill: "Categorization",
    minAge: 5,
    maxAge: 15,
    available: true,
  },
  "analogies": {
    key: "analogies",
    name: "Analogies",
    module: "thinking",
    skill: "Analogical reasoning",
    minAge: 9,
    maxAge: 15,
    available: true,
  },
  "whack-a-target": {
    key: "whack-a-target",
    name: "Whack-a-Target",
    module: "focus",
    skill: "Sustained attention",
    minAge: 8,
    maxAge: 15,
    available: true,
  },
  "mini-sudoku": {
    key: "mini-sudoku",
    name: "Mini Sudoku",
    module: "thinking",
    skill: "Constraint reasoning",
    minAge: 8,
    maxAge: 15,
    available: true,
  },
};

export function getActivitiesForModule(moduleKey: ModuleKey): BrainActivity[] {
  return Object.values(BRAIN_ACTIVITIES).filter((a) => a.module === moduleKey);
}

// Tailwind class helpers — keeps colour decisions in one place
export const ZONE_BG: Record<BrainModule["zoneColor"], string> = {
  purple: "bg-purple-500",
  green: "bg-green-500",
  orange: "bg-orange-500",
};
export const ZONE_BG_SOFT: Record<BrainModule["zoneColor"], string> = {
  purple: "bg-purple-100",
  green: "bg-green-100",
  orange: "bg-orange-100",
};
export const ZONE_TEXT: Record<BrainModule["zoneColor"], string> = {
  purple: "text-purple-700",
  green: "text-green-700",
  orange: "text-orange-700",
};
export const ZONE_GLOW: Record<BrainModule["zoneColor"], string> = {
  purple: "shadow-[0_0_30px_rgba(168,85,247,0.6)]",
  green: "shadow-[0_0_30px_rgba(34,197,94,0.6)]",
  orange: "shadow-[0_0_30px_rgba(251,146,60,0.6)]",
};
