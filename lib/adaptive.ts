// Adaptive difficulty engine.
// Looks at the child's most recent attempts for a given activity, and
// decides whether to bump them up, down, or keep them at the same level.
//
// Rules (per session = 3 rounds = 3 attempts):
//   - All 3 correct AND average score > 80 → level up
//   - 2 of 3 wrong OR average score < 50  → level down
//   - Otherwise                           → stay
//
// Falls back to the age-default difficulty when there's not enough history.

import { adminDb } from "./firebase-admin";
import {
  type Difficulty,
  getDefaultDifficultyForAge,
} from "./difficulty";

const ORDERED: Difficulty[] = ["easy", "medium", "hard"];

function bumpUp(d: Difficulty): Difficulty {
  const i = ORDERED.indexOf(d);
  return ORDERED[Math.min(i + 1, ORDERED.length - 1)];
}

function bumpDown(d: Difficulty): Difficulty {
  const i = ORDERED.indexOf(d);
  return ORDERED[Math.max(i - 1, 0)];
}

export type AdaptiveSource =
  | "age-default"   // no history, used age mapping
  | "stable"        // history exists, kept current level
  | "leveled-up"
  | "leveled-down";

export interface AdaptiveResult {
  difficulty: Difficulty;
  source: AdaptiveSource;
  previousLevel?: Difficulty; // set when leveled-up/down
}

interface AttemptDoc {
  activityKey?: string;
  difficultyLevel?: string;
  isCorrect?: boolean;
  scores?: { finalActivityScore?: number };
}

export async function getAdaptiveDifficulty(
  parentUid: string,
  childId: string,
  activityKey: string,
  age: number,
): Promise<AdaptiveResult> {
  const baseline = getDefaultDifficultyForAge(age);

  try {
    const snap = await adminDb
      .collection("users")
      .doc(parentUid)
      .collection("children")
      .doc(childId)
      .collection("attempts")
      .where("activityKey", "==", activityKey)
      .orderBy("createdAt", "desc")
      .limit(3)
      .get();

    if (snap.empty) {
      return { difficulty: baseline, source: "age-default" };
    }

    const recent = snap.docs.map((d) => d.data() as AttemptDoc);

    // Use the most-recent attempt's difficulty as the current level
    const currentLevelStr = recent[0].difficultyLevel ?? baseline;
    const currentLevel = (ORDERED as readonly string[]).includes(currentLevelStr)
      ? (currentLevelStr as Difficulty)
      : baseline;

    // Need 3 attempts at the same level to make a confident adjustment.
    const allSameLevel = recent.every(
      (a) => a.difficultyLevel === currentLevel,
    );
    if (recent.length < 3 || !allSameLevel) {
      return { difficulty: currentLevel, source: "stable" };
    }

    const correctCount = recent.filter((a) => a.isCorrect === true).length;
    const wrongCount = recent.length - correctCount;
    const scores = recent.map(
      (a) => a.scores?.finalActivityScore ?? (a.isCorrect ? 100 : 0),
    );
    const avg = scores.reduce((s, x) => s + x, 0) / scores.length;

    // Level up
    if (correctCount === recent.length && avg > 80) {
      const next = bumpUp(currentLevel);
      if (next !== currentLevel) {
        return {
          difficulty: next,
          source: "leveled-up",
          previousLevel: currentLevel,
        };
      }
      return { difficulty: currentLevel, source: "stable" };
    }

    // Level down
    if (wrongCount >= 2 || avg < 50) {
      const next = bumpDown(currentLevel);
      if (next !== currentLevel) {
        return {
          difficulty: next,
          source: "leveled-down",
          previousLevel: currentLevel,
        };
      }
      return { difficulty: currentLevel, source: "stable" };
    }

    return { difficulty: currentLevel, source: "stable" };
  } catch (err) {
    // The most common failure here is a missing composite Firestore index
    // (Firestore code 9, FAILED_PRECONDITION). It's a one-time setup: click
    // the "create index" link in the Firebase console message and wait ~2
    // min. Until then the engine falls back to the age-default difficulty
    // — activities still work, they just don't adapt yet.
    //
    // We log this case at warn-level so it doesn't trigger the Next.js dev
    // error overlay on every page load. Any *other* failure (transient
    // network, auth, etc.) still goes to console.error so it's visible.
    const code = (err as { code?: number | string } | null)?.code;
    const message = err instanceof Error ? err.message : String(err);
    const isMissingIndex =
      code === 9 ||
      code === "failed-precondition" ||
      message.includes("FAILED_PRECONDITION") ||
      message.includes("requires an index");
    if (isMissingIndex) {
      console.warn(
        "[adaptive] missing Firestore composite index — falling back to age default. Create the index from the link in the Firebase console error to enable adaptive difficulty.",
      );
    } else {
      console.error("[adaptive] failed, falling back to age default:", err);
    }
    return { difficulty: baseline, source: "age-default" };
  }
}
