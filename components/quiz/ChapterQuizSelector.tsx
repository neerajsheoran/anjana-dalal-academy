'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Chapter {
  chapterId: string;
  title: string;
  order: number;
}

interface Props {
  classId: string;
  subject: string;
  chapters: Chapter[];
}

export default function ChapterQuizSelector({ classId, subject, chapters }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showSelector, setShowSelector] = useState(false);

  function toggle(chapterId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(chapters.map((c) => c.chapterId)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  const chaptersParam = Array.from(selected).join(',');
  const quizHref = `/quiz?class=${classId}&subject=${subject}&chapters=${chaptersParam}`;

  // Full subject quiz (all chapters)
  const allChaptersParam = chapters.map((c) => c.chapterId).join(',');
  const fullSubjectHref = `/quiz?class=${classId}&subject=${subject}&chapters=${allChaptersParam}`;

  return (
    <div className="mb-8">
      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Link
          href={fullSubjectHref}
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          🧠 Quiz — Full Subject
        </Link>
        <button
          onClick={() => setShowSelector((v) => !v)}
          className="inline-flex items-center gap-2 border border-purple-300 text-purple-700 hover:bg-purple-50 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors bg-white"
        >
          {showSelector ? 'Hide Chapter Selector ↑' : 'Select Chapters for Quiz ↓'}
        </button>
      </div>

      {/* Chapter selector panel */}
      {showSelector && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-purple-800">
              Select chapters ({selected.size} selected)
            </p>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-xs text-purple-600 hover:text-purple-800 underline"
              >
                Select All
              </button>
              <span className="text-purple-300">|</span>
              <button
                onClick={clearAll}
                className="text-xs text-purple-600 hover:text-purple-800 underline"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 mb-4">
            {chapters.map((chapter) => (
              <label
                key={chapter.chapterId}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={selected.has(chapter.chapterId)}
                  onChange={() => toggle(chapter.chapterId)}
                  className="w-4 h-4 accent-purple-600"
                />
                <span className="text-sm text-gray-700 group-hover:text-purple-800">
                  <span className="text-gray-400 mr-1">
                    {String(chapter.order).padStart(2, '0')}.
                  </span>
                  {chapter.title}
                </span>
              </label>
            ))}
          </div>

          {selected.size > 0 ? (
            <Link
              href={quizHref}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              Start Quiz — {selected.size} chapter{selected.size > 1 ? 's' : ''} →
            </Link>
          ) : (
            <p className="text-xs text-purple-400">Select at least one chapter to start.</p>
          )}
        </div>
      )}
    </div>
  );
}
