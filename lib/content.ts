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
  // Class 6 Science — 2024 NCERT "Curiosity" textbook
  {
    classId: "class-6",
    subject: "science",
    chapterId: "chapter-1-the-wonderful-world-of-science",
    title: "The Wonderful World of Science",
    description: "Discover what science is, how scientists think, and why curiosity matters.",
    order: 1,
  },
  {
    classId: "class-6",
    subject: "science",
    chapterId: "chapter-2-diversity-in-the-living-world",
    title: "Diversity in the Living World",
    description: "Explore the amazing variety of plants, animals, and other living things around us.",
    order: 2,
  },
  {
    classId: "class-6",
    subject: "science",
    chapterId: "chapter-3-mindful-eating-a-path-to-a-healthy-body",
    title: "Mindful Eating: A Path to a Healthy Body",
    description: "Learn about nutrients, balanced diet, and how food keeps us healthy.",
    order: 3,
  },
  {
    classId: "class-6",
    subject: "science",
    chapterId: "chapter-4-exploring-magnets",
    title: "Exploring Magnets",
    description: "Understand magnets, magnetic properties, and how they are used in daily life.",
    order: 4,
  },
  {
    classId: "class-6",
    subject: "science",
    chapterId: "chapter-5-measurement-of-length-and-motion",
    title: "Measurement of Length and Motion",
    description: "Learn how we measure length, distance, and different types of motion.",
    order: 5,
  },
  {
    classId: "class-6",
    subject: "science",
    chapterId: "chapter-6-materials-around-us",
    title: "Materials Around Us",
    description: "Explore different materials, their properties, and how we use them every day.",
    order: 6,
  },
  {
    classId: "class-6",
    subject: "science",
    chapterId: "chapter-7-temperature-and-its-measurement",
    title: "Temperature and its Measurement",
    description: "Understand what temperature is and how we measure it using thermometers.",
    order: 7,
  },
  {
    classId: "class-6",
    subject: "science",
    chapterId: "chapter-8-a-journey-through-states-of-water",
    title: "A Journey through States of Water",
    description: "Learn how water changes between solid, liquid, and gas forms.",
    order: 8,
  },
  {
    classId: "class-6",
    subject: "science",
    chapterId: "chapter-9-methods-of-separation-in-everyday-life",
    title: "Methods of Separation in Everyday Life",
    description: "Discover how mixtures are separated using sieving, filtering, evaporation and more.",
    order: 9,
  },
  {
    classId: "class-6",
    subject: "science",
    chapterId: "chapter-10-living-creatures-exploring-their-characteristics",
    title: "Living Creatures: Exploring their Characteristics",
    description: "Find out what makes something alive and the characteristics all living things share.",
    order: 10,
  },
  {
    classId: "class-6",
    subject: "science",
    chapterId: "chapter-11-natures-treasures",
    title: "Nature's Treasures",
    description: "Understand natural resources, why they matter, and how we should protect them.",
    order: 11,
  },
  {
    classId: "class-6",
    subject: "science",
    chapterId: "chapter-12-beyond-earth",
    title: "Beyond Earth",
    description: "Explore the solar system, stars, planets, and the universe beyond our world.",
    order: 12,
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
