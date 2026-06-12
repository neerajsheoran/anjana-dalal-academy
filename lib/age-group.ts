// Age group derivation for child profiles.
// Coarse buckets for messaging/UX. Activity-level filtering uses minAge/maxAge directly.

import type { AgeGroup, ClassId } from "./types";

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

// School class typically starts at age 6 (Class 1). Used historically
// as a default suggestion in the add-child form; the form now collects
// class directly, so this remains as a helper for other callers.
export function suggestClassFromAge(age: number): ClassId | "" {
  const cls = age - 5;
  if (cls < 1 || cls > 10) return "";
  return `class-${cls}` as ClassId;
}

export const CLASS_OPTIONS: { id: ClassId; label: string }[] = [
  { id: "class-1", label: "Class 1" },
  { id: "class-2", label: "Class 2" },
  { id: "class-3", label: "Class 3" },
  { id: "class-4", label: "Class 4" },
  { id: "class-5", label: "Class 5" },
  { id: "class-6", label: "Class 6" },
  { id: "class-7", label: "Class 7" },
  { id: "class-8", label: "Class 8" },
  { id: "class-9", label: "Class 9" },
  { id: "class-10", label: "Class 10" },
];

export function isValidClassId(value: unknown): value is ClassId {
  return CLASS_OPTIONS.some((o) => o.id === value);
}
