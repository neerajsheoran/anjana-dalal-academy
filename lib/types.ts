// Central TypeScript interfaces for the entire platform.
// Adding a new feature? Define its shape here first.

export type ClassId =
  | "class-3"
  | "class-4"
  | "class-5"
  | "class-6"
  | "class-7";

export type SubjectId = "maths" | "science";

export type DifficultyLevel = "easy" | "medium" | "hard";

// Metadata stored at the top of every content file
export interface ChapterMeta {
  classId: ClassId;
  subject: SubjectId;
  chapterId: string;       // e.g. "chapter-1-food-where-does-it-come-from"
  title: string;           // e.g. "Food: Where Does It Come From?"
  description: string;     // Short summary shown in chapter cards
  order: number;           // Chapter number for sorting
}

// A single question
export interface Question {
  id: string;
  type: "mcq" | "short" | "fill";
  question: string;
  options?: string[];       // Only for MCQ
  answer: string;
  explanation: string;
}

// Worksheet JSON structure (matches worksheet.json files)
export interface WorksheetData {
  easy: Question[];
  medium: Question[];
  hard: Question[];
}

// Navigation helpers
export interface ClassInfo {
  id: ClassId;
  label: string;           // "Class 6"
}

export interface SubjectInfo {
  id: SubjectId;
  label: string;           // "Mathematics"
  icon: string;            // emoji
  color: "blue" | "green"; // used for card color coding
}
