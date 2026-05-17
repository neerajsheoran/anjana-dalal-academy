// Central TypeScript interfaces for the entire platform.
// Adding a new feature? Define its shape here first.

export type ClassId =
  | "class-1"
  | "class-2"
  | "class-3"
  | "class-4"
  | "class-5"
  | "class-6"
  | "class-7"
  | "class-8"
  | "class-9"
  | "class-10";

export type SubjectId = "maths" | "science" | "social-science";

export type DifficultyLevel = "easy" | "medium" | "hard";

// Metadata stored at the top of every content file
export interface ChapterMeta {
  classId: ClassId;
  subject: SubjectId;
  chapterId: string;       // e.g. "chapter-1-food-where-does-it-come-from"
  title: string;           // e.g. "Food: Where Does It Come From?"
  description: string;     // Short summary shown in chapter cards
  order: number;           // Chapter number for sorting
  questionCount?: number;  // Total questions in worksheet.json
}

// A single question
export interface Question {
  id: string;
  type: "mcq" | "short" | "fill" | "long";
  question: string;
  options?: string[];       // Only for MCQ
  answer: string;
  explanation: string;
}

// Questions grouped by difficulty within a topic
export interface TopicWorksheet {
  topic: string;           // e.g. "What is Science?"
  easy: Question[];
  medium: Question[];
  hard: Question[];
}

// Worksheet JSON structure (matches worksheet.json files)
// Top-level array of topics, each with its own easy/medium/hard questions
export interface WorksheetData {
  topics: TopicWorksheet[];
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
  color: "blue" | "green" | "amber"; // used for card color coding
}

// Subscription & Payment types
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'none';
export type ContentAccessLevel = 'anonymous' | 'trial' | 'subscribed' | 'expired' | 'admin';

export interface PlatformConfig {
  trialDays: number;
  yearlyPriceINR: number;
  commissionPercent: number;
  referralDiscountPercent: number;
  razorpayEnabled: boolean;
  contentAuthorPermissions?: ContentAuthorPermissions;
}

export interface ContentAuthorPermissions {
  viewUsers: boolean;
  manageUsers: boolean;
  viewSystemFlows: boolean;
  viewConfiguration: boolean;
  viewAdvisors: boolean;
}

// ── Brain training: child profiles ─────────────────────────────────────
// Per cognilift-privacy-consent.md: parent-owned account model.
// Kids 5–15 never have their own Firebase Auth account.

export type AgeGroup =
  | "foundation"     // 5–6: simplest activities
  | "early-builder"  // 7–8: pattern recognition starts
  | "skill-builder"  // 9–12: logical reasoning
  | "advanced-thinker"; // 13–15: decision making, multi-step

export interface ChildProfile {
  id: string;            // Firestore doc ID
  name: string;          // First name only — no last name (data minimisation)
  age: number;           // 5–15
  ageGroup: AgeGroup;    // Derived from age, stored for fast filtering
  classId?: ClassId;     // Optional CBSE class — used to route academic content
  consentGiven: boolean; // Required true on creation per DPDP
  consentAt: Date | null;
  createdAt: Date | null;
}
