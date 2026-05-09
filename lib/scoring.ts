// Activity score calculation per cognilift-mechanics.md §1.
// Activity Score = Accuracy×0.50 + Time×0.20 + Confidence×0.15 + Reflection×0.15

export type ConfidenceLevel = "low" | "medium" | "high";
export type ReflectionType =
  | "understood"
  | "strategy"
  | "looked-carefully"
  | "compared"
  | "repeated"
  | "mistake"
  | "distracted"
  | "guessed";

export interface ScoreInput {
  isCorrect: boolean;
  accuracyPercent?: number;       // 0–100; defaults to 100 if correct, 0 if wrong
  timeTakenSeconds: number;
  expectedTimeSeconds: number;
  confidence: ConfidenceLevel;
  reflection: ReflectionType;
}

export interface ScoreBreakdown {
  accuracyScore: number;            // 0–100
  timeScore: number;                // 0–100
  confidenceAlignmentScore: number; // 0–100
  reflectionScore: number;          // 0–100
  finalActivityScore: number;       // 0–100
}

// ── Reflection score table (cognilift-mechanics.md §1) ──────────────────
const REFLECTION_SCORES: Record<ReflectionType, number> = {
  strategy: 100,
  understood: 100,
  "looked-carefully": 90,
  compared: 90,
  repeated: 90,
  mistake: 70,
  distracted: 50,
  guessed: 30,
};

// ── Confidence alignment matrix (cognilift-mechanics.md §1) ─────────────
function confidenceAlignment(
  isCorrect: boolean,
  confidence: ConfidenceLevel,
): number {
  if (isCorrect) {
    if (confidence === "high") return 100;
    if (confidence === "medium") return 80;
    return 60;
  } else {
    // wrong
    if (confidence === "low") return 80;
    if (confidence === "medium") return 50;
    return 20;
  }
}

export function computeScore(input: ScoreInput): ScoreBreakdown {
  // 1. Accuracy
  const accuracyScore =
    typeof input.accuracyPercent === "number"
      ? input.accuracyPercent
      : input.isCorrect
      ? 100
      : 0;

  // 2. Time — capped at 100 (rushing past expected time is fine, slower than
  //    expected reduces score). Floor at 0 in case actualTime is 0.
  const timeScore =
    input.timeTakenSeconds > 0
      ? Math.min(input.expectedTimeSeconds / input.timeTakenSeconds, 1) * 100
      : 0;

  // 3. Confidence alignment
  const confidenceAlignmentScore = confidenceAlignment(
    input.isCorrect,
    input.confidence,
  );

  // 4. Reflection
  const reflectionScore = REFLECTION_SCORES[input.reflection] ?? 50;

  // Weighted sum
  const finalActivityScore =
    accuracyScore * 0.5 +
    timeScore * 0.2 +
    confidenceAlignmentScore * 0.15 +
    reflectionScore * 0.15;

  return {
    accuracyScore: Math.round(accuracyScore * 100) / 100,
    timeScore: Math.round(timeScore * 100) / 100,
    confidenceAlignmentScore,
    reflectionScore,
    finalActivityScore: Math.round(finalActivityScore * 100) / 100,
  };
}
