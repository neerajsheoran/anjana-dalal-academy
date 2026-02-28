// Content registry — single source of truth for all classes, subjects, and chapters.
// To add a new class or subject: update the arrays below. No other file needs to change.

import { ClassInfo, SubjectInfo, ClassId, SubjectId, ChapterMeta } from "./types";

export const CLASSES: ClassInfo[] = [
  { id: "class-3", label: "Class 3" },
  { id: "class-4", label: "Class 4" },
  { id: "class-5", label: "Class 5" },
  { id: "class-6", label: "Class 6" },
  { id: "class-7", label: "Class 7" },
];

export const SUBJECTS: SubjectInfo[] = [
  { id: "maths", label: "Mathematics", icon: "📐", color: "blue" },
  { id: "science", label: "Science", icon: "🔬", color: "green" },
];

// Chapter registry — add chapter metadata here when you create a new chapter
// Content (MDX) lives in /content/[classId]/[subject]/[chapterId]/
export const CHAPTERS: ChapterMeta[] = [
  // Class 6 Science (demo content)
  {
    classId: "class-6",
    subject: "science",
    chapterId: "chapter-1-food-where-does-it-come-from",
    title: "Food: Where Does It Come From?",
    description: "Learn where our food comes from — plants, animals, and more.",
    order: 1,
  },
  {
    classId: "class-6",
    subject: "science",
    chapterId: "chapter-2-components-of-food",
    title: "Components of Food",
    description: "Understand nutrients, their sources, and why we need them.",
    order: 2,
  },
  // Class 6 Maths (demo content)
  {
    classId: "class-6",
    subject: "maths",
    chapterId: "chapter-1-knowing-our-numbers",
    title: "Knowing Our Numbers",
    description: "Large numbers, place value, and how we compare them.",
    order: 1,
  },
];

// Helper: get all chapters for a specific class + subject
export function getChapters(classId: ClassId, subject: SubjectId): ChapterMeta[] {
  return CHAPTERS
    .filter((c) => c.classId === classId && c.subject === subject)
    .sort((a, b) => a.order - b.order);
}

// Helper: get a single chapter by its ID
export function getChapter(chapterId: string): ChapterMeta | undefined {
  return CHAPTERS.find((c) => c.chapterId === chapterId);
}

// Helper: get class label from ID
export function getClassLabel(classId: ClassId): string {
  return CLASSES.find((c) => c.id === classId)?.label ?? classId;
}

// Helper: get subject label from ID
export function getSubjectLabel(subjectId: SubjectId): string {
  return SUBJECTS.find((s) => s.id === subjectId)?.label ?? subjectId;
}
