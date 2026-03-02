'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CHAPTERS } from '@/lib/content';

const CLASSES = [
  { id: 'class-3', label: 'Class 3' },
  { id: 'class-4', label: 'Class 4' },
  { id: 'class-5', label: 'Class 5' },
  { id: 'class-6', label: 'Class 6' },
  { id: 'class-7', label: 'Class 7' },
];

const SUBJECTS = [
  { id: 'science', label: 'Science', icon: '🔬' },
  { id: 'maths', label: 'Mathematics', icon: '📐' },
];

export default function QuizStartPage() {
  const [selectedClass, setSelectedClass] = useState('class-6');
  const [selectedSubject, setSelectedSubject] = useState('science');
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const router = useRouter();

  const availableChapters = useMemo(
    () =>
      CHAPTERS.filter(
        (c) => c.classId === selectedClass && c.subject === selectedSubject,
      ).sort((a, b) => a.order - b.order),
    [selectedClass, selectedSubject],
  );

  const handleClassChange = (cls: string) => {
    setSelectedClass(cls);
    setSelectedChapters([]);
  };

  const handleSubjectChange = (sub: string) => {
    setSelectedSubject(sub);
    setSelectedChapters([]);
  };

  const toggleChapter = (id: string) => {
    setSelectedChapters((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const handleStart = () => {
    if (selectedChapters.length === 0) return;
    router.push(
      `/quiz?class=${selectedClass}&subject=${selectedSubject}&chapters=${selectedChapters.join(',')}`,
    );
  };

  const allSelected = selectedChapters.length === availableChapters.length && availableChapters.length > 0;

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-600 to-violet-800 text-white py-12 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <Link href="/" className="inline-flex items-center gap-1 text-purple-200 hover:text-white text-sm mb-4 transition-colors">
            ← Back to Home
          </Link>
          <div className="w-16 h-16 bg-white/25 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
            🧠
          </div>
          <h1 className="text-3xl font-bold mb-2">Quiz &amp; Revision</h1>
          <p className="text-purple-100">Set up your quiz in 3 simple steps</p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Step 1 — Class */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-bold">1</span>
            Select your class
          </h2>
          <div className="flex flex-wrap gap-2.5">
            {CLASSES.map((cls) => (
              <button
                key={cls.id}
                onClick={() => handleClassChange(cls.id)}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm border transition-colors ${
                  selectedClass === cls.id
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-purple-400'
                }`}
              >
                {cls.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2 — Subject */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-bold">2</span>
            Select subject
          </h2>
          <div className="flex flex-wrap gap-2.5">
            {SUBJECTS.map((sub) => (
              <button
                key={sub.id}
                onClick={() => handleSubjectChange(sub.id)}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm border transition-colors ${
                  selectedSubject === sub.id
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-purple-400'
                }`}
              >
                {sub.icon} {sub.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3 — Chapters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <span className="w-7 h-7 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-bold">3</span>
              Select chapters
            </h2>
            {availableChapters.length > 0 && (
              <div className="flex gap-3 text-sm">
                <button
                  onClick={() => setSelectedChapters(availableChapters.map((c) => c.chapterId))}
                  className={`font-medium transition-colors ${allSelected ? 'text-gray-300' : 'text-purple-600 hover:text-purple-800'}`}
                  disabled={allSelected}
                >
                  Select All
                </button>
                <span className="text-gray-200">|</span>
                <button
                  onClick={() => setSelectedChapters([])}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {availableChapters.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">
              No chapters available for this class and subject yet. Try a different combination.
            </p>
          ) : (
            <div className="space-y-2">
              {availableChapters.map((ch) => (
                <label
                  key={ch.chapterId}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                    selectedChapters.includes(ch.chapterId)
                      ? 'bg-purple-50 border-purple-300'
                      : 'bg-gray-50 border-gray-100 hover:border-purple-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedChapters.includes(ch.chapterId)}
                    onChange={() => toggleChapter(ch.chapterId)}
                    className="mt-0.5 accent-purple-600"
                  />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{ch.title}</p>
                    {ch.description && (
                      <p className="text-gray-400 text-xs mt-0.5">{ch.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={selectedChapters.length === 0}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-colors ${
            selectedChapters.length > 0
              ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {selectedChapters.length === 0
            ? 'Select at least one chapter to start'
            : `Start Quiz — ${selectedChapters.length} chapter${selectedChapters.length > 1 ? 's' : ''} selected →`}
        </button>

      </div>
    </main>
  );
}
