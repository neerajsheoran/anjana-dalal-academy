'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChapterMeta, ClassInfo, SubjectInfo } from '@/lib/types';
import { CLASSES, SUBJECTS } from '@/lib/content-static';

export default function QuizStartClient({ chapters }: { chapters: ChapterMeta[] }) {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const router = useRouter();

  const subjects = useMemo(
    () => selectedClass
      ? SUBJECTS.filter((s) =>
          chapters.some((c) => c.classId === selectedClass && c.subject === s.id)
        )
      : [],
    [selectedClass, chapters],
  );

  const availableChapters = useMemo(
    () => (selectedClass && selectedSubject)
      ? chapters
          .filter((c) => c.classId === selectedClass && c.subject === selectedSubject)
          .sort((a, b) => a.order - b.order)
      : [],
    [selectedClass, selectedSubject, chapters],
  );

  // Classes that actually have content
  const classesWithContent = useMemo(
    () => CLASSES.filter((cls) =>
      chapters.some((c) => c.classId === cls.id)
    ),
    [chapters],
  );

  const handleClassChange = (cls: string) => {
    setSelectedClass(cls);
    setSelectedChapters([]);
    const subs = SUBJECTS.filter((s) =>
      chapters.some((c) => c.classId === cls && c.subject === s.id)
    );
    if (subs.length === 1) {
      setSelectedSubject(subs[0].id);
    } else if (selectedSubject && !subs.find((s) => s.id === selectedSubject)) {
      setSelectedSubject(subs[0]?.id ?? null);
    } else if (!selectedSubject && subs.length > 0) {
      setSelectedSubject(null);
    }
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
    if (selectedChapters.length === 0 || !selectedClass || !selectedSubject) return;
    router.push(
      `/quiz?class=${selectedClass}&subject=${selectedSubject}&chapters=${selectedChapters.join(',')}`,
    );
  };

  const allSelected = selectedChapters.length === availableChapters.length && availableChapters.length > 0;

  const stepComplete = (step: number) => {
    if (step === 1) return !!selectedClass;
    if (step === 2) return !!selectedSubject;
    if (step === 3) return selectedChapters.length > 0;
    return false;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">

      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-600 via-violet-700 to-indigo-800 text-white py-14 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_60%)]" />
        <div className="max-w-5xl mx-auto text-center relative">
          <Link href="/" className="inline-flex items-center gap-1.5 text-purple-200 hover:text-white text-sm mb-6 transition-colors group">
            <span className="group-hover:-translate-x-0.5 transition-transform">&larr;</span> Back to Home
          </Link>
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-5xl mx-auto mb-5 shadow-lg">
            🧠
          </div>
          <h1 className="text-4xl font-extrabold mb-3 tracking-tight">Quiz & Revision</h1>
          <p className="text-purple-200 text-lg">Set up your quiz in 3 simple steps</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-5">

        {/* Step 1 — Class */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 transition-shadow hover:shadow-md">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2.5">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              stepComplete(1) ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
            }`}>
              {stepComplete(1) ? '✓' : '1'}
            </span>
            Step 1: Select your class
          </h2>
          <div className="flex flex-wrap gap-2">
            {CLASSES.map((cls) => {
              const hasContent = classesWithContent.some((c) => c.id === cls.id);
              return (
                <button
                  key={cls.id}
                  onClick={() => handleClassChange(cls.id)}
                  disabled={!hasContent}
                  title={!hasContent ? 'No chapters available yet' : undefined}
                  className={`px-4 py-2.5 rounded-xl font-semibold text-sm border transition-all ${
                    selectedClass === cls.id
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200'
                      : hasContent
                        ? 'bg-gray-50 text-gray-700 border-gray-200 hover:border-purple-400 hover:bg-purple-50'
                        : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                  }`}
                >
                  {cls.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2 — Subject */}
        <div className={`bg-white rounded-2xl border shadow-sm p-6 transition-all ${
          !selectedClass ? 'border-gray-100 opacity-50' : 'border-gray-100 hover:shadow-md'
        }`}>
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2.5">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              stepComplete(2) ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
            }`}>
              {stepComplete(2) ? '✓' : '2'}
            </span>
            Step 2: Select subject
            {!selectedClass && <span className="text-xs font-normal text-gray-400 ml-1">(select a class first)</span>}
          </h2>
          {!selectedClass ? (
            <p className="text-gray-400 text-sm py-2">Please select a class above to see available subjects.</p>
          ) : subjects.length === 0 ? (
            <p className="text-gray-400 text-sm py-2">No subjects available for this class yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {subjects.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => handleSubjectChange(sub.id)}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm border transition-all flex items-center gap-2 ${
                    selectedSubject === sub.id
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-purple-400 hover:bg-purple-50'
                  }`}
                >
                  <span className="text-lg">{sub.icon}</span> {sub.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Step 3 — Chapters */}
        <div className={`bg-white rounded-2xl border shadow-sm p-6 transition-all ${
          !selectedSubject ? 'border-gray-100 opacity-50' : 'border-gray-100 hover:shadow-md'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2.5">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                stepComplete(3) ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
              }`}>
                {stepComplete(3) ? '✓' : '3'}
              </span>
              Step 3: Select chapters
              {!selectedSubject && <span className="text-xs font-normal text-gray-400 ml-1">(select a subject first)</span>}
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

          {!selectedSubject ? (
            <p className="text-gray-400 text-sm py-4 text-center">
              Please select a class and subject above to see chapters.
            </p>
          ) : availableChapters.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">
              No chapters available for this class and subject yet. Try a different combination.
            </p>
          ) : (
            <div className="space-y-2">
              {availableChapters.map((ch, i) => (
                <label
                  key={ch.chapterId}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedChapters.includes(ch.chapterId)
                      ? 'bg-purple-50 border-purple-300 shadow-sm'
                      : 'bg-gray-50 border-gray-100 hover:border-purple-200 hover:bg-purple-50/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedChapters.includes(ch.chapterId)}
                    onChange={() => toggleChapter(ch.chapterId)}
                    className="mt-0.5 w-4 h-4 accent-purple-600 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">
                      <span className="text-purple-400 mr-1.5">{i + 1}.</span>
                      {ch.title}
                    </p>
                    {ch.description && (
                      <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{ch.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Summary & Start */}
        <div className="pt-2">
          {selectedChapters.length > 0 && (
            <p className="text-center text-sm text-gray-500 mb-3">
              {selectedChapters.length} chapter{selectedChapters.length > 1 ? 's' : ''} selected from {CLASSES.find(c => c.id === selectedClass)?.label}
            </p>
          )}
          <button
            onClick={handleStart}
            disabled={selectedChapters.length === 0}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
              selectedChapters.length > 0
                ? 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 active:scale-[0.99]'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {selectedChapters.length === 0
              ? 'Select at least one chapter to start'
              : `Start Quiz \u2192`}
          </button>
        </div>

      </div>
    </main>
  );
}
