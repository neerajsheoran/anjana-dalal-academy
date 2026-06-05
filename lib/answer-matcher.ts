// Layered fill-in-the-blank / short-answer matcher.
//
// Strict string equality kills user experience: "Obtuse angle" gets marked
// wrong because the canonical answer is just "obtuse". This module accepts
// an answer if any of these layers matches, in order:
//
//   1. exact            — after normalisation (lowercase, strip punctuation,
//                          collapse whitespace), the two strings are equal.
//   2. context-stripped — words that already appear in the question get
//                          removed from the user's answer first. So if the
//                          question says "An ___ angle is wider than 90°"
//                          and the kid types "obtuse angle", "angle" gets
//                          stripped because it's already in the question.
//   3. alternative      — content authors can list per-question accepted
//                          alternatives (e.g. ["full", "complete", "whole"]).
//   4. fuzzy            — single-character typo tolerance via Levenshtein
//                          distance ≤ 1 for answers longer than 3 characters.
//                          Catches "obtsue" → "obtuse".
//
// The returned `layer` lets callers log *why* an answer matched, which is
// useful for telemetry: if lots of answers are passing on the "fuzzy" layer,
// the canonical answers might be ambiguous.

export type MatchLayer =
  | "exact"
  | "context-stripped"
  | "alternative"
  | "fuzzy"
  | "no-match";

export interface MatchResult {
  isCorrect: boolean;
  layer: MatchLayer;
}

export interface MatchOptions {
  // Per-question accepted alternative answers, set by content authors.
  alternatives?: string[];
  // The full question text. Used to derive context words to strip from the
  // user's answer (so "Obtuse angle" matches "obtuse" when "angle" is in the
  // question's blank context). Omit to skip layer 2.
  questionContext?: string;
}

// Common English stop words that should not be treated as context for
// stripping purposes — they're too generic and would over-aggressively
// erase parts of the user's answer.
const STOP_WORDS = new Set([
  "a", "an", "the",
  "is", "are", "was", "were", "be", "been", "being",
  "of", "in", "on", "at", "to", "for", "with", "by", "from",
  "and", "or", "but", "than", "so",
  "this", "that", "these", "those",
  "what", "which", "who", "whose", "when", "where", "why", "how",
  "do", "does", "did", "have", "has", "had",
]);

function normalise(s: string): string {
  // Lowercase, drop punctuation/symbols, collapse whitespace.
  return s
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function contextWordsFromQuestion(question: string): Set<string> {
  // Pull all words >= 2 chars from the question, skip stop words.
  return new Set(
    normalise(question)
      .split(" ")
      .filter((w) => w.length >= 2 && !STOP_WORDS.has(w)),
  );
}

function stripContextWords(userAnswer: string, context: Set<string>): string {
  // Strip both question-context words AND generic stop words (a, an, the,
  // ...). This handles cases like "a triangle" matching "triangle" even
  // when "a" isn't in the question — articles are noise either way.
  return normalise(userAnswer)
    .split(" ")
    .filter((w) => w.length > 0 && !context.has(w) && !STOP_WORDS.has(w))
    .join(" ")
    .trim();
}

// Damerau-Levenshtein edit distance — counts a single character transposition
// as one edit (e.g. "obtsue" → "obtuse" costs 1, not 2 as in plain
// Levenshtein). Transpositions are the most common keyboard typo, so this
// produces friendlier fuzzy matching without dramatically loosening the
// threshold. Includes an early-exit cap.
function editDistanceAtMost(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  if (a === b) return 0;

  // We need access to two prior rows for the transposition check, plus the
  // current row. Allocate all three.
  const n = a.length;
  const m = b.length;
  let prevPrev = new Array(m + 1).fill(0);
  let prev = new Array(m + 1);
  for (let j = 0; j <= m; j++) prev[j] = j;

  for (let i = 1; i <= n; i++) {
    const curr = new Array(m + 1);
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,        // deletion
        curr[j - 1] + 1,    // insertion
        prev[j - 1] + cost, // substitution
      );
      // Transposition: if previous chars swap to match
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        curr[j] = Math.min(curr[j], prevPrev[j - 2] + 1);
      }
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > max) return max + 1; // No row cell ≤ max ⇒ final answer > max
    prevPrev = prev;
    prev = curr;
  }
  return prev[m];
}

export function matchAnswer(
  userAnswer: string,
  expectedAnswer: string,
  options: MatchOptions = {},
): MatchResult {
  const user = normalise(userAnswer);
  const expected = normalise(expectedAnswer);

  // Blank answer is never correct, no need to escalate through layers.
  if (!user) return { isCorrect: false, layer: "no-match" };
  if (!expected) return { isCorrect: false, layer: "no-match" };

  // Layer 1: exact match after normalisation
  if (user === expected) {
    return { isCorrect: true, layer: "exact" };
  }

  // Layer 2: strip words present in the question
  if (options.questionContext) {
    const ctx = contextWordsFromQuestion(options.questionContext);
    // Avoid stripping if the expected answer itself shares those words —
    // we'd erase the answer along with the context. Compare the
    // expected against the SAME stripping operation; if both reduce
    // identically, accept the match.
    const userStripped = stripContextWords(userAnswer, ctx);
    const expectedStripped = stripContextWords(expectedAnswer, ctx);
    if (userStripped && userStripped === expectedStripped) {
      return { isCorrect: true, layer: "context-stripped" };
    }
    // Also handle the common case where the kid's answer reduces to the
    // canonical answer after stripping (e.g. kid "obtuse angle" with
    // context {angle} → "obtuse"; expected just "obtuse").
    if (userStripped && userStripped === expected) {
      return { isCorrect: true, layer: "context-stripped" };
    }
  }

  // Layer 3: per-question accepted alternatives
  if (options.alternatives) {
    for (const alt of options.alternatives) {
      if (normalise(alt) === user) {
        return { isCorrect: true, layer: "alternative" };
      }
    }
  }

  // Layer 4: fuzzy match for typos (1-character edit, words > 3 chars only).
  // Skip multi-word expected answers — fuzzy across phrases is too loose.
  if (
    expected.length > 3 &&
    user.length > 3 &&
    !expected.includes(" ") &&
    !user.includes(" ")
  ) {
    const dist = editDistanceAtMost(user, expected, 1);
    if (dist <= 1) {
      return { isCorrect: true, layer: "fuzzy" };
    }
  }

  return { isCorrect: false, layer: "no-match" };
}

// Convenience boolean wrapper for call sites that don't care about the layer.
export function isAnswerCorrect(
  userAnswer: string,
  expectedAnswer: string,
  options: MatchOptions = {},
): boolean {
  return matchAnswer(userAnswer, expectedAnswer, options).isCorrect;
}
