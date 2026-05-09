// Rule-based insight generation — Phase 2 MVP, ~4 rules only.
// Per cognilift-pdf-mismatches.md resolved mismatch #6: ship MINIMAL insights
// for Phase 2; the full engine waits for usage data.

import type { ConfidenceLevel } from "./scoring";

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
