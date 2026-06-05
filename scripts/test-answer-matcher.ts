// Tests for lib/answer-matcher.ts.
//
// Run from project root: npx tsx scripts/test-answer-matcher.ts
//
// This script uses Node's built-in assert library — no test framework needed.
// Exit code 0 = all pass; non-zero = one or more failed.

import assert from "node:assert/strict";
import { matchAnswer } from "../lib/answer-matcher";

interface Case {
  name: string;
  user: string;
  expected: string;
  options?: {
    alternatives?: string[];
    questionContext?: string;
  };
  shouldMatch: boolean;
  shouldLayer?: string;
}

const CASES: Case[] = [
  // ── Layer 1: exact (with normalisation) ─────────────────────────────────
  { name: "identical strings match", user: "obtuse", expected: "obtuse", shouldMatch: true, shouldLayer: "exact" },
  { name: "case difference matches", user: "OBTUSE", expected: "obtuse", shouldMatch: true, shouldLayer: "exact" },
  { name: "leading/trailing spaces match", user: "  obtuse  ", expected: "obtuse", shouldMatch: true, shouldLayer: "exact" },
  { name: "trailing punctuation matches", user: "obtuse.", expected: "obtuse", shouldMatch: true, shouldLayer: "exact" },
  { name: "internal punctuation normalised", user: "right-angle", expected: "right angle", shouldMatch: true, shouldLayer: "exact" },

  // ── Layer 2: context-stripped ───────────────────────────────────────────
  {
    name: 'kid types "Obtuse angle" when context is "_____ angle"',
    user: "Obtuse angle",
    expected: "obtuse",
    options: { questionContext: "An angle wider than a right angle but narrower than a straight angle is called an _____ angle." },
    shouldMatch: true,
    shouldLayer: "context-stripped",
  },
  {
    name: 'kid types "Full turn" when context is "1 _____ turn"',
    user: "Full turn",
    expected: "full",
    options: { questionContext: "2 half turns = 1 ______ turn." },
    shouldMatch: true,
    shouldLayer: "context-stripped",
  },
  {
    name: "context strip without context option does not trigger",
    user: "Obtuse angle",
    expected: "obtuse",
    shouldMatch: false,
  },

  // ── Layer 3: alternatives ───────────────────────────────────────────────
  {
    name: "accepts content-author alternative",
    user: "complete",
    expected: "full",
    options: { alternatives: ["complete", "whole"] },
    shouldMatch: true,
    shouldLayer: "alternative",
  },
  {
    name: "alternative is also normalised",
    user: "  Complete!  ",
    expected: "full",
    options: { alternatives: ["complete"] },
    shouldMatch: true,
    shouldLayer: "alternative",
  },

  // ── Layer 4: fuzzy (1-char typo) ────────────────────────────────────────
  { name: "single typo accepted (obtsue → obtuse)", user: "obtsue", expected: "obtuse", shouldMatch: true, shouldLayer: "fuzzy" },
  { name: "single missing letter accepted (obtuse → obtus)", user: "obtus", expected: "obtuse", shouldMatch: true, shouldLayer: "fuzzy" },
  { name: "two-char typo NOT accepted (loose match would be dangerous)", user: "obtaes", expected: "obtuse", shouldMatch: false },
  { name: "fuzzy never matches similar but wrong answer (obtuse ≠ acute)", user: "acute", expected: "obtuse", shouldMatch: false },
  { name: "fuzzy skipped for short answers (3 chars)", user: "cat", expected: "bat", shouldMatch: false },
  { name: "fuzzy skipped for multi-word expected", user: "right anqle", expected: "right angle", shouldMatch: false },

  // ── Edge cases ──────────────────────────────────────────────────────────
  { name: "empty user answer never matches", user: "", expected: "obtuse", shouldMatch: false },
  { name: "whitespace-only user answer never matches", user: "   ", expected: "obtuse", shouldMatch: false },
  { name: "exact wrong answer fails", user: "acute", expected: "obtuse", shouldMatch: false },
  {
    name: "answer that's a substring of question does not get fully stripped",
    user: "right angle",
    expected: "right angle",
    options: { questionContext: "Define a right angle." },
    shouldMatch: true, // exact still wins
    shouldLayer: "exact",
  },

  // ── Real-world hot spots ─────────────────────────────────────────────────
  { name: "color vs colour both accepted via alternatives", user: "colour", expected: "color", options: { alternatives: ["colour"] }, shouldMatch: true, shouldLayer: "alternative" },
  { name: "metres vs meters both accepted via alternatives", user: "meters", expected: "metres", options: { alternatives: ["meters"] }, shouldMatch: true, shouldLayer: "alternative" },
  {
    name: 'kid types "a triangle" when answer is "triangle"',
    user: "a triangle",
    expected: "triangle",
    options: { questionContext: "What shape has three sides? A _____" },
    shouldMatch: true,
    shouldLayer: "context-stripped",
  },
];

let passed = 0;
let failed = 0;
const failures: string[] = [];

for (const c of CASES) {
  try {
    const result = matchAnswer(c.user, c.expected, c.options);
    assert.equal(
      result.isCorrect,
      c.shouldMatch,
      `expected isCorrect=${c.shouldMatch} but got ${result.isCorrect}; layer was "${result.layer}"`,
    );
    if (c.shouldLayer && c.shouldMatch) {
      assert.equal(
        result.layer,
        c.shouldLayer,
        `expected layer "${c.shouldLayer}" but got "${result.layer}"`,
      );
    }
    passed++;
  } catch (err) {
    failed++;
    const msg = err instanceof Error ? err.message : String(err);
    failures.push(`  ✗ ${c.name}\n    ${msg}`);
  }
}

console.log(`\nanswer-matcher tests: ${passed} passed, ${failed} failed (of ${CASES.length})`);
if (failures.length > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(f);
  process.exit(1);
}
process.exit(0);
