// Difficulty system for brain activities.
// Each activity reads its own config object keyed by Difficulty.
// Default per-age mapping is fed from the activity wrapper page.
//
// Adaptive engine (next iteration) will override the default by reading
// recent attempt scores; for now we just pick by age.

export type Difficulty = "easy" | "medium" | "hard";

// Default difficulty by age. The 11-year-old who originally complained
// will land on "hard" by default.
export function getDefaultDifficultyForAge(age: number): Difficulty {
  if (age <= 7) return "easy";
  if (age <= 10) return "medium";
  return "hard";
}

// Human label for the badge shown in the activity UI.
export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export const DIFFICULTY_BADGE_BG: Record<Difficulty, string> = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-rose-100 text-rose-700",
};

// ── Pattern Recall (Memory) ──────────────────────────────────────────────
export interface PatternRecallConfig {
  gridSize: number;          // N×N grid
  cellsToRemember: number;
  showDurationMs: number;
  expectedTimeSeconds: number;
}

export const PATTERN_RECALL_CONFIG: Record<Difficulty, PatternRecallConfig> = {
  easy:   { gridSize: 3, cellsToRemember: 3, showDurationMs: 3000, expectedTimeSeconds: 6 },
  medium: { gridSize: 4, cellsToRemember: 4, showDurationMs: 2500, expectedTimeSeconds: 8 },
  hard:   { gridSize: 5, cellsToRemember: 5, showDurationMs: 2000, expectedTimeSeconds: 10 },
};

// ── Find the Object (Focus) ──────────────────────────────────────────────
export interface FindObjectConfig {
  gridSize: number;          // N×N grid
  expectedTimeSeconds: number;
}

export const FIND_OBJECT_CONFIG: Record<Difficulty, FindObjectConfig> = {
  easy:   { gridSize: 3, expectedTimeSeconds: 5 },
  medium: { gridSize: 4, expectedTimeSeconds: 7 },
  hard:   { gridSize: 5, expectedTimeSeconds: 9 },
};

// Pool of 30+ visually distinct emojis — enough for a 5×5 grid (25 cells)
// of distinct items. Order doesn't matter; we shuffle on each round.
export const ANIMAL_POOL_LARGE = [
  '🐶', '🐱', '🐰', '🦁', '🐸', '🐻', '🐼', '🦊', '🐨', '🐵',
  '🐯', '🐮', '🐷', '🐔', '🦄', '🐢', '🐘', '🐧', '🐳', '🐝',
  '🐭', '🐹', '🦒', '🦓', '🦏', '🐊', '🦘', '🦝', '🦅', '🦉',
];

// ── Pattern Logic (Thinking) ─────────────────────────────────────────────
export interface PatternLogicConfig {
  patternKind: "ABAB" | "AABAAB" | "ABCABC";
  sequenceLength: number;     // how many shown before "?"
  optionCount: number;        // multiple choice options
  expectedTimeSeconds: number;
}

export const PATTERN_LOGIC_CONFIG: Record<Difficulty, PatternLogicConfig> = {
  easy:   { patternKind: "ABAB",   sequenceLength: 4, optionCount: 3, expectedTimeSeconds: 6 },
  medium: { patternKind: "AABAAB", sequenceLength: 6, optionCount: 3, expectedTimeSeconds: 9 },
  hard:   { patternKind: "ABCABC", sequenceLength: 6, optionCount: 4, expectedTimeSeconds: 12 },
};

// ── Number Recall (Memory, elder kids) ───────────────────────────────────
export interface NumberRecallConfig {
  digitCount: number;
  showDurationMs: number;
  expectedTimeSeconds: number;
}

export const NUMBER_RECALL_CONFIG: Record<Difficulty, NumberRecallConfig> = {
  easy:   { digitCount: 4, showDurationMs: 3500, expectedTimeSeconds: 8 },
  medium: { digitCount: 5, showDurationMs: 3000, expectedTimeSeconds: 10 },
  hard:   { digitCount: 7, showDurationMs: 3000, expectedTimeSeconds: 14 },
};

// ── Number Sequence (Thinking, elder kids) ───────────────────────────────
export interface NumberSequenceConfig {
  patternKind: "arithmetic" | "geometric" | "mixed";
  showCount: number;       // numbers shown before "?"
  optionCount: number;
  expectedTimeSeconds: number;
}

export const NUMBER_SEQUENCE_CONFIG: Record<Difficulty, NumberSequenceConfig> = {
  easy:   { patternKind: "arithmetic", showCount: 5, optionCount: 4, expectedTimeSeconds: 10 },
  medium: { patternKind: "geometric",  showCount: 5, optionCount: 4, expectedTimeSeconds: 12 },
  hard:   { patternKind: "mixed",      showCount: 5, optionCount: 4, expectedTimeSeconds: 15 },
};
