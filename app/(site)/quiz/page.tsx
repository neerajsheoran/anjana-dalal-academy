import { getChapter, getClassLabel, getSubjectLabel } from '@/lib/content';
import { loadChapterQuestions } from '@/lib/quiz-loader';
import { QuizQuestion } from '@/lib/quiz';
import { ClassId, SubjectId } from '@/lib/types';
import QuizController from '@/components/quiz/QuizController';
import Link from 'next/link';

export default async function QuizPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; subject?: string; chapters?: string }>;
}) {
  const params = await searchParams;
  const classId = (params.class ?? '') as ClassId;
  const subject = (params.subject ?? '') as SubjectId;
  const chapterIds = params.chapters ? params.chapters.split(',').filter(Boolean) : [];

  const classLabel = getClassLabel(classId);
  const subjectLabel = getSubjectLabel(subject);

  // Load all questions server-side (uses fs — cannot run on client)
  const allQuestions: QuizQuestion[] = chapterIds.flatMap((chapterId) => {
    const meta = getChapter(chapterId);
    return loadChapterQuestions(classId, subject, chapterId, meta?.title ?? chapterId);
  });

  const chapterTitles = chapterIds.map((id) => getChapter(id)?.title ?? id);

  if (!classId || !subject || chapterIds.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No chapters selected for the quiz.</p>
          <Link href="/" className="text-blue-600 hover:underline">← Back to Home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <QuizController
        classLabel={classLabel}
        subjectLabel={subjectLabel}
        chapterTitles={chapterTitles}
        allQuestions={allQuestions}
        classId={classId}
        subject={subject}
        chapterIds={chapterIds}
      />
    </main>
  );
}
