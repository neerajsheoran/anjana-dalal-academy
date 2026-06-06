'use client';

import { useState } from 'react';

interface Props {
  classId: string;
  subject: string;
  chapterId: string;
  // Stable identifier — survives slug changes when content gets updated.
  chapterKey?: string;
  chapterTitle: string;
  initialCompleted: boolean;
  completedBy: string | null; // "quiz" | "manual" | null
}

export default function MarkCompleteButton({
  classId,
  subject,
  chapterId,
  chapterKey,
  chapterTitle,
  initialCompleted,
  completedBy,
}: Props) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [by, setBy] = useState(completedBy);
  const [loading, setLoading] = useState(false);

  // If completed via quiz, show the quiz-passed badge (not toggleable)
  if (completed && by === 'quiz') {
    return (
      <span className="inline-flex items-center gap-1.5 bg-white text-green-700 font-semibold px-3 py-1.5 rounded-lg text-sm">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Quiz Passed
      </span>
    );
  }

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/progress/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId,
          subject,
          chapterId,
          chapterKey,
          chapterTitle,
          completed: !completed,
        }),
      });
      if (res.ok) {
        setCompleted(!completed);
        setBy(!completed ? 'manual' : null);
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  };

  if (completed && by === 'manual') {
    return (
      <button
        onClick={handleToggle}
        disabled={loading}
        className="inline-flex items-center gap-1.5 bg-white text-blue-700 font-semibold px-3 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition-colors disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        {loading ? 'Updating...' : 'Marked Complete'}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="inline-flex items-center gap-1.5 bg-white text-gray-700 font-medium px-3 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition-colors disabled:opacity-50"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {loading ? 'Updating...' : 'Mark Complete'}
    </button>
  );
}
