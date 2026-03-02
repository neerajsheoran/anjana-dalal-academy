import fs from 'fs';
import path from 'path';
import { WorksheetData } from './types';
import { QuizQuestion } from './quiz';

/** Load all questions from a chapter's worksheet.json — server-side only (uses fs) */
export function loadChapterQuestions(
  classId: string,
  subject: string,
  chapterId: string,
  chapterTitle: string,
): QuizQuestion[] {
  const worksheetPath = path.join(
    process.cwd(),
    'content',
    classId,
    subject,
    chapterId,
    'worksheet.json',
  );
  if (!fs.existsSync(worksheetPath)) return [];
  try {
    const data: WorksheetData = JSON.parse(fs.readFileSync(worksheetPath, 'utf8'));
    const questions: QuizQuestion[] = [];
    for (const topic of data.topics) {
      const levels: Array<['easy' | 'medium' | 'hard', typeof topic.easy]> = [
        ['easy', topic.easy ?? []],
        ['medium', topic.medium ?? []],
        ['hard', topic.hard ?? []],
      ];
      for (const [level, qs] of levels) {
        for (const q of qs) {
          questions.push({
            id: q.id,
            type: (q.type ?? 'mcq') as QuizQuestion['type'],
            question: q.question,
            options: q.options ?? [],
            answer: q.answer,
            explanation: q.explanation,
            chapterId,
            chapterTitle,
            difficulty: level,
          });
        }
      }
    }
    return questions;
  } catch {
    return [];
  }
}