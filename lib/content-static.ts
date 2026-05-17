// Static content data — safe for client components (no fs/path imports).
// For server-side auto-discovery, use lib/content.ts instead.

import { ClassInfo, SubjectInfo } from "./types";

export const CLASSES: ClassInfo[] = [
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

export const SUBJECTS: SubjectInfo[] = [
  { id: "maths", label: "Mathematics", icon: "📐", color: "blue" },
  { id: "science", label: "Science", icon: "🔬", color: "green" },
  { id: "social-science", label: "Social Science", icon: "🌍", color: "amber" },
];
