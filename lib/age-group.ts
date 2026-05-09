// Age group derivation for child profiles.
// Coarse buckets for messaging/UX. Activity-level filtering uses minAge/maxAge directly.

import type { AgeGroup } from "./types";

export function deriveAgeGroup(age: number): AgeGroup {
  if (age <= 6) return "foundation";
  if (age <= 8) return "early-builder";
  if (age <= 12) return "skill-builder";
  return "advanced-thinker";
}

export const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  foundation: "Foundation (5–6)",
  "early-builder": "Early Builder (7–8)",
  "skill-builder": "Skill Builder (9–12)",
  "advanced-thinker": "Advanced Thinker (13–15)",
};

export function isValidAge(age: number): boolean {
  return Number.isInteger(age) && age >= 5 && age <= 15;
}
