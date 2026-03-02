// Pure quiz utilities — no Node.js imports, safe to use in client components

export type QuizDifficulty = 'easy' | 'hard' | 'mixed';
export type QuizMode = 'online' | 'print';

// Question enriched with chapter info — chapterId enables future per-chapter weighting
export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'short' | 'fill' | 'long';
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  chapterId: string;
  chapterTitle: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

/** Filter by difficulty level and optionally restrict to MCQ only */
export function filterQuestions(
  questions: QuizQuestion[],
  difficulty: QuizDifficulty,
  mcqOnly: boolean,
): QuizQuestion[] {
  let filtered = questions;
  if (difficulty === 'easy') {
    filtered = filtered.filter((q) => q.difficulty === 'easy');
  } else if (difficulty === 'hard') {
    filtered = filtered.filter((q) => q.difficulty === 'hard');
  }
  // 'mixed' keeps easy + medium + hard
  if (mcqOnly) {
    filtered = filtered.filter((q) => q.type === 'mcq');
  }
  return filtered;
}

/** Fisher-Yates shuffle — pure function, safe on client */
export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Randomly sample count questions from the pool */
export function sampleQuestions(questions: QuizQuestion[], count: number): QuizQuestion[] {
  return shuffleArray(questions).slice(0, Math.min(count, questions.length));
}
