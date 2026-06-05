// Class-based eligibility for the Train (brain training) section.
//
// Decision (cognilift-three-pillar-roadmap.md, 2026-06-06): Train caps
// at Class 8. Class 9–10 are in board-prep mode; parents want Learn
// time, not game time. Train surfaces are hidden from those kids and
// direct navigation to /brain redirects back to their homepage.
//
// Implementation note: we gate by the `classId` on the active child
// profile. If classId is unset (parents haven't told us which class),
// the kid still sees Train — we err on the side of including rather
// than blocking the experience.

export const TRAIN_MAX_CLASS = 8;

const CLASS_NUM_RE = /^class-(\d+)$/;

export function classNumber(classId?: string | null): number | null {
  if (!classId) return null;
  const m = CLASS_NUM_RE.exec(classId);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

export function isTrainEligible(classId?: string | null): boolean {
  const n = classNumber(classId);
  if (n === null) return true; // No class info ⇒ include
  return n <= TRAIN_MAX_CLASS;
}
