'use client';

import Link from 'next/link';
import { useState } from 'react';

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

export default function HomePage() {
  const [quizClass, setQuizClass] = useState('class-6');
  const [quizSubject, setQuizSubject] = useState('science');
  const quizHref = `/class/${quizClass}/${quizSubject}`;

  return (
    <main className="min-h-screen bg-gray-50">

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-3">
            Class 3 to Class 7 · CBSE · NCERT
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            Learn CBSE the Easy Way
          </h1>
          <p className="text-blue-100 text-lg max-w-xl mx-auto">
            Simple explanations, real-life Indian examples, and 3-level
            worksheets — designed for every student.
          </p>
        </div>
      </section>

      {/* ── How do you want to learn today? ───────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
          How do you want to learn today?
        </h2>
        <p className="text-gray-400 text-center text-sm mb-10">
          Choose one of the options below to get started
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* ── Card 1 — Browse by Class ──────────────────────────────────── */}
          <div className="bg-white border-2 border-blue-100 rounded-2xl p-7 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col">
            <div className="flex items-start gap-4 mb-6">
              <span className="text-5xl leading-none">📘</span>
              <div>
                <h3 className="text-xl font-bold text-blue-900">Browse by Class</h3>
                <p className="text-blue-400 text-sm mt-1">
                  Pick your class, then explore subjects and chapters at your own pace
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-auto">
              {CLASSES.map((cls) => (
                <Link
                  key={cls.id}
                  href={`/class/${cls.id}`}
                  className="bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-800 font-semibold text-center py-3 rounded-xl transition-colors border border-blue-100 hover:border-blue-600"
                >
                  {cls.label}
                </Link>
              ))}
            </div>
          </div>

          {/* ── Card 2 — Quiz & Revision ──────────────────────────────────── */}
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-100 rounded-2xl p-7 shadow-sm hover:shadow-md hover:border-purple-300 transition-all flex flex-col">
            <div className="flex items-start gap-4 mb-6">
              <span className="text-5xl leading-none">🧠</span>
              <div>
                <h3 className="text-xl font-bold text-purple-900">Quiz &amp; Revision</h3>
                <p className="text-purple-400 text-sm mt-1">
                  Practice with MCQ quizzes or print question papers for any chapter
                </p>
              </div>
            </div>

            {/* Class picker */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">
                Select Class
              </p>
              <div className="flex flex-wrap gap-2">
                {CLASSES.map((cls) => (
                  <button
                    key={cls.id}
                    onClick={() => setQuizClass(cls.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      quizClass === cls.id
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-purple-400'
                    }`}
                  >
                    {cls.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject picker */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">
                Select Subject
              </p>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setQuizSubject(sub.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      quizSubject === sub.id
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-purple-400'
                    }`}
                  >
                    {sub.icon} {sub.label}
                  </button>
                ))}
              </div>
            </div>

            <Link
              href={quizHref}
              className="mt-auto w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Select Chapters &amp; Start →
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}
