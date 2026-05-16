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

// ── Spot the Difference (Focus, age 5+) ──────────────────────────────────
export interface SpotDifferenceConfig {
  gridSize: number;          // 3, 4, or 5 — the grid of shapes on each side
  differences: number;       // how many cells differ between left and right
  expectedTimeSeconds: number;
}

export const SPOT_DIFFERENCE_CONFIG: Record<Difficulty, SpotDifferenceConfig> = {
  easy:   { gridSize: 3, differences: 1, expectedTimeSeconds: 8 },
  medium: { gridSize: 4, differences: 2, expectedTimeSeconds: 12 },
  hard:   { gridSize: 5, differences: 3, expectedTimeSeconds: 15 },
};

// ── Stroop Task / Color Catch (Focus, age 8+) ────────────────────────────
export interface StroopConfig {
  optionCount: number;       // how many colour buttons to choose from
  expectedTimeSeconds: number;
}

export const STROOP_CONFIG: Record<Difficulty, StroopConfig> = {
  easy:   { optionCount: 4, expectedTimeSeconds: 4 },
  medium: { optionCount: 5, expectedTimeSeconds: 3.5 },
  hard:   { optionCount: 6, expectedTimeSeconds: 3 },
};

// ── Color Sequence / Simon Says (Memory, age 5+) ─────────────────────────
export interface ColorSequenceConfig {
  sequenceLength: number;    // how many colors flash in order
  flashDurationMs: number;   // how long each color lights up
  gapMs: number;             // pause between flashes
  expectedTimeSeconds: number;
}

export const COLOR_SEQUENCE_CONFIG: Record<Difficulty, ColorSequenceConfig> = {
  easy:   { sequenceLength: 3, flashDurationMs: 700, gapMs: 350, expectedTimeSeconds: 6 },
  medium: { sequenceLength: 4, flashDurationMs: 600, gapMs: 300, expectedTimeSeconds: 8 },
  hard:   { sequenceLength: 5, flashDurationMs: 500, gapMs: 250, expectedTimeSeconds: 10 },
};

// ── Tap-Back / Corsi Blocks (Memory, age 7+) ─────────────────────────────
// Combines Pattern Recall's spatial position memory with Color Sequence's
// order memory. Cells light up one-at-a-time on a grid; reproduce the order.
export interface TapBackConfig {
  gridSize: number;          // N×N grid (3, 4, or 5)
  sequenceLength: number;    // how many cells flash in the sequence
  flashDurationMs: number;
  gapMs: number;
  expectedTimeSeconds: number;
}

export const TAP_BACK_CONFIG: Record<Difficulty, TapBackConfig> = {
  easy:   { gridSize: 3, sequenceLength: 3, flashDurationMs: 700, gapMs: 350, expectedTimeSeconds: 7 },
  medium: { gridSize: 4, sequenceLength: 4, flashDurationMs: 600, gapMs: 300, expectedTimeSeconds: 10 },
  hard:   { gridSize: 5, sequenceLength: 5, flashDurationMs: 500, gapMs: 250, expectedTimeSeconds: 13 },
};

// ── Odd One Out (Thinking, age 5+) ───────────────────────────────────────
export interface OddOneOutConfig {
  categoryDistance: "far" | "near" | "very-near";
  optionCount: number;
  expectedTimeSeconds: number;
}

export const ODD_ONE_OUT_CONFIG: Record<Difficulty, OddOneOutConfig> = {
  easy:   { categoryDistance: "far",       optionCount: 4, expectedTimeSeconds: 7 },
  medium: { categoryDistance: "near",      optionCount: 4, expectedTimeSeconds: 9 },
  hard:   { categoryDistance: "very-near", optionCount: 4, expectedTimeSeconds: 12 },
};

// ── Analogies (Thinking, age 9+) ─────────────────────────────────────────
export interface AnalogiesConfig {
  bank: "easy" | "medium" | "hard"; // which subset of the analogies bank to draw from
  optionCount: number;
  expectedTimeSeconds: number;
}

export const ANALOGIES_CONFIG: Record<Difficulty, AnalogiesConfig> = {
  easy:   { bank: "easy",   optionCount: 3, expectedTimeSeconds: 10 },
  medium: { bank: "medium", optionCount: 4, expectedTimeSeconds: 12 },
  hard:   { bank: "hard",   optionCount: 4, expectedTimeSeconds: 15 },
};

// ── Whack-a-Target (Focus, age 8+) ───────────────────────────────────────
export interface WhackConfig {
  gridSize: number;
  durationMs: number;             // round length
  spawnIntervalMs: number;        // how often a new item appears
  itemLifetimeMs: number;         // how long an item stays before disappearing
  distractorCount: number;        // how many non-target icon types
  expectedTimeSeconds: number;    // for the time-score component
}

export const WHACK_CONFIG: Record<Difficulty, WhackConfig> = {
  easy:   { gridSize: 3, durationMs: 12000, spawnIntervalMs: 1400, itemLifetimeMs: 1600, distractorCount: 1, expectedTimeSeconds: 12 },
  medium: { gridSize: 4, durationMs: 14000, spawnIntervalMs: 1100, itemLifetimeMs: 1300, distractorCount: 2, expectedTimeSeconds: 14 },
  hard:   { gridSize: 4, durationMs: 16000, spawnIntervalMs: 850,  itemLifetimeMs: 1000, distractorCount: 3, expectedTimeSeconds: 16 },
};

// ── Mini Sudoku 4×4 (Thinking, age 8+) ───────────────────────────────────
export interface MiniSudokuConfig {
  cellsToFill: number;            // how many empty cells in the puzzle
  expectedTimeSeconds: number;
}

export const MINI_SUDOKU_CONFIG: Record<Difficulty, MiniSudokuConfig> = {
  easy:   { cellsToFill: 4,  expectedTimeSeconds: 30 },
  medium: { cellsToFill: 7,  expectedTimeSeconds: 60 },
  hard:   { cellsToFill: 10, expectedTimeSeconds: 90 },
};
